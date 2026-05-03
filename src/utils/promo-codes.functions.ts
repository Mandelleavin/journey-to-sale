import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { type StripeEnv, createStripeClient } from "@/lib/stripe.server";

async function assertAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) throw new Error("Brak uprawnień administratora");
}

/**
 * Tworzy kod rabatowy w Stripe (Coupon + Promotion Code) na subskrypcje LUB jednorazowe paczki kredytów,
 * i zapisuje metadane w tabeli stripe_promo_codes.
 */
export const createStripePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (data: {
      environment: StripeEnv;
      code: string;
      kind: "subscription" | "one_time";
      discountType: "percent" | "amount";
      discountValue: number;
      currency?: string;
      duration: "once" | "forever" | "repeating";
      durationInMonths?: number;
      maxRedemptions?: number;
      expiresAt?: string | null;
      description?: string;
    }) => {
      if (!/^[A-Z0-9_-]{3,40}$/.test(data.code)) {
        throw new Error("Kod musi mieć 3-40 znaków: A-Z, 0-9, _ lub -");
      }
      if (data.discountValue <= 0) throw new Error("Wartość rabatu musi być > 0");
      if (data.discountType === "percent" && data.discountValue > 100) {
        throw new Error("Procent nie może przekraczać 100");
      }
      if (data.duration === "repeating" && (!data.durationInMonths || data.durationInMonths < 1)) {
        throw new Error("Podaj liczbę miesięcy dla rabatu cyklicznego");
      }
      if (data.kind === "one_time" && data.duration !== "once") {
        throw new Error("Kody na paczki muszą mieć duration = once");
      }
      return data;
    },
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const stripe = createStripeClient(data.environment);

    // Couponowy "applies_to" filtrujemy po stronie Stripe — pomijamy, walidację (subskrypcja vs paczka)
    // robimy lekkostronnie (Stripe i tak nie wymusi tego z poziomu Promotion Code).
    const couponPayload: any = {
      duration: data.duration,
      ...(data.duration === "repeating" && { duration_in_months: data.durationInMonths }),
      ...(data.maxRedemptions && { max_redemptions: data.maxRedemptions }),
      ...(data.expiresAt && { redeem_by: Math.floor(new Date(data.expiresAt).getTime() / 1000) }),
      name: data.description || data.code,
    };
    if (data.discountType === "percent") {
      couponPayload.percent_off = data.discountValue;
    } else {
      couponPayload.amount_off = Math.round(data.discountValue * 100);
      couponPayload.currency = (data.currency || "pln").toLowerCase();
    }

    const coupon = await stripe.coupons.create(couponPayload);

    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code: data.code,
      ...(data.maxRedemptions && { max_redemptions: data.maxRedemptions }),
      ...(data.expiresAt && { expires_at: Math.floor(new Date(data.expiresAt).getTime() / 1000) }),
    });

    const { data: row, error } = await supabaseAdmin
      .from("stripe_promo_codes")
      .insert({
        code: data.code,
        stripe_coupon_id: coupon.id,
        stripe_promotion_code_id: promo.id,
        environment: data.environment,
        kind: data.kind,
        discount_type: data.discountType,
        discount_value: data.discountValue,
        currency: data.discountType === "amount" ? (data.currency || "pln").toLowerCase() : null,
        duration: data.duration,
        duration_in_months: data.duration === "repeating" ? data.durationInMonths : null,
        max_redemptions: data.maxRedemptions ?? null,
        expires_at: data.expiresAt ?? null,
        description: data.description ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

/** Dezaktywuje promotion code w Stripe i lokalnie. Sam coupon zostawiamy w Stripe. */
export const deactivateStripePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const { data: row, error } = await supabaseAdmin
      .from("stripe_promo_codes")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("Nie znaleziono kodu");

    const stripe = createStripeClient(row.environment as StripeEnv);
    await stripe.promotionCodes.update(row.stripe_promotion_code_id, { active: false });

    await supabaseAdmin
      .from("stripe_promo_codes")
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq("id", data.id);
    return { ok: true };
  });

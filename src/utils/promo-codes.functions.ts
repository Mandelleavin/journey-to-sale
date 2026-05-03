import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const createSchema = z
  .object({
    environment: z.enum(["sandbox", "live"]),
    code: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9_-]{3,40}$/, "Kod musi mieć 3-40 znaków: A-Z, 0-9, _ lub -"),
    kind: z.enum(["subscription", "one_time"]),
    discountType: z.enum(["percent", "amount"]),
    discountValue: z.number().positive("Wartość rabatu musi być > 0"),
    currency: z.string().min(3).max(3).optional(),
    duration: z.enum(["once", "forever", "repeating"]),
    durationInMonths: z.number().int().min(1).max(36).optional(),
    maxRedemptions: z.number().int().min(1).max(1_000_000).optional(),
    expiresAt: z.string().nullable().optional(),
    minAmount: z.number().nonnegative().optional(),
    description: z.string().trim().max(500).optional(),
  })
  .superRefine((d, ctx) => {
    if (d.discountType === "percent" && d.discountValue > 100) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Procent nie może przekraczać 100" });
    }
    if (d.duration === "repeating" && !d.durationInMonths) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Podaj liczbę miesięcy dla rabatu cyklicznego",
      });
    }
    if (d.kind === "one_time" && d.duration !== "once") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Kody na paczki muszą być jednorazowe (duration = once)",
      });
    }
    if (d.expiresAt) {
      const t = Date.parse(d.expiresAt);
      if (Number.isNaN(t)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Niepoprawna data wygaśnięcia" });
      } else if (t < Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Data wygaśnięcia musi być w przyszłości",
        });
      }
    }
  });

/**
 * Tworzy kod rabatowy w Stripe (Coupon + Promotion Code) na subskrypcje LUB jednorazowe paczki kredytów.
 * Wspiera minimalną kwotę zamówienia (Stripe restrictions.minimum_amount).
 */
export const createStripePromoCode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: z.input<typeof createSchema>) => createSchema.parse(data))
  .handler(async ({ data, context }) => {
    await assertAdmin(context.userId);
    const stripe = createStripeClient(data.environment);

    const currency = (data.currency || "pln").toLowerCase();

    // Sprawdź czy kod już istnieje lokalnie (w danym env)
    const { data: existing } = await supabaseAdmin
      .from("stripe_promo_codes")
      .select("id")
      .eq("code", data.code)
      .eq("environment", data.environment)
      .eq("active", true)
      .maybeSingle();
    if (existing) {
      throw new Error(`Kod "${data.code}" już istnieje w środowisku ${data.environment}`);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      couponPayload.currency = currency;
    }

    const coupon = await stripe.coupons.create(couponPayload);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const promoPayload: any = {
      coupon: coupon.id,
      code: data.code,
      ...(data.maxRedemptions && { max_redemptions: data.maxRedemptions }),
      ...(data.expiresAt && { expires_at: Math.floor(new Date(data.expiresAt).getTime() / 1000) }),
    };
    if (data.minAmount && data.minAmount > 0) {
      promoPayload.restrictions = {
        minimum_amount: Math.round(data.minAmount * 100),
        minimum_amount_currency: currency,
      };
    }

    const promo = await stripe.promotionCodes.create(promoPayload);

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
        currency: data.discountType === "amount" ? currency : null,
        duration: data.duration,
        duration_in_months: data.duration === "repeating" ? data.durationInMonths : null,
        max_redemptions: data.maxRedemptions ?? null,
        expires_at: data.expiresAt ?? null,
        min_amount: data.minAmount && data.minAmount > 0 ? data.minAmount : null,
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
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
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

/**
 * Walidacja kodu rabatowego po stronie klienta (live check przed checkoutem).
 * Sprawdza ważność, limit użyć, minimum order, aktywność, środowisko.
 * Zwraca czytelny opis lub błąd.
 */
const validateSchema = z.object({
  code: z.string().trim().min(1).max(40),
  environment: z.enum(["sandbox", "live"]),
  kind: z.enum(["subscription", "one_time"]),
  /** Wartość zamówienia w PLN — opcjonalna, jeśli podana sprawdzamy minimum_amount */
  orderAmount: z.number().nonnegative().optional(),
});

export const validateStripePromoCode = createServerFn({ method: "POST" })
  .inputValidator((data: z.input<typeof validateSchema>) => validateSchema.parse(data))
  .handler(async ({ data }) => {
    const code = data.code.trim().toUpperCase();
    const { data: row } = await supabaseAdmin
      .from("stripe_promo_codes")
      .select("*")
      .eq("code", code)
      .eq("environment", data.environment)
      .maybeSingle();

    if (!row) {
      return { ok: false as const, error: "Nieprawidłowy kod rabatowy" };
    }
    if (!row.active) {
      return { ok: false as const, error: "Ten kod został dezaktywowany" };
    }
    if (row.kind !== data.kind) {
      const dst = row.kind === "subscription" ? "subskrypcji" : "paczek kredytów";
      return { ok: false as const, error: `Ten kod dotyczy tylko ${dst}` };
    }
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      return { ok: false as const, error: "Kod wygasł" };
    }
    if (row.max_redemptions != null && (row.times_redeemed ?? 0) >= row.max_redemptions) {
      return { ok: false as const, error: "Limit użyć tego kodu został wyczerpany" };
    }
    if (row.min_amount && data.orderAmount != null && data.orderAmount < Number(row.min_amount)) {
      return {
        ok: false as const,
        error: `Wymagana kwota zamówienia to min. ${Number(row.min_amount).toFixed(2)} PLN`,
      };
    }

    // Zwróć info do podglądu rabatu
    const discountLabel =
      row.discount_type === "percent"
        ? `-${Number(row.discount_value)}%`
        : `-${Number(row.discount_value)} ${(row.currency ?? "pln").toUpperCase()}`;

    const durationLabel =
      row.duration === "once"
        ? "tylko 1. miesiąc / pierwsze zamówienie"
        : row.duration === "forever"
          ? "co miesiąc, dopóki trwa subskrypcja"
          : `przez ${row.duration_in_months} miesięcy`;

    return {
      ok: true as const,
      code: row.code,
      discountLabel,
      durationLabel,
      minAmount: row.min_amount ? Number(row.min_amount) : null,
    };
  });

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { type StripeEnv, verifyWebhook } from "@/lib/stripe.server";

let _supabase: ReturnType<typeof createClient> | null = null;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
  }
  return _supabase;
}

// Mapowanie price_id -> liczba kredyt\u00f3w (zgodne z produktami w Stripe)
const PLAN_CREDITS: Record<string, number> = {
  plan_start_monthly: 80,
  plan_pro_monthly: 250,
  plan_vip_monthly: 700,
};
const PACK_CREDITS: Record<string, number> = {
  credits_pack_80_once: 80,
  credits_pack_250_once: 250,
  credits_pack_700_once: 700,
};

async function handleSubscriptionUpsert(subscription: any, env: StripeEnv) {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.error("No userId in subscription metadata");
    return;
  }
  const item = subscription.items?.data?.[0];
  const priceId = item?.price?.metadata?.lovable_external_id || item?.price?.id;
  const productId = item?.price?.product;
  const periodStart = item?.current_period_start ?? subscription.current_period_start;
  const periodEnd = item?.current_period_end ?? subscription.current_period_end;

  await getSupabase()
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer,
        product_id: productId,
        price_id: priceId,
        status: subscription.status,
        current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : null,
        current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        cancel_at_period_end: subscription.cancel_at_period_end || false,
        environment: env,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "stripe_subscription_id" },
    );

  // Aktualizuj plan w user_subscriptions + nadaj kredyty miesi\u0119czne
  if (subscription.status === "active" || subscription.status === "trialing") {
    const planMap: Record<string, string> = {
      plan_start_monthly: "start",
      plan_pro_monthly: "pro",
      plan_vip_monthly: "vip",
    };
    const plan = planMap[priceId];
    if (plan) {
      await getSupabase().from("user_subscriptions").upsert(
        {
          user_id: userId,
          plan,
          status: "active",
          current_period_start: periodStart ? new Date(periodStart * 1000).toISOString() : new Date().toISOString(),
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        },
        { onConflict: "user_id" },
      );
      const credits = PLAN_CREDITS[priceId];
      if (credits) {
        await getSupabase().rpc("add_credits", {
          _user_id: userId,
          _amount: credits,
          _type: "monthly",
          _description: `Aktywacja/odnowienie pakietu ${plan.toUpperCase()}`,
        });
      }
    }
  }
}

async function handleSubscriptionDeleted(subscription: any, env: StripeEnv) {
  await getSupabase()
    .from("subscriptions")
    .update({ status: "canceled", updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", subscription.id)
    .eq("environment", env);
}

async function handleCheckoutCompleted(session: any, env: StripeEnv) {
  // One-time pack: dolicz kredyty (idempotentnie)
  if (session.mode !== "payment") return;
  const userId = session.metadata?.userId;
  const priceId = session.metadata?.priceId;
  if (!userId || !priceId) return;
  const credits = PACK_CREDITS[priceId];
  if (!credits) return;

  // Idempotencja: upsert do processed_checkout_sessions
  const { error: dupErr } = await getSupabase()
    .from("processed_checkout_sessions")
    .insert({ session_id: session.id, user_id: userId, price_id: priceId, environment: env });
  if (dupErr) {
    // ju\u017c przetworzony
    return;
  }
  await getSupabase().rpc("add_credits", {
    _user_id: userId,
    _amount: credits,
    _type: "purchase",
    _description: `Zakup paczki ${credits} kredyt\u00f3w AI`,
  });
}

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);
  switch (event.type) {
    case "customer.subscription.created":
    case "customer.subscription.updated":
      await handleSubscriptionUpsert(event.data.object, env);
      break;
    case "customer.subscription.deleted":
      await handleSubscriptionDeleted(event.data.object, env);
      break;
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object, env);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawEnv = new URL(request.url).searchParams.get("env");
        if (rawEnv !== "sandbox" && rawEnv !== "live") {
          console.error("Webhook invalid env:", rawEnv);
          return Response.json({ received: true, ignored: "invalid env" });
        }
        try {
          await handleWebhook(request, rawEnv as StripeEnv);
          return Response.json({ received: true });
        } catch (e) {
          console.error("Webhook error:", e);
          return new Response("Webhook error", { status: 400 });
        }
      },
    },
  },
});

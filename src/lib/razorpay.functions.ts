import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function log(payment_id: string | null, user_id: string | null, event: string, level: "info" | "warn" | "error", message: string, metadata: Record<string, unknown> = {}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("payment_logs").insert({ payment_id, user_id, event, level, message, metadata: metadata as never });
  } catch (e) { console.error("[razorpay] failed to write payment log", e); }
}

const CANONICAL_PLANS = {
  plus: { name: "HumanLink Plus", price_cents: 4900 },
  volunteer: { name: "HumanLink Volunteer Plus", price_cents: 9900 },
  professional: { name: "HumanLink Professional", price_cents: 19900 },
  ngo: { name: "HumanLink NGO", price_cents: 29900 },
  business: { name: "HumanLink Business", price_cents: 59900 },
  healthcare: { name: "HumanLink Healthcare Partner", price_cents: 99900 },
  education: { name: "HumanLink Education Partner", price_cents: 49900 },
  csr: { name: "HumanLink CSR Partner", price_cents: 249900 },
} as const;
type PlanKey = keyof typeof CANONICAL_PLANS;

function keyFromInput(plan_key?: string, amount?: number): PlanKey | null {
  const k = plan_key?.toLowerCase() as PlanKey | undefined;
  if (k && k in CANONICAL_PLANS) return k;
  const matches = (Object.entries(CANONICAL_PLANS) as [PlanKey, { price_cents: number }][]).filter(([, p]) => p.price_cents === amount || p.price_cents === (amount ?? 0) * 100);
  return matches.length === 1 ? matches[0][0] : null;
}

export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ plan_id: z.string().optional(), plan_key: z.string().optional(), amount: z.number().optional() }).refine((v) => v.plan_id || v.plan_key || v.amount, { message: "plan_id, plan_key or amount required" }).parse(data))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay credentials missing on backend");
    const { userId, supabase } = context;
    const planKey = keyFromInput(data.plan_key, data.amount);
    let plan: { id: string | null; name: string; price_cents: number; currency: string } | null = null;

    if (planKey) {
      const canonical = CANONICAL_PLANS[planKey];
      const { data: row, error } = await supabase
        .from("premium_plans")
        .select("id, name, price_cents, currency, is_active")
        .eq("name", canonical.name)
        .eq("is_active", true)
        .maybeSingle();
      if (error) await log(null, userId, "plan.lookup_failed", "warn", error.message);
      if (row) {
        if (row.price_cents !== canonical.price_cents || (row.currency ?? "INR") !== "INR") {
          await log(null, userId, "plan.configuration_invalid", "error", "Premium plan price/currency does not match canonical configuration", { plan: planKey, db_price_cents: row.price_cents, expected_price_cents: canonical.price_cents, currency: row.currency });
          throw new Error("Payment plan is temporarily unavailable. Please try again later.");
        }
        plan = row;
      } else {
        plan = { id: null, name: canonical.name, price_cents: canonical.price_cents, currency: "INR" };
      }
    } else if (data.plan_id && /^[0-9a-f-]{36}$/i.test(data.plan_id)) {
      const { data: row } = await supabase.from("premium_plans").select("id, name, price_cents, currency, is_active").eq("id", data.plan_id).maybeSingle();
      if (row?.is_active) {
        const supported = (Object.values(CANONICAL_PLANS) as { price_cents: number }[]).some((p) => p.price_cents === row.price_cents);
        if (supported && (row.currency ?? "INR") === "INR") plan = row;
      }
    }

    if (!plan) throw new Error("Plan not available");

    const receipt = `hl_${userId.slice(0, 8)}_${Date.now().toString(36)}`;
    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64") },
      body: JSON.stringify({ amount: plan.price_cents, currency: plan.currency, receipt, notes: { user_id: userId, plan_id: plan.id, plan_name: plan.name } }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      await log(null, userId, "order.create_failed", "error", "Razorpay order API error", { status: resp.status, body: text });
      if (resp.status === 401) throw new Error("Razorpay credentials invalid on backend");
      throw new Error("Failed to create Razorpay order");
    }

    const order = (await resp.json()) as { id: string; amount: number; currency: string };
    if (!order.id || order.amount !== plan.price_cents || order.currency !== plan.currency) {
      await log(null, userId, "order.invalid_response", "error", "Razorpay returned an unexpected order", { order_id: order.id, amount: order.amount, currency: order.currency });
      throw new Error("Invalid Razorpay order response");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: paymentRow, error: insErr } = await supabaseAdmin.from("payments").insert({ user_id: userId, razorpay_order_id: order.id, amount: order.amount, currency: order.currency, status: "created", plan_name: plan.name, plan_id: plan.id, notes: { receipt } }).select("id").single();
    if (insErr) { await log(null, userId, "order.persist_failed", "error", insErr.message); throw new Error("Could not save order"); }
    await log(paymentRow.id, userId, "order.created", "info", "Order created", { order_id: order.id, amount: order.amount, plan: plan.name });
    return { order_id: order.id, amount: order.amount, currency: order.currency, key_id: keyId, plan_name: plan.name };
  });

export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ razorpay_order_id: z.string().min(1), razorpay_payment_id: z.string().min(1), razorpay_signature: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");
    const { userId } = context;
    const expected = createHmac("sha256", keySecret).update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`).digest("hex");
    const given = data.razorpay_signature;
    const ok = expected.length === given.length && timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(given, "utf8"));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment, error: paymentErr } = await supabaseAdmin.from("payments").select("id, user_id, plan_id, plan_name, amount, currency, status").eq("razorpay_order_id", data.razorpay_order_id).maybeSingle();
    if (paymentErr) { await log(null, userId, "verify.lookup_failed", "error", paymentErr.message); throw new Error("Could not load payment record"); }
    if (!payment) throw new Error("Unknown order");
    if (payment.user_id !== userId) throw new Error("Not your payment");
    if (payment.status === "paid") {
      const { data: existingSubscription, error: existingSubscriptionErr } = await supabaseAdmin
        .from("subscriptions")
        .select("id, tier, expires_at")
        .eq("payment_id", payment.id)
        .maybeSingle();
      if (existingSubscriptionErr) {
        await log(payment.id, userId, "subscription.recovery_lookup_failed", "error", existingSubscriptionErr.message);
        throw new Error("Could not verify subscription activation");
      }
      if (existingSubscription) {
        return { ok: true, already: true, payment_id: payment.id, tier: existingSubscription.tier, expires_at: existingSubscription.expires_at };
      }
      await log(payment.id, userId, "subscription.recovery", "warn", "Payment was already marked paid but subscription was missing; retrying activation");
    }
    if (!ok) {
      await supabaseAdmin.from("payments").update({ status: "failed", razorpay_payment_id: data.razorpay_payment_id }).eq("id", payment.id);
      await log(payment.id, userId, "verify.failed", "warn", "Payment signature verification failed");
      throw new Error("Payment verification failed");
    }

    const { error: paidErr } = await supabaseAdmin.from("payments").update({ status: "paid", razorpay_payment_id: data.razorpay_payment_id, razorpay_signature: data.razorpay_signature, verified_at: new Date().toISOString() }).eq("id", payment.id).neq("status", "paid");
    if (paidErr) { await log(payment.id, userId, "verify.persist_failed", "error", paidErr.message); throw new Error("Could not finalize payment"); }

    const nameLower = (payment.plan_name ?? "").toLowerCase();
    const tier = nameLower.includes("healthcare") ? "healthcare"
      : nameLower.includes("education") ? "education"
      : nameLower.includes("csr") ? "csr"
      : nameLower.includes("business") ? "business"
      : nameLower.includes("ngo") ? "ngo"
      : nameLower.includes("professional") ? "professional"
      : nameLower.includes("volunteer") ? "volunteer"
      : nameLower.includes("plus") ? "plus"
      : "basic";
    const expiresAt = new Date(); expiresAt.setMonth(expiresAt.getMonth() + 1);

    const { error: supersedeErr } = await supabaseAdmin.from("subscriptions").update({ status: "superseded" }).eq("user_id", userId).eq("status", "active");
    if (supersedeErr) await log(payment.id, userId, "subscription.supersede_failed", "warn", supersedeErr.message);

    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({ user_id: userId, plan_id: payment.plan_id, plan_name: payment.plan_name, tier, status: "active", payment_id: payment.id, expires_at: expiresAt.toISOString() });
    if (subErr) { await log(payment.id, userId, "subscription.create_failed", "error", subErr.message); throw new Error("Payment succeeded but subscription activation failed. Please contact support."); }

    const { error: profileTierErr } = await supabaseAdmin.from("profiles").update({ premium_tier: tier }).eq("id", userId);
    if (profileTierErr) await log(payment.id, userId, "profile.tier_update_failed", "warn", profileTierErr.message, { tier });

    if (payment.plan_id) {
      const { error: rpcErr } = await context.supabase.rpc("activate_premium" as never, { _plan_id: payment.plan_id } as never);
      if (rpcErr) await log(payment.id, userId, "activate.rpc_failed", "warn", rpcErr.message);
    }

    const { error: notificationErr } = await supabaseAdmin.from("notifications").insert({ user_id: userId, kind: "payment", title: `${payment.plan_name} activated`, body: `Your subscription is active until ${expiresAt.toDateString()}.`, link: "/settings" });
    if (notificationErr) await log(payment.id, userId, "notification.failed", "warn", notificationErr.message);

    await log(payment.id, userId, "verify.success", "info", "Payment verified", { amount: payment.amount, tier });
    return { ok: true, payment_id: payment.id, tier, expires_at: expiresAt.toISOString() };
  });


async function razorpayRequest(path: string, method: "GET" | "POST", keyId: string, keySecret: string, body?: unknown) {
  const response = await fetch(`https://api.razorpay.com/v1/${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const raw = await response.text();
  let data: any = null;
  try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
  if (!response.ok) {
    console.error("[razorpay] api error", path, response.status, raw.slice(0, 1000));
    throw new Error(response.status === 401 ? "Razorpay credentials invalid on backend" : "Razorpay subscription service returned an error");
  }
  return data;
}

export const createRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ plan_key: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay credentials missing on backend");
    const planKey = data.plan_key.toLowerCase() as PlanKey;
    if (!(planKey in CANONICAL_PLANS)) throw new Error("Unsupported subscription plan");
    const canonical = CANONICAL_PLANS[planKey];
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    let { data: plan, error: planErr } = await supabaseAdmin
      .from("premium_plans")
      .select("id, name, price_cents, currency, is_active, razorpay_plan_id")
      .eq("name", canonical.name)
      .eq("is_active", true)
      .maybeSingle();
    if (planErr) await log(null, context.userId, "subscription.plan_lookup_failed", "warn", planErr.message);

    if (plan && (plan.price_cents !== canonical.price_cents || (plan.currency ?? "INR") !== "INR")) {
      throw new Error("Subscription plan is temporarily unavailable.");
    }
    if (!plan) {
      throw new Error("Subscription plan is not configured. Please contact HumanLink support.");
    }

    let razorpayPlanId = plan.razorpay_plan_id as string | null;
    if (!razorpayPlanId) {
      const created = await razorpayRequest("plans", "POST", keyId, keySecret, {
        period: "monthly",
        interval: 1,
        item: {
          name: canonical.name,
          amount: canonical.price_cents,
          currency: "INR",
          description: `${canonical.name} monthly subscription`,
        },
        notes: { humanlink_plan_key: planKey },
      });
      razorpayPlanId = created?.id;
      if (!razorpayPlanId) throw new Error("Razorpay did not return a subscription plan ID");
      const { error: savePlanErr } = await supabaseAdmin.from("premium_plans").update({ razorpay_plan_id: razorpayPlanId }).eq("id", plan.id);
      if (savePlanErr) await log(null, context.userId, "subscription.plan_id_save_failed", "warn", savePlanErr.message);
    }

    const existing = await supabaseAdmin
      .from("subscriptions")
      .select("id, razorpay_subscription_id, status, current_period_end, expires_at")
      .eq("user_id", context.userId)
      .in("status", ["active", "authenticated"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existing.data?.razorpay_subscription_id) {
      return { subscription_id: existing.data.razorpay_subscription_id, plan_name: canonical.name, key_id: keyId, existing: true };
    }

    const subscription = await razorpayRequest("subscriptions", "POST", keyId, keySecret, {
      plan_id: razorpayPlanId,
      customer_notify: 1,
      total_count: 120,
      notes: { user_id: context.userId, plan_key: planKey, humanlink_plan_id: plan.id },
    });
    if (!subscription?.id) throw new Error("Razorpay did not create the subscription");

    const start = subscription.current_start ? new Date(subscription.current_start * 1000).toISOString() : null;
    const end = subscription.current_end ? new Date(subscription.current_end * 1000).toISOString() : null;
    const { error: subErr } = await supabaseAdmin.from("subscriptions").insert({
      user_id: context.userId,
      plan_id: plan.id,
      plan_name: canonical.name,
      tier: planKey,
      status: subscription.status === "authenticated" ? "authenticated" : "active",
      razorpay_subscription_id: subscription.id,
      current_period_start: start,
      current_period_end: end,
      expires_at: end,
      cancel_at_period_end: false,
    });
    if (subErr) {
      await log(null, context.userId, "subscription.persist_failed", "error", subErr.message, { subscription_id: subscription.id });
      throw new Error("Subscription was created but could not be saved. Please contact HumanLink support.");
    }

    await log(null, context.userId, "subscription.created", "info", "Recurring Razorpay subscription created", { subscription_id: subscription.id, plan: canonical.name });
    return { subscription_id: subscription.id, plan_name: canonical.name, key_id: keyId, existing: false };
  });

export const verifyRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({
    razorpay_payment_id: z.string().min(1),
    razorpay_subscription_id: z.string().min(1),
    razorpay_signature: z.string().min(1),
  }).parse(data))
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");
    const expected = createHmac("sha256", keySecret).update(`${data.razorpay_payment_id}|${data.razorpay_subscription_id}`).digest("hex");
    const given = data.razorpay_signature;
    const ok = expected.length === given.length && timingSafeEqual(Buffer.from(expected), Buffer.from(given));
    if (!ok) throw new Error("Subscription verification failed");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id, user_id, plan_id, plan_name, tier, status, razorpay_subscription_id")
      .eq("razorpay_subscription_id", data.razorpay_subscription_id)
      .maybeSingle();
    if (!sub || sub.user_id !== context.userId) throw new Error("Subscription not found");

    const now = new Date();
    const expiresAt = new Date(now);
    expiresAt.setMonth(expiresAt.getMonth() + 1);
    const { error: updateErr } = await supabaseAdmin.from("subscriptions").update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: expiresAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    }).eq("id", sub.id);
    if (updateErr) throw new Error("Payment succeeded but subscription activation failed");

    await supabaseAdmin.from("payments").insert({
      user_id: context.userId,
      razorpay_payment_id: data.razorpay_payment_id,
      razorpay_subscription_id: data.razorpay_subscription_id,
      amount: 0,
      currency: "INR",
      status: "paid",
      plan_name: sub.plan_name,
      plan_id: sub.plan_id,
      razorpay_signature: data.razorpay_signature,
      verified_at: now.toISOString(),
      notes: { kind: "subscription_initial_charge" },
    });

    await supabaseAdmin.from("profiles").update({ premium_tier: sub.tier }).eq("id", context.userId);
    await log(null, context.userId, "subscription.verified", "info", "Recurring subscription verified", { subscription_id: data.razorpay_subscription_id, tier: sub.tier });
    return { ok: true, tier: sub.tier, expires_at: expiresAt.toISOString() };
  });

export const cancelRazorpaySubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ razorpay_subscription_id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) throw new Error("Razorpay is not configured");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin.from("subscriptions")
      .select("id, user_id, status")
      .eq("razorpay_subscription_id", data.razorpay_subscription_id)
      .maybeSingle();
    if (!sub || sub.user_id !== context.userId) throw new Error("Subscription not found");
    await razorpayRequest(`subscriptions/${data.razorpay_subscription_id}/cancel`, "POST", keyId, keySecret, { cancel_at_cycle_end: 0 });
    await supabaseAdmin.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancel_at_period_end: false }).eq("id", sub.id);
    return { ok: true };
  });

export const cancelRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ razorpay_order_id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin.from("payments").select("id, user_id, status").eq("razorpay_order_id", data.razorpay_order_id).maybeSingle();
    if (!payment || payment.user_id !== context.userId) return { ok: false };
    if (payment.status === "created") await supabaseAdmin.from("payments").update({ status: "cancelled" }).eq("id", payment.id);
    return { ok: true };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin.from("subscriptions").select("id").eq("user_id", context.userId).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    if (!sub) return { ok: false };
    await supabaseAdmin.from("subscriptions").update({ status: "cancelled", cancelled_at: new Date().toISOString() }).eq("id", sub.id);
    return { ok: true };
  });

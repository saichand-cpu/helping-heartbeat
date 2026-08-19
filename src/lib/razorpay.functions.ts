import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHmac, timingSafeEqual } from "crypto";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function log(
  payment_id: string | null,
  user_id: string | null,
  event: string,
  level: "info" | "warn" | "error",
  message: string,
  metadata: Record<string, unknown> = {},
) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("payment_logs")
      .insert({ payment_id, user_id, event, level, message, metadata: metadata as never });
  } catch (e) {
    console.error("[razorpay] failed to write payment log", e);
  }
}

/** Creates a Razorpay order for the selected premium plan and returns checkout options. */
export const createRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ plan_id: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      // Descriptive, actionable error instead of a generic checkout failure.
      throw new Error("Razorpay credentials missing on backend");
    }

    const { userId, supabase } = context;

    const { data: plan, error: planErr } = await supabase
      .from("premium_plans")
      .select("id, name, price_cents, currency, interval, is_active")
      .eq("id", data.plan_id)
      .maybeSingle();
    if (planErr || !plan || !plan.is_active) throw new Error("Plan not available");

    const receipt = `hl_${userId.slice(0, 8)}_${Date.now().toString(36)}`;

    const resp = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64"),
      },
      body: JSON.stringify({
        amount: plan.price_cents,
        currency: plan.currency ?? "INR",
        receipt,
        notes: { user_id: userId, plan_id: plan.id, plan_name: plan.name },
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      await log(null, userId, "order.create_failed", "error", "Razorpay order API error", { status: resp.status, body: text });
      throw new Error("Failed to create Razorpay order");
    }

    const order = (await resp.json()) as { id: string; amount: number; currency: string };

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: paymentRow, error: insErr } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: userId,
        razorpay_order_id: order.id,
        amount: order.amount,
        currency: order.currency,
        status: "created",
        plan_name: plan.name,
        plan_id: plan.id,
        notes: { receipt },
      })
      .select("id")
      .single();

    if (insErr) {
      await log(null, userId, "order.persist_failed", "error", insErr.message);
      throw new Error("Could not save order");
    }

    await log(paymentRow.id, userId, "order.created", "info", "Order created", { order_id: order.id, amount: order.amount });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: keyId,
      plan_name: plan.name,
    };
  });

/** Verifies Razorpay signature, marks payment paid, provisions subscription, upgrades profile. */
export const verifyRazorpayPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) =>
    z
      .object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) throw new Error("Razorpay is not configured");
    const { userId } = context;

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");

    const given = data.razorpay_signature;
    const ok =
      expected.length === given.length &&
      timingSafeEqual(Buffer.from(expected, "utf8"), Buffer.from(given, "utf8"));

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, plan_id, plan_name, amount, currency, status")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();

    if (!payment) throw new Error("Unknown order");
    if (payment.user_id !== userId) {
      await log(payment.id, userId, "verify.owner_mismatch", "error", "Payment does not belong to caller");
      throw new Error("Not your payment");
    }
    if (payment.status === "paid") {
      // idempotent
      return { ok: true, already: true, payment_id: payment.id };
    }

    if (!ok) {
      await supabaseAdmin
        .from("payments")
        .update({ status: "failed", razorpay_payment_id: data.razorpay_payment_id })
        .eq("id", payment.id);
      await log(payment.id, userId, "verify.signature_mismatch", "error", "Signature verification failed");
      throw new Error("Payment verification failed");
    }

    // Mark paid
    await supabaseAdmin
      .from("payments")
      .update({
        status: "paid",
        razorpay_payment_id: data.razorpay_payment_id,
        razorpay_signature: data.razorpay_signature,
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Derive tier + expiry
    const nameLower = (payment.plan_name ?? "").toLowerCase();
    const tier = nameLower.includes("ngo")
      ? "ngo"
      : nameLower.includes("pro")
        ? "pro"
        : nameLower.includes("plus")
          ? "plus"
          : "basic";
    // Assume monthly plans
    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 1);

    // Deactivate old active subs for this user
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "superseded" })
      .eq("user_id", userId)
      .eq("status", "active");

    await supabaseAdmin.from("subscriptions").insert({
      user_id: userId,
      plan_id: payment.plan_id,
      plan_name: payment.plan_name,
      tier,
      status: "active",
      payment_id: payment.id,
      expires_at: expiresAt.toISOString(),
    });

    // Upgrade the profile via the user-scoped RPC (respects premium guard)
    const { error: rpcErr } = await context.supabase.rpc("activate_premium" as never, {
      _plan_id: payment.plan_id,
    } as never);
    if (rpcErr) {
      await log(payment.id, userId, "activate.rpc_failed", "warn", rpcErr.message);
    }

    // In-app notification
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      kind: "payment",
      title: `${payment.plan_name} activated`,
      body: `Your subscription is active until ${expiresAt.toDateString()}.`,
      link: "/dashboard",
    });

    await log(payment.id, userId, "verify.success", "info", "Payment verified", {
      amount: payment.amount,
      tier,
    });

    return { ok: true, payment_id: payment.id, tier, expires_at: expiresAt.toISOString() };
  });

/** Records a client-side cancel/dismiss event against a pending payment. */
export const cancelRazorpayOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ razorpay_order_id: z.string().min(1) }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .select("id, user_id, status")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();
    if (!payment || payment.user_id !== context.userId) return { ok: false };
    if (payment.status === "created") {
      await supabaseAdmin.from("payments").update({ status: "cancelled" }).eq("id", payment.id);
      await log(payment.id, context.userId, "order.cancelled", "info", "User dismissed checkout");
    }
    return { ok: true };
  });

/** Cancels the caller's active subscription (does not refund; auto-expires on `expires_at`). */
export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin
      .from("subscriptions")
      .select("id")
      .eq("user_id", context.userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!sub) return { ok: false };
    await supabaseAdmin
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", sub.id);
    return { ok: true };
  });

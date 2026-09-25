import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error("Supabase server configuration missing");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

function verifySignature(raw: string, signature: string, secret: string) {
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (expected.length !== signature.length) return false;
  return timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export const Route = createFileRoute("/api/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
        if (!secret) return Response.json({ error: "Webhook not configured" }, { status: 503 });
        const raw = await request.text();
        const signature = request.headers.get("x-razorpay-signature") ?? "";
        if (!signature || !verifySignature(raw, signature, secret)) {
          return Response.json({ error: "Invalid signature" }, { status: 401 });
        }

        let payload: any;
        try { payload = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }

        const event = String(payload?.event ?? "");
        const entity = payload?.payload?.subscription?.entity;
        const subscriptionId = entity?.id as string | undefined;
        if (!subscriptionId) return Response.json({ ok: true, ignored: true });

        const supabase = adminClient();
        const { data: sub } = await supabase.from("subscriptions")
          .select("id, user_id, tier, status")
          .eq("razorpay_subscription_id", subscriptionId)
          .maybeSingle();
        if (!sub) return Response.json({ ok: true, ignored: true });

        const currentStart = entity?.current_start ? new Date(entity.current_start * 1000).toISOString() : null;
        const currentEnd = entity?.current_end ? new Date(entity.current_end * 1000).toISOString() : null;

        if (["subscription.activated", "subscription.authenticated", "subscription.charged", "subscription.resumed"].includes(event)) {
          const update: Record<string, unknown> = { status: "active", cancel_at_period_end: false };
          if (currentStart) update.current_period_start = currentStart;
          if (currentEnd) { update.current_period_end = currentEnd; update.expires_at = currentEnd; }
          await supabase.from("subscriptions").update(update).eq("id", sub.id);
          await supabase.from("profiles").update({ premium_tier: sub.tier }).eq("id", sub.user_id);
        } else if (["subscription.cancelled", "subscription.halted", "subscription.completed"].includes(event)) {
          await supabase.from("subscriptions").update({
            status: event === "subscription.completed" ? "expired" : "cancelled",
            cancel_at_period_end: false,
            ...(currentEnd ? { current_period_end: currentEnd, expires_at: currentEnd } : {}),
          }).eq("id", sub.id);
          if (event !== "subscription.cancelled") {
            await supabase.from("profiles").update({ premium_tier: "free" }).eq("id", sub.user_id);
          }
        }

        return Response.json({ ok: true });
      },
    },
  },
});

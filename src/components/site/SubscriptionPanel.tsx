import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Crown, HeartHandshake, Sparkles, Loader2, XCircle, Receipt, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cancelSubscription } from "@/lib/razorpay.functions";
import { RazorpayCheckoutModal } from "./RazorpayCheckoutModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Subscription = {
  id: string;
  plan_name: string;
  tier: string;
  status: string;
  expires_at: string;
  cancelled_at: string | null;
  started_at: string;
};

type Payment = {
  id: string;
  razorpay_order_id: string;
  razorpay_payment_id: string | null;
  amount: number;
  currency: string;
  status: string;
  plan_name: string;
  created_at: string;
};

export function SubscriptionPanel() {
  const { user } = useAuth();
  const cancel = useServerFn(cancelSubscription);
  const [sub, setSub] = useState<Subscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCheckout, setOpenCheckout] = useState<"pro" | "ngo" | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: subs }, { data: pays }] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("id, plan_name, tier, status, expires_at, cancelled_at, started_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1),
      supabase
        .from("payments")
        .select("id, razorpay_order_id, razorpay_payment_id, amount, currency, status, plan_name, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    setSub((subs?.[0] as Subscription | undefined) ?? null);
    setPayments((pays as Payment[] | null) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void load();
    const refresh = () => void load();
    window.addEventListener("humanlink:premium-updated", refresh);
    return () => window.removeEventListener("humanlink:premium-updated", refresh);
  }, [user?.id]);

  const isActive = sub?.status === "active" && new Date(sub.expires_at) > new Date();
  const isGold = sub?.tier === "pro" || sub?.tier === "plus";

  const doCancel = async () => {
    if (!confirm("Cancel your subscription? Your benefits stay active until the current period ends.")) return;
    setCancelling(true);
    try {
      await cancel();
      toast.success("Subscription cancelled — benefits remain until expiry.");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to cancel");
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "glass rounded-3xl p-6 shadow-soft relative overflow-hidden",
          isActive && isGold && "border border-amber-500/40",
          isActive && sub?.tier === "ngo" && "border border-emerald-500/40",
        )}
      >
        {isActive && (
          <div
            className={cn(
              "absolute -top-16 -right-16 h-40 w-40 rounded-full opacity-30 blur-3xl",
              isGold ? "bg-amber-500" : "bg-emerald-500",
            )}
          />
        )}
        <div className="flex items-start justify-between flex-wrap gap-3 relative">
          <div>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Subscription
            </div>
            {loading ? (
              <div className="h-8 w-40 mt-2 bg-muted animate-pulse rounded" />
            ) : isActive && sub ? (
              <>
                <div className="mt-2 flex items-center gap-2">
                  {isGold ? (
                    <Crown className="h-6 w-6 text-amber-500" />
                  ) : (
                    <HeartHandshake className="h-6 w-6 text-emerald-500" />
                  )}
                  <h3 className="text-2xl font-bold">{sub.plan_name}</h3>
                  <Badge variant={sub.cancelled_at ? "secondary" : "default"} className="ml-1">
                    {sub.cancelled_at ? "Cancels at period end" : "Active"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {sub.cancelled_at ? "Ends" : "Renews"} on{" "}
                  <span className="font-medium text-foreground">
                    {new Date(sub.expires_at).toLocaleDateString(undefined, {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </p>
              </>
            ) : (
              <>
                <h3 className="mt-2 text-2xl font-bold">Free plan</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Upgrade for verified badges, priority visibility, and premium AI.
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            {isActive ? (
              <>
                <Button variant="outline" onClick={() => setOpenCheckout(sub?.tier === "ngo" ? "pro" : "pro")}>
                  Change plan
                </Button>
                {!sub?.cancelled_at && (
                  <Button variant="ghost" onClick={doCancel} disabled={cancelling}>
                    {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
                    Cancel
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={() => setOpenCheckout("ngo")}
                  className="bg-emerald-500 hover:bg-emerald-500/90 text-black border-0"
                >
                  <HeartHandshake className="h-4 w-4 mr-1" /> NGO · ₹299
                </Button>
                <Button
                  onClick={() => setOpenCheckout("pro")}
                  className="bg-amber-500 hover:bg-amber-500/90 text-black border-0 shadow-glow"
                >
                  <Crown className="h-4 w-4 mr-1" /> Pro · ₹599
                </Button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      <div className="glass rounded-3xl p-6 shadow-soft">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Receipt className="h-4 w-4 text-primary" /> Payment history
        </div>
        {loading ? (
          <div className="mt-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 bg-muted/40 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : payments.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-3">No payments yet.</p>
        ) : (
          <div className="mt-4 divide-y divide-border">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{p.plan_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(p.created_at).toLocaleString()} · {p.razorpay_payment_id ?? p.razorpay_order_id}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="font-semibold">
                    ₹{(p.amount / 100).toLocaleString("en-IN")}
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1">
          <ExternalLink className="h-3 w-3" /> All payments are processed securely by Razorpay.
        </p>
      </div>

      <RazorpayCheckoutModal
        open={!!openCheckout}
        defaultTier={openCheckout ?? "pro"}
        onOpenChange={(v) => !v && setOpenCheckout(null)}
        onSuccess={load}
      />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Paid", cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" },
    created: { label: "Pending", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
    failed: { label: "Failed", cls: "bg-destructive/15 text-destructive" },
    cancelled: { label: "Cancelled", cls: "bg-muted text-muted-foreground" },
    refunded: { label: "Refunded", cls: "bg-blue-500/15 text-blue-600 dark:text-blue-400" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <span className={cn("text-[11px] px-2 py-0.5 rounded-full font-medium", s.cls)}>{s.label}</span>;
}

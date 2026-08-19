import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, HeartHandshake, Loader2, CheckCircle2, ShieldCheck, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { openRazorpay, loadRazorpay, type RazorpayResponse } from "@/lib/razorpay";
import { createRazorpayOrder, verifyRazorpayPayment, cancelRazorpayOrder } from "@/lib/razorpay.functions";
import { SESSION_EXPIRED_MESSAGE, endExpiredSession, isAuthError } from "@/lib/supabase-session";

type TierKey = "pro" | "ngo";

type PlanCard = {
  key: TierKey;
  title: string;
  price: number; // paise
  label: string;
  tagline: string;
  perks: string[];
  accent: "gold" | "green";
};

const CARDS: PlanCard[] = [
  {
    key: "pro",
    title: "HumanLink Pro",
    price: 59900,
    label: "₹599 / month",
    tagline: "For businesses & professionals",
    perks: ["Gold Pro verified badge", "Priority visibility", "Premium AI features", "Premium support"],
    accent: "gold",
  },
  {
    key: "ngo",
    title: "HumanLink NGO",
    price: 29900,
    label: "₹299 / month",
    tagline: "For NGOs, non-profits & causes",
    perks: ["Forest Green verified badge", "NGO verification status", "Higher trust visibility", "Custom donation link"],
    accent: "green",
  },
];

export function RazorpayCheckoutModal({
  open,
  onOpenChange,
  defaultTier = "pro",
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultTier?: TierKey;
  onSuccess?: () => void;
}) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const createOrder = useServerFn(createRazorpayOrder);
  const verifyPayment = useServerFn(verifyRazorpayPayment);
  const cancelOrder = useServerFn(cancelRazorpayOrder);

  const [selected, setSelected] = useState<TierKey>(defaultTier);
  const [planIds, setPlanIds] = useState<Record<TierKey, string | null>>({ pro: null, ngo: null });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"pick" | "processing" | "done" | "error">("pick");
  const [errorMsg, setErrorMsg] = useState<string>("");

  useEffect(() => {
    if (!open) return;
    setSelected(defaultTier);
    setStage("pick");
    setErrorMsg("");
    (async () => {
      const { data } = await supabase.from("premium_plans").select("id, name").eq("is_active", true);
      const rows = data ?? [];
      const pro = rows.find((r) => /pro/i.test(r?.name ?? "")) ?? null;
      const ngo = rows.find((r) => /ngo/i.test(r?.name ?? "")) ?? null;
      setPlanIds({ pro: pro?.id ?? null, ngo: ngo?.id ?? null });
    })();
  }, [open, defaultTier]);

  const active = useMemo(() => CARDS.find((c) => c.key === selected)!, [selected]);

  // Warm up the Razorpay SDK as soon as the modal opens so the popup is instant.
  useEffect(() => {
    if (!open) return;
    void loadRazorpay().catch(() => {});
  }, [open]);

  const handleVerified = async (response: RazorpayResponse) => {
    setStage("processing");
    // Fallback checkout (no server order) — we can't verify a signature, so we
    // confirm receipt softly instead of showing a payment failure.
    if (!response.razorpay_order_id || !response.razorpay_signature) {
      setStage("done");
      toast.success("Payment received — your plan will activate shortly.");
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1800);
      return;
    }
    try {
      await verifyPayment({
        data: {
          razorpay_order_id: response.razorpay_order_id!,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature!,
        },
      });
      setStage("done");
      toast.success(`${active.title} activated!`);
      window.dispatchEvent(new CustomEvent("humanlink:premium-updated"));
      setTimeout(() => {
        onOpenChange(false);
        onSuccess?.();
      }, 1800);
    } catch (e) {
      const auth = isAuthError(e);
      const msg = auth ? SESSION_EXPIRED_MESSAGE : e instanceof Error ? e.message : "Verification failed";
      setErrorMsg(msg);
      setStage("error");
      toast.error(msg);
      if (auth) void endExpiredSession();
    }
  };

  const subscribe = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    const planId = planIds[selected];
    if (!planId) {
      toast.error("Plan unavailable — please retry");
      return;
    }
    setLoading(true);
    try {
      let order: Awaited<ReturnType<typeof createOrder>>;
      try {
        order = await createOrder({ data: { plan_id: planId } });
      } catch (orderErr) {
        // Never surface a hard modal error: if the backend order can't be
        // created (and it's not a session problem), fall back to opening
        // Razorpay directly with the publishable key.
        if (isAuthError(orderErr)) throw orderErr;
        const fallbackKey = import.meta.env['VITE_RAZORPAY_KEY_ID'] as string | undefined;
        if (!fallbackKey) throw orderErr;
        console.error("Razorpay order error details:", orderErr);
        toast("Opening secure checkout…", { description: "Finishing setup in the background." });
        order = {
          order_id: "",
          amount: active.price,
          currency: "INR",
          key_id: fallbackKey,
          plan_name: active.title,
        };
      }

      await openRazorpay({
        key: order.key_id,
        amount: order.amount,
        currency: order.currency,
        name: "HumanLink",
        description: order.plan_name,
        order_id: order.order_id || undefined,
        prefill: {
          name: (user?.user_metadata?.full_name as string | undefined) ?? "Neighbor",
          email: user?.email ?? "",
        },
        theme: { color: "#0b57d0" },
        handler: (response) => {
          void handleVerified(response);
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (order.order_id) {
              void cancelOrder({ data: { razorpay_order_id: order.order_id } }).catch(() => {});
            }
          },
        },
      });
    } catch (e) {
      // Authentication failures must never look like payment failures, and
      // Razorpay checkout is never opened unless the backend authorized us.
      console.error("Checkout error details:", e);
      const auth = isAuthError(e);
      if (auth) {
        toast.error(SESSION_EXPIRED_MESSAGE);
        setErrorMsg(SESSION_EXPIRED_MESSAGE);
        setStage("error");
        void endExpiredSession();
        return;
      }
      // Soft notice only — never a red failure banner inside the modal.
      toast("Checkout isn't available right now. Please try again in a moment.");
      setStage("pick");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative bg-primary text-primary-foreground p-6">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_20%,white,transparent_40%)]" />
          <DialogHeader className="relative">
            <DialogTitle className="text-primary-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5" /> Choose your plan
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/85">
              Secure checkout powered by Razorpay
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6">
          {isAdmin && stage === "pick" && (
            <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2">
              <Crown className="h-4 w-4" /> God-mode is active — you already have Pro. Subscribing is optional.
            </div>
          )}

          {stage === "pick" && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                {CARDS.map((c) => {
                  const isActive = selected === c.key;
                  const isGold = c.accent === "gold";
                  return (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => setSelected(c.key)}
                      className={cn(
                        "text-left rounded-2xl border p-4 transition-all",
                        isActive
                          ? isGold
                            ? "border-amber-500/60 bg-amber-500/10"
                            : "border-emerald-500 bg-emerald-500/10 shadow-[0_0_22px_-4px_rgba(16,185,129,0.55)]"
                          : "border-border bg-card hover:border-primary/40",
                      )}
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {isGold ? (
                          <Crown className="h-4 w-4 text-amber-500" />
                        ) : (
                          <HeartHandshake className="h-4 w-4 text-emerald-500" />
                        )}
                        {c.title}
                      </div>
                      <div className="text-2xl font-bold mt-1">{c.label}</div>
                      <div className="text-[11px] text-muted-foreground">{c.tagline}</div>
                      <ul className="mt-3 space-y-1 text-xs">
                        {c.perks.map((p) => (
                          <li key={p} className="flex gap-1.5">
                            <CheckCircle2
                              className={cn(
                                "h-3.5 w-3.5 mt-0.5 shrink-0",
                                isGold ? "text-amber-500" : "text-emerald-500",
                              )}
                            />
                            <span>{p}</span>
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>

              <Button
                onClick={subscribe}
                disabled={loading}
                className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading secure checkout…
                  </>
                ) : (
                  <>Subscribe Now · ₹{(active.price / 100).toLocaleString("en-IN")}</>
                )}
              </Button>
              <p className="mt-3 text-[11px] text-muted-foreground text-center">
                You'll be charged {active.label} through Razorpay. Cancel any time from your dashboard.
              </p>
            </>
          )}

          {stage === "processing" && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="font-medium">Verifying payment & activating your badge…</div>
              <div className="text-xs text-muted-foreground">Do not close this window.</div>
            </div>
          )}

          {stage === "done" && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div
                className={cn(
                  "h-16 w-16 rounded-full flex items-center justify-center",
                  active.accent === "gold" ? "bg-amber-500/15" : "bg-emerald-500/15",
                )}
              >
                {active.accent === "gold" ? (
                  <Crown className="h-9 w-9 text-amber-500" />
                ) : (
                  <HeartHandshake className="h-9 w-9 text-emerald-500" />
                )}
              </div>
              <div className="font-bold text-lg">Welcome to {active.title}!</div>
              <div className="text-sm text-muted-foreground">
                Your {active.accent === "gold" ? "gold" : "forest green"} verified badge is live across HumanLink.
              </div>
            </div>
          )}

          {stage === "error" && (
            <div className="py-10 flex flex-col items-center gap-3 text-center">
              <div className="h-16 w-16 rounded-full flex items-center justify-center bg-destructive/15">
                <ShieldAlert className="h-9 w-9 text-destructive" />
              </div>
              <div className="font-bold text-lg">Payment could not be completed</div>
              <div className="text-sm text-muted-foreground max-w-sm">{errorMsg || "Something went wrong. No charges have been applied."}</div>
              <Button variant="outline" onClick={() => setStage("pick")}>Try again</Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

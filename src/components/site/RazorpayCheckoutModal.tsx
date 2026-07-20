import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, HeartHandshake, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { openRazorpay, type RazorpayResponse } from "@/lib/razorpay";

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
    perks: ["Gold Pro verified badge", "Customer reviews", "Searchable portfolio grid", "Top placement in search"],
    accent: "gold",
  },
  {
    key: "ngo",
    title: "HumanLink NGO",
    price: 29900,
    label: "₹299 / month",
    tagline: "For NGOs, non-profits & causes",
    perks: ["Forest Green verified badge", "Volunteer direct triggers", "Custom donation link", "Cause-based discovery"],
    accent: "green",
  },
];

const RAZORPAY_KEY =
  (import.meta.env.VITE_RAZORPAY_KEY_ID as string | undefined) ?? "rzp_test_1DP5mmOlF5G5ag";

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
  const [selected, setSelected] = useState<TierKey>(defaultTier);
  const [planIds, setPlanIds] = useState<Record<TierKey, string | null>>({ pro: null, ngo: null });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"pick" | "processing" | "done">("pick");

  useEffect(() => {
    if (!open) return;
    setSelected(defaultTier);
    setStage("pick");
    (async () => {
      const { data } = await supabase
        .from("premium_plans")
        .select("id, name")
        .eq("is_active", true);
      const rows = data ?? [];
      const pro = rows.find((r) => /pro/i.test(r?.name ?? "")) ?? null;
      const ngo = rows.find((r) => /ngo/i.test(r?.name ?? "")) ?? null;
      setPlanIds({ pro: pro?.id ?? null, ngo: ngo?.id ?? null });
    })();
  }, [open, defaultTier]);

  const active = useMemo(() => CARDS.find((c) => c.key === selected)!, [selected]);

  const handleSuccess = async (_response: RazorpayResponse, targetTier: TierKey) => {
    setStage("processing");
    const planId = planIds[targetTier];
    if (!planId) {
      toast.error("Plan unavailable — please retry");
      setStage("pick");
      return;
    }
    const { error } = await supabase.rpc("activate_premium" as never, { _plan_id: planId } as never);
    if (error) {
      toast.error(error.message);
      setStage("pick");
      return;
    }
    setStage("done");
    toast.success(`${targetTier === "pro" ? "Gold Pro" : "Forest Green NGO"} badge activated`);
    // Broadcast a lightweight refresh so premium hooks re-fetch immediately.
    window.dispatchEvent(new CustomEvent("humanlink:premium-updated"));
    setTimeout(() => {
      onOpenChange(false);
      onSuccess?.();
    }, 1600);
  };

  const subscribe = async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setLoading(true);
    try {
      await openRazorpay({
        key: RAZORPAY_KEY,
        amount: active.price,
        currency: "INR",
        name: "HumanLink",
        description: active.title,
        prefill: {
          name: (user?.user_metadata?.full_name as string | undefined) ?? "Neighbor",
          email: user?.email ?? "user@example.com",
        },
        theme: { color: "#0b57d0" },
        handler: (response) => {
          handleSuccess(response, active.key);
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed to load");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <div className="relative bg-gradient-brand text-primary-foreground p-6">
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
                            ? "border-amber-500 bg-amber-500/10 shadow-[0_0_22px_-4px_rgba(245,158,11,0.55)]"
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
                className="mt-6 w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow"
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
                You'll be charged {active.label} through Razorpay. Cancel any time.
              </p>
            </>
          )}

          {stage === "processing" && (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <div className="font-medium">Activating your badge…</div>
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
                Your {active.accent === "gold" ? "gold" : "forest green"} verified badge is now live across HumanLink.
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

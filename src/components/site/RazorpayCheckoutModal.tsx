import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, HeartHandshake, BriefcaseBusiness, Loader2, CheckCircle2, ShieldCheck, ShieldAlert, Users, BadgeCheck, Stethoscope, GraduationCap, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-role";
import { openRazorpay, loadRazorpay, type RazorpayResponse } from "@/lib/razorpay";
import { createRazorpaySubscription, verifyRazorpaySubscription, cancelSubscription } from "@/lib/razorpay.functions";
import { SESSION_EXPIRED_MESSAGE, endExpiredSession, isAuthError } from "@/lib/supabase-session";

export type TierKey = "plus" | "volunteer" | "professional" | "ngo" | "business" | "healthcare" | "education" | "csr";

type PlanCard = {
  key: TierKey;
  title: string;
  price: number;
  planName: string;
  tagline: string;
  perks: string[];
  icon: typeof Users;
  accent: "neutral" | "gold" | "green" | "blue";
};

const CARDS: PlanCard[] = [
  { key: "plus", title: "HumanLink Plus", price: 49, planName: "HumanLink Plus", tagline: "More visibility for individuals", perks: ["Enhanced profile", "Priority discovery", "Plus badge"], icon: Users, accent: "neutral" },
  { key: "volunteer", title: "Volunteer Plus", price: 99, planName: "HumanLink Volunteer Plus", tagline: "Tools for active volunteers", perks: ["Skill badge", "Opportunity matching", "Activity analytics"], icon: HeartHandshake, accent: "green" },
  { key: "professional", title: "Professional", price: 199, planName: "HumanLink Professional", tagline: "For verified professionals", perks: ["Professional profile", "Service listing", "Priority discovery"], icon: BadgeCheck, accent: "blue" },
  { key: "ngo", title: "HumanLink NGO", price: 299, planName: "HumanLink NGO", tagline: "For NGOs & charitable organizations", perks: ["NGO verification", "Campaign tools", "Verified NGO badge"], icon: HeartHandshake, accent: "green" },
  { key: "business", title: "HumanLink Business", price: 599, planName: "HumanLink Business", tagline: "For businesses & service providers", perks: ["Verified business profile", "Promotions & offers", "Business analytics"], icon: BriefcaseBusiness, accent: "gold" },
  { key: "healthcare", title: "Healthcare Partner", price: 999, planName: "HumanLink Healthcare Partner", tagline: "For hospitals & clinics", perks: ["Verified organization", "Community campaigns", "Outreach analytics"], icon: Stethoscope, accent: "blue" },
  { key: "education", title: "Education Partner", price: 499, planName: "HumanLink Education Partner", tagline: "For schools & colleges", perks: ["Student volunteering", "Community campaigns", "Impact insights"], icon: GraduationCap, accent: "blue" },
  { key: "csr", title: "CSR Partner", price: 2499, planName: "HumanLink CSR Partner", tagline: "For corporate CSR programs", perks: ["CSR campaigns", "Employee volunteering", "Impact dashboard"], icon: Building2, accent: "gold" },
];

export function RazorpayCheckoutModal({ open, onOpenChange, defaultTier = "plus", onSuccess }: { open: boolean; onOpenChange: (v: boolean) => void; defaultTier?: TierKey; onSuccess?: () => void }) {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const createSubscription = useServerFn(createRazorpaySubscription);
  const verifySubscription = useServerFn(verifyRazorpaySubscription);
  const cancelCurrentSubscription = useServerFn(cancelSubscription);
  const [selected, setSelected] = useState<TierKey>(defaultTier);
  const [planIds, setPlanIds] = useState<Record<TierKey, string | null>>({
    plus: null, volunteer: null, professional: null, ngo: null, business: null, healthcare: null, education: null, csr: null,
  });
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState<"pick" | "processing" | "done" | "error">("pick");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!open) return;
    setSelected(defaultTier);
    setStage("pick");
    setErrorMsg("");
    void (async () => {
      const { data, error } = await supabase.from("premium_plans").select("id, name").eq("is_active", true);
      if (error) { console.error("Failed to load premium plans:", error); return; }
      const rows = data ?? [];
      setPlanIds({
        plus: rows.find((r) => r?.name === "HumanLink Plus")?.id ?? null,
        volunteer: rows.find((r) => r?.name === "HumanLink Volunteer Plus")?.id ?? null,
        professional: rows.find((r) => r?.name === "HumanLink Professional")?.id ?? null,
        ngo: rows.find((r) => r?.name === "HumanLink NGO")?.id ?? null,
        business: rows.find((r) => r?.name === "HumanLink Business")?.id ?? null,
        healthcare: rows.find((r) => r?.name === "HumanLink Healthcare Partner")?.id ?? null,
        education: rows.find((r) => r?.name === "HumanLink Education Partner")?.id ?? null,
        csr: rows.find((r) => r?.name === "HumanLink CSR Partner")?.id ?? null,
      });
    })();
  }, [open, defaultTier]);

  const active = useMemo(() => CARDS.find((c) => c.key === selected)!, [selected]);

  useEffect(() => { if (open) void loadRazorpay().catch(() => {}); }, [open]);

  const handleVerified = async (response: RazorpayResponse) => {
    setStage("processing");
    if (!response.razorpay_payment_id || !response.razorpay_subscription_id || !response.razorpay_signature) {
      setErrorMsg("Razorpay did not return a complete subscription response. If you were charged, please contact support.");
      setStage("error");
      return;
    }
    try {
      await verifySubscription({ data: {
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_subscription_id: response.razorpay_subscription_id,
        razorpay_signature: response.razorpay_signature,
      }});
      setStage("done");
      toast.success(`${active.title} subscription activated!`);
      window.dispatchEvent(new CustomEvent("humanlink:premium-updated"));
      setTimeout(() => { onOpenChange(false); onSuccess?.(); }, 1800);
    } catch (e) {
      const auth = isAuthError(e);
      const msg = auth ? SESSION_EXPIRED_MESSAGE : e instanceof Error ? e.message : "Verification failed";
      setErrorMsg(msg); setStage("error"); toast.error(msg);
      if (auth) void endExpiredSession();
    }
  };

  const subscribe = async () => {
    if (!user) { toast.error("Please sign in first"); return; }
    setLoading(true); setErrorMsg("");
    try {
      const subscription = await createSubscription({ data: { plan_key: selected }});
      if (!subscription.subscription_id || !subscription.key_id) throw new Error("HumanLink could not create a secure subscription. Please try again.");
      await openRazorpay({
        key: subscription.key_id,
        currency: "INR",
        name: "HumanLink",
        description: subscription.plan_name,
        subscription_id: subscription.subscription_id,
        prefill: { name: (user?.user_metadata?.full_name as string | undefined) ?? "", email: user?.email ?? "" },
        theme: { color: "#0b57d0" },
        handler: (response) => { void handleVerified(response); },
        modal: { ondismiss: () => { setLoading(false); void cancelCurrentSubscription({ data: {} }).catch(() => {}); } },
      });
    } catch (e) {
      console.error("Subscription checkout error:", e);
      const auth = isAuthError(e);
      if (auth) { toast.error(SESSION_EXPIRED_MESSAGE); setErrorMsg(SESSION_EXPIRED_MESSAGE); setStage("error"); void endExpiredSession(); return; }
      const msg = (e instanceof Error ? e.message : "").trim() || "Subscription checkout isn't available right now. Please try again.";
      toast.error(msg); setErrorMsg(msg); setStage("error");
    } finally { setLoading(false); }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden">
        <div className="relative bg-primary text-primary-foreground p-6">
          <DialogHeader className="relative">
            <DialogTitle className="text-primary-foreground flex items-center gap-2"><ShieldCheck className="h-5 w-5" /> Choose a HumanLink plan</DialogTitle>
            <DialogDescription className="text-primary-foreground/85">Secure recurring monthly checkout powered by Razorpay</DialogDescription>
          </DialogHeader>
        </div>
        <div className="p-6">
          {isAdmin && stage === "pick" && <div className="mb-4 rounded-2xl border border-amber-400/40 bg-amber-500/10 p-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-2"><Crown className="h-4 w-4" /> Admin access is active.</div>}
          {stage === "pick" && <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 max-h-[55vh] overflow-y-auto pr-1">
              {CARDS.map((c) => {
                const selectedCard = selected === c.key;
                const Icon = c.icon;
                return <button key={c.key} type="button" onClick={() => setSelected(c.key)} className={cn("text-left rounded-2xl border p-4 transition-all", selectedCard ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/40")}>
                  <div className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-primary" />{c.title}</div>
                  <div className="text-2xl font-bold mt-1">₹{c.price.toLocaleString("en-IN")}<span className="text-xs font-medium text-muted-foreground">/mo</span></div>
                  <div className="text-[11px] text-muted-foreground">{c.tagline}</div>
                  <ul className="mt-3 space-y-1 text-xs">{c.perks.map((p) => <li key={p} className="flex gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 mt-0.5 shrink-0 text-primary" /><span>{p}</span></li>)}</ul>
                </button>;
              })}
            </div>
            <Button onClick={subscribe} disabled={loading} className="mt-6 w-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
              {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading secure checkout…</> : <>Subscribe Now · ₹{active.price.toLocaleString("en-IN")}/mo</>}
            </Button>
            <p className="mt-3 text-[11px] text-muted-foreground text-center">Monthly subscription. Cancel any time from your dashboard. Helping, volunteering and donating remain free.</p>
          </>}
          {stage === "processing" && <div className="py-12 flex flex-col items-center gap-3"><Loader2 className="h-10 w-10 animate-spin text-primary" /><div className="font-medium">Verifying payment & activating your plan…</div></div>}
          {stage === "done" && <div className="py-10 flex flex-col items-center gap-3 text-center"><div className="h-16 w-16 rounded-full flex items-center justify-center bg-primary/10"><CheckCircle2 className="h-9 w-9 text-primary" /></div><div className="font-bold text-lg">{active.title} is active!</div><div className="text-sm text-muted-foreground">Your HumanLink plan is active for one month.</div></div>}
          {stage === "error" && <div className="py-10 flex flex-col items-center gap-3 text-center"><div className="h-16 w-16 rounded-full flex items-center justify-center bg-destructive/15"><ShieldAlert className="h-9 w-9 text-destructive" /></div><div className="font-bold text-lg">Payment could not be completed</div><div className="text-sm text-muted-foreground max-w-sm">{errorMsg || "Something went wrong. No charges have been applied."}</div><Button variant="outline" onClick={() => setStage("pick")}>Try again</Button></div>}
        </div>
      </DialogContent>
    </Dialog>
  );
}

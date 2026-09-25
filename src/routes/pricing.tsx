import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, HeartHandshake, BriefcaseBusiness, GraduationCap, Building2, Stethoscope, Users, BadgeCheck } from "lucide-react";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usePremium } from "@/hooks/use-premium";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HumanLink" },
      { name: "description", content: "Affordable HumanLink plans for individuals, volunteers, professionals, NGOs, businesses and organizations." },
      { property: "og:title", content: "Pricing — HumanLink" },
      { property: "og:description", content: "Keep helping free. Upgrade only when you need professional, NGO, business or organization tools." },
    ],
  }),
  component: Pricing,
});

type Tier =
  | "plus" | "volunteer" | "professional" | "ngo"
  | "business" | "healthcare" | "education" | "csr";

type Plan = {
  key: Tier;
  name: string;
  price: number;
  tagline: string;
  perks: string[];
  icon: typeof Users;
  accent: "neutral" | "gold" | "green" | "blue";
};

const PLANS: Plan[] = [
  { key: "plus", name: "HumanLink Plus", price: 49, tagline: "For individuals who want more visibility", perks: ["Enhanced profile", "More saved opportunities", "Priority discovery", "Plus badge"], icon: Users, accent: "neutral" },
  { key: "volunteer", name: "Volunteer Plus", price: 99, tagline: "For active community volunteers", perks: ["Volunteer profile", "Skill badge", "Opportunity matching", "Activity analytics"], icon: HeartHandshake, accent: "green" },
  { key: "professional", name: "Professional", price: 199, tagline: "For verified professionals", perks: ["Professional profile", "Verification request", "Service listing", "Priority discovery"], icon: BadgeCheck, accent: "blue" },
  { key: "ngo", name: "HumanLink NGO", price: 299, tagline: "For NGOs & charitable organizations", perks: ["NGO verification", "Campaign tools", "Volunteer management", "Verified NGO badge"], icon: HeartHandshake, accent: "green" },
  { key: "business", name: "HumanLink Business", price: 599, tagline: "For local businesses & service providers", perks: ["Verified business profile", "Promotions & offers", "Local discovery", "Business analytics"], icon: BriefcaseBusiness, accent: "gold" },
  { key: "healthcare", name: "Healthcare Partner", price: 999, tagline: "For hospitals, clinics & healthcare organizations", perks: ["Verified organization profile", "Community campaigns", "Healthcare outreach", "Campaign analytics"], icon: Stethoscope, accent: "blue" },
  { key: "education", name: "Education Partner", price: 499, tagline: "For schools, colleges & education groups", perks: ["Student volunteering", "Community campaigns", "Opportunity management", "Impact insights"], icon: GraduationCap, accent: "blue" },
  { key: "csr", name: "CSR Partner", price: 2499, tagline: "For companies running CSR programs", perks: ["CSR campaigns", "Employee volunteering", "Impact dashboard", "Priority organization support"], icon: Building2, accent: "gold" },
];

function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, godMode } = usePremium();
  const [openTier, setOpenTier] = useState<Tier | null>(null);

  const choose = (tier: Tier) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setOpenTier(tier);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-16 md:py-24">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Affordable tools for every sector
          </div>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">Helping stays free. Growth stays affordable.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
            Asking for help, offering help, volunteering and donating remain free. Paid plans are for people and organizations that need additional visibility, verification, campaign and business tools.
          </p>
        </div>

        <div className="mt-10 rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold text-primary">
            <Crown className="h-3.5 w-3.5" /> Monthly subscriptions
          </div>
          <div className="text-lg font-semibold">Community · ₹0/month</div>
          <p className="mt-1 text-sm text-muted-foreground">Help requests, offers, donations, volunteering, groups, messaging, feed, reviews and core Humi features.</p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Choose your subscription</h2>
            <p className="mt-1 text-sm text-muted-foreground">Recurring monthly plans. Cancel anytime from Settings → Subscription.</p>
          </div>
          {user && <div className="rounded-2xl border bg-card px-4 py-3 text-sm"><span className="text-muted-foreground">Current plan:</span> <span className="font-semibold capitalize">{godMode ? "Admin" : tier ?? "free"}</span></div>}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const accent = plan.accent === "gold"
              ? "border-primary/60 bg-primary/5"
              : plan.accent === "green"
                ? "border-emerald-500/50 bg-emerald-500/5"
                : plan.accent === "blue"
                  ? "border-blue-500/40 bg-blue-500/5"
                  : "border-border bg-card";
            return (
              <div key={plan.key} className={cn("rounded-3xl border p-6 flex flex-col", accent)}>
                <div className="flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-primary" />{plan.name}</div>
                <div className="mt-3 text-4xl font-bold">₹{plan.price}<span className="text-sm font-medium text-muted-foreground">/mo</span></div>
                <p className="mt-2 min-h-10 text-xs text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-5 space-y-2 text-sm flex-1">
                  {plan.perks.map((perk) => <li key={perk} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{perk}</li>)}
                </ul>
                <Button onClick={() => choose(plan.key)} className="mt-6 w-full">{user && tier === plan.key ? "Current plan" : `Subscribe · ₹${plan.price}/mo`}</Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-3xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-primary" /> HumanLink pricing principles</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">No paywall for help</div><div className="mt-1 text-xs text-muted-foreground">People can ask for help and offer help without a subscription.</div></div>
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">Sector-specific tools</div><div className="mt-1 text-xs text-muted-foreground">NGOs, businesses, professionals, healthcare, education and CSR get relevant tools.</div></div>
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">Cancel anytime</div><div className="mt-1 text-xs text-muted-foreground">Subscriptions are monthly and can be cancelled from account settings.</div></div>
          </div>
        </div>
      </section>
      <Footer />
      <RazorpayCheckoutModal open={!!openTier} defaultTier={openTier ?? "plus"} onOpenChange={(v) => !v && setOpenTier(null)} />
    </div>
  );
}

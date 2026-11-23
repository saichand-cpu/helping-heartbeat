import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, HeartHandshake, BriefcaseBusiness, GraduationCap, Building2, Stethoscope, Users, BadgeCheck, Star } from "lucide-react";
import { RazorpayCheckoutModal, type TierKey } from "@/components/site/RazorpayCheckoutModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { usePremium } from "@/hooks/use-premium";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Affordable Plans & Subscriptions — HumanLink" },
      { name: "description", content: "Affordable subscriptions for individuals, creators, professionals, businesses, NGOs and institutions. Asking for help and volunteering stay free." },
      { property: "og:title", content: "Affordable HumanLink Plans" },
      { property: "og:description", content: "Simple, transparent plans for people and organisations growing their impact." },
    ],
  }),
  component: Pricing,
});

type Plan = {
  key: TierKey;
  name: string;
  price: number;
  audience: string;
  tagline: string;
  perks: string[];
  icon: typeof Users;
  accent: "neutral" | "gold" | "green" | "blue";
};

const PLANS: Plan[] = [
  { key: "plus", name: "Individual Plus", price: 39, audience: "Individuals", tagline: "A little more visibility for your profile", perks: ["Enhanced profile", "Priority discovery", "Plus badge"], icon: Users, accent: "neutral" },
  { key: "creator", name: "Creator", price: 99, audience: "Creators & community voices", tagline: "Build your audience and share your work", perks: ["Creator profile tools", "Content insights", "Featured profile eligibility"], icon: Star, accent: "gold" },
  { key: "volunteer", name: "Volunteer Plus", price: 69, audience: "Volunteers", tagline: "Tools for people who give their time", perks: ["Volunteer skill profile", "Opportunity matching", "Activity insights"], icon: HeartHandshake, accent: "green" },
  { key: "professional", name: "Professional", price: 149, audience: "Independent professionals", tagline: "Get discovered for your skills and services", perks: ["Professional profile", "Service listing", "Priority discovery"], icon: BadgeCheck, accent: "blue" },
  { key: "ngo", name: "NGO Partner", price: 199, audience: "NGOs & charities", tagline: "Coordinate your community impact", perks: ["NGO verification workflow", "Campaign tools", "Volunteer management"], icon: HeartHandshake, accent: "green" },
  { key: "business", name: "Business Starter", price: 299, audience: "Small businesses", tagline: "Get your local business online", perks: ["Business profile", "Offers and listings", "Basic performance insights"], icon: BriefcaseBusiness, accent: "gold" },
  { key: "business_growth", name: "Business Growth", price: 599, audience: "Growing businesses", tagline: "Reach more relevant local customers", perks: ["Everything in Starter", "Promotion campaign tools", "Audience and click insights"], icon: BriefcaseBusiness, accent: "gold" },
  { key: "business_pro", name: "Business Pro", price: 999, audience: "Established businesses", tagline: "Advanced visibility and campaign operations", perks: ["Everything in Growth", "Multiple campaigns", "Advanced performance reports"], icon: Building2, accent: "gold" },
  { key: "education", name: "Education Partner", price: 299, audience: "Schools & colleges", tagline: "Connect learners with opportunities", perks: ["Student volunteering", "Community campaigns", "Impact insights"], icon: GraduationCap, accent: "blue" },
  { key: "healthcare", name: "Healthcare Partner", price: 699, audience: "Clinics & healthcare organisations", tagline: "Build trusted community outreach", perks: ["Organisation profile", "Community campaigns", "Outreach insights"], icon: Stethoscope, accent: "blue" },
  { key: "csr", name: "CSR Partner", price: 1499, audience: "Corporate & institutional teams", tagline: "Coordinate employee volunteering and impact", perks: ["CSR campaigns", "Employee volunteering", "Impact dashboard"], icon: Building2, accent: "gold" },
];

function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tier, godMode } = usePremium();
  const [openTier, setOpenTier] = useState<TierKey | null>(null);
  const choose = (selected: TierKey) => {
    if (!user) { navigate({ to: "/auth" }); return; }
    setOpenTier(selected);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-7xl px-6 py-14 md:py-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Fair pricing. Real community impact.
          </div>
          <h1 className="mt-4 text-4xl font-bold md:text-6xl">Grow with HumanLink. Keep helping free.</h1>
          <p className="mx-auto mt-4 max-w-3xl text-muted-foreground">
            Affordable monthly subscriptions for individuals, creators, professionals, businesses and organisations. Core help requests, volunteering, donations and community participation are always free.
          </p>
        </div>

        <div className="mt-9 rounded-3xl border border-primary/20 bg-primary/5 p-6 text-center">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background px-3 py-1 text-xs font-semibold text-primary">
            <HeartHandshake className="h-3.5 w-3.5" /> Community plan · Free forever
          </div>
          <div className="text-lg font-semibold">₹0 / month</div>
          <p className="mt-1 text-sm text-muted-foreground">Ask for help, offer help, volunteer, donate, join groups, message and use core HUMI assistance without paying.</p>
        </div>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold">Plans for every stage</h2>
            <p className="mt-1 text-sm text-muted-foreground">Transparent monthly pricing in INR for the India launch. Cancel recurring subscriptions from your account.</p>
          </div>
          {user && <div className="rounded-2xl border bg-card px-4 py-3 text-sm"><span className="text-muted-foreground">Current plan:</span> <span className="font-semibold capitalize">{godMode ? "Admin" : tier ?? "free"}</span></div>}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const accent = plan.accent === "gold" ? "border-primary/50 bg-primary/5" : plan.accent === "green" ? "border-emerald-500/40 bg-emerald-500/5" : plan.accent === "blue" ? "border-blue-500/30 bg-blue-500/5" : "border-border bg-card";
            return (
              <div key={plan.key} className={cn("rounded-3xl border p-6 flex flex-col", accent)}>
                <div className="text-xs uppercase tracking-wide text-muted-foreground">{plan.audience}</div>
                <div className="mt-2 flex items-center gap-2 font-semibold"><Icon className="h-5 w-5 text-primary" />{plan.name}</div>
                <div className="mt-3 text-4xl font-bold">₹{plan.price}<span className="text-sm font-medium text-muted-foreground">/mo</span></div>
                <p className="mt-2 min-h-10 text-xs text-muted-foreground">{plan.tagline}</p>
                <ul className="mt-5 space-y-2 text-sm flex-1">{plan.perks.map((perk) => <li key={perk} className="flex gap-2"><Check className="h-4 w-4 shrink-0 text-primary" />{perk}</li>)}</ul>
                <Button onClick={() => choose(plan.key)} className="mt-6 w-full">{user && tier === plan.key ? "Current plan" : `Choose · ₹${plan.price}/mo`}</Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-3xl border bg-card p-6 md:p-8">
          <div className="flex items-center gap-2 text-sm font-semibold"><Crown className="h-4 w-4 text-primary" /> HumanLink promises</div>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">Help is never paywalled</div><div className="mt-1 text-xs text-muted-foreground">People can seek help, volunteer and donate on the free community plan.</div></div>
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">Promotions are separate</div><div className="mt-1 text-xs text-muted-foreground">Campaign spend is opt-in, budget-capped and never silently added to a subscription.</div></div>
            <div className="rounded-2xl bg-muted/60 p-4"><div className="font-semibold">Clear subscription controls</div><div className="mt-1 text-xs text-muted-foreground">See your plan, billing status and cancellation options in your account.</div></div>
          </div>
          <p className="mt-5 text-xs text-muted-foreground">Prices shown are India launch prices. International currencies, taxes and payment methods will be displayed only after the relevant country payment setup is enabled.</p>
        </div>
      </section>
      <Footer />
      <RazorpayCheckoutModal open={!!openTier} defaultTier={openTier ?? "plus"} onOpenChange={(v) => !v && setOpenTier(null)} />
    </div>
  );
}

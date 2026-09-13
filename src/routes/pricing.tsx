import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, HeartHandshake, BriefcaseBusiness, GraduationCap, Building2, Rocket } from "lucide-react";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HumanLink" },
      { name: "description", content: "Free community access with professional plans for jobs, businesses, skills, services and NGOs." },
      { property: "og:title", content: "Pricing — HumanLink" },
      { property: "og:description", content: "Choose HumanLink Pro (₹599) or HumanLink NGO (₹299) with secure Razorpay checkout." },
    ],
  }),
  component: Pricing,
});

type Tier = "pro" | "ngo";

const TIER_CARDS: {
  key: Tier;
  name: string;
  price: string;
  tagline: string;
  perks: string[];
  accent: "gold" | "green";
}[] = [
  {
    key: "ngo",
    name: "HumanLink NGO",
    price: "₹299",
    tagline: "For non-profits & causes",
    perks: [
      "Forest Green verified badge",
      "Volunteer direct-message CTA",
      "Custom donation link",
      "Cause-based discovery boost",
    ],
    accent: "green",
  },
  {
    key: "pro",
    name: "HumanLink Pro",
    price: "₹599",
    tagline: "For HR, businesses, creators & professionals",
    perks: [
      "Publish job vacancies",
      "Promote businesses, skills & services",
      "Gold Pro verified badge",
      "Priority visibility & discovery",
      "Customer reviews & ratings",
      "Searchable professional profile",
    ],
    accent: "gold",
  },
];

function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [openTier, setOpenTier] = useState<Tier | null>(null);

  const choose = (t: Tier) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setOpenTier(t);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> One network for people, skills, jobs & businesses
          </div>
          <h1 className="mt-3 text-5xl font-bold md:text-6xl">Free for community. Pro for growth.</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Anyone can join HumanLink for free. Monthly Pro access unlocks commercial publishing — so HR teams can hire, students can teach, professionals can promote services, and businesses can reach customers.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-3xl border border-border bg-card p-8">
            <div className="text-sm opacity-80">Community</div>
            <div className="mt-2 text-5xl font-bold">₹0<span className="text-base font-medium opacity-70">/mo</span></div>
            <p className="mt-2 text-sm text-muted-foreground">For everyone who wants to help, learn and connect.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Unlimited public help requests", "AI request assistant", "Real-time messaging", "Groups, follows & community posts", "Karma & reviews"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Link to="/auth" className="mt-8 block"><Button className="w-full" variant="outline">Get started free</Button></Link>
          </div>

          {TIER_CARDS.map((c) => {
            const isGold = c.accent === "gold";
            return (
              <div key={c.key} className={cn("relative overflow-hidden rounded-3xl border p-8", isGold ? "border-primary/60 bg-primary/5 shadow-pop" : "border-emerald-500/60 bg-gradient-to-br from-emerald-500/15 via-card to-card shadow-[0_0_35px_-10px_rgba(16,185,129,0.5)]")}>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  {isGold ? <Crown className="h-4 w-4 text-primary" /> : <HeartHandshake className="h-4 w-4 text-emerald-500" />}
                  {c.name}
                </div>
                <div className="mt-2 text-5xl font-bold">{c.price}<span className="text-base font-medium opacity-70">/mo</span></div>
                <p className="mt-1 text-xs text-muted-foreground">{c.tagline}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {c.perks.map((p) => <li key={p} className="flex gap-2"><Check className={cn("h-4 w-4", isGold ? "text-primary" : "text-emerald-500")} /> {p}</li>)}
                </ul>
                <Button onClick={() => choose(c.key)} className={cn("mt-8 w-full border-0 shadow-sm", isGold ? "bg-primary text-primary-foreground hover:bg-primary/90" : "bg-emerald-500 text-black hover:bg-emerald-500/90")}>
                  Subscribe · {c.price}/mo
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-5xl rounded-3xl border bg-card p-6 md:p-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 text-sm font-semibold"><Rocket className="h-4 w-4 text-primary" /> How professional publishing works</div>
            <div className="mt-6 grid gap-4 text-left md:grid-cols-4">
              {[
                ["01", "Choose a sector", "Job, business, skill, service or announcement."],
                ["02", "Select monthly access", "Commercial publishing is unlocked by an active plan."],
                ["03", "Create your post", "Add role, offer, skills, location, tags and details."],
                ["04", "Reach the network", "Publish to HumanLink and optionally boost later."],
              ].map(([n, t, d]) => <div key={n} className="rounded-2xl bg-muted/60 p-4"><div className="text-xs font-bold text-primary">{n}</div><div className="mt-1 font-semibold">{t}</div><div className="mt-1 text-xs text-muted-foreground">{d}</div></div>)}
            </div>
          </div>
        </div>
      </section>
      <Footer />
      <RazorpayCheckoutModal open={!!openTier} defaultTier={openTier ?? "pro"} onOpenChange={(v) => !v && setOpenTier(null)} />
    </div>
  );
}

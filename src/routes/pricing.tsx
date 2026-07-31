import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Crown, HeartHandshake } from "lucide-react";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HumanLink" },
      { name: "description", content: "Free for kindness. Pro badges for professionals, NGO badges for causes." },
      { property: "og:title", content: "Pricing — HumanLink" },
      { property: "og:description", content: "Choose HumanLink Pro (₹599) or HumanLink NGO (₹299). Secure Razorpay checkout." },
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
    tagline: "For businesses & professionals",
    perks: [
      "Gold Pro verified badge",
      "Customer reviews & ratings",
      "Searchable portfolio grid",
      "Top placement in search",
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Instant verified badge on activation
          </div>
          <h1 className="mt-3 text-5xl md:text-6xl font-bold">Free for kindness. Always.</h1>
          <p className="mt-3 text-muted-foreground">
            Upgrade in seconds with secure Razorpay checkout — cancel any time.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="rounded-3xl p-8 border bg-card border-border">
            <div className="text-sm opacity-80">Free</div>
            <div className="mt-2 text-5xl font-bold">₹0<span className="text-base opacity-70 font-medium">/mo</span></div>
            <p className="mt-2 text-sm text-muted-foreground">For everyone who wants to help or get help.</p>
            <ul className="mt-6 space-y-2 text-sm">
              {["Unlimited public requests", "AI request assistant", "Real-time messaging", "Karma & reviews"].map((f) => (
                <li key={f} className="flex gap-2"><Check className="h-4 w-4 text-primary" /> {f}</li>
              ))}
            </ul>
            <Link to="/auth" className="block mt-8">
              <Button className="w-full" variant="outline">Get started</Button>
            </Link>
          </div>

          {TIER_CARDS.map((c) => {
            const isGold = c.accent === "gold";
            return (
              <div
                key={c.key}
                className={cn(
                  "rounded-3xl p-8 border relative overflow-hidden",
                  isGold
                    ? "border-primary/60 bg-primary/5 shadow-pop"
                    : "border-emerald-500/60 bg-gradient-to-br from-emerald-500/15 via-card to-card shadow-[0_0_35px_-10px_rgba(16,185,129,0.5)]",
                )}
              >
                <div className="flex items-center gap-2 text-sm opacity-90">
                  {isGold ? (
                    <Crown className="h-4 w-4 text-primary" />
                  ) : (
                    <HeartHandshake className="h-4 w-4 text-emerald-500" />
                  )}
                  {c.name}
                </div>
                <div className="mt-2 text-5xl font-bold">
                  {c.price}
                  <span className="text-base opacity-70 font-medium">/mo</span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{c.tagline}</p>
                <ul className="mt-6 space-y-2 text-sm">
                  {c.perks.map((p) => (
                    <li key={p} className="flex gap-2">
                      <Check className={cn("h-4 w-4", isGold ? "text-primary" : "text-emerald-500")} /> {p}
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => choose(c.key)}
                  className={cn(
                    "mt-8 w-full border-0 shadow-sm",
                    isGold
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground"
                      : "bg-emerald-500 hover:bg-emerald-500/90 text-black",
                  )}
                >
                  Subscribe · {c.price}/mo
                </Button>
              </div>
            );
          })}
        </div>
      </section>
      <Footer />
      <RazorpayCheckoutModal
        open={!!openTier}
        defaultTier={openTier ?? "pro"}
        onOpenChange={(v) => !v && setOpenTier(null)}
      />
    </div>
  );
}


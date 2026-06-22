import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HumanLink" },
      { name: "description", content: "HumanLink is free for everyone. Optional premium unlocks priority, badges and analytics." },
    ],
  }),
  component: Pricing,
});

const plans = [
  {
    name: "Free", price: "$0", desc: "For everyone who wants to help or get help.",
    features: ["Unlimited public requests", "AI request assistant", "Real-time messaging", "Karma & reviews"],
    cta: "Get started", highlight: false,
  },
  {
    name: "Premium", price: "$6", desc: "For active helpers who want more reach.",
    features: ["Everything in Free", "Priority placement", "Verified badge", "Helper analytics", "AI priority queue"],
    cta: "Coming soon", highlight: true,
  },
];

function Pricing() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-5xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h1 className="text-5xl font-bold">Free for kindness. Always.</h1>
          <p className="mt-3 text-muted-foreground">Premium is optional and helps us keep the lights on.</p>
        </div>
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {plans.map((p) => (
            <div key={p.name}
              className={`rounded-3xl p-8 border ${p.highlight ? "bg-gradient-brand text-primary-foreground shadow-pop border-transparent" : "bg-card border-border"}`}>
              <div className="text-sm opacity-80">{p.name}</div>
              <div className="mt-2 text-5xl font-bold">{p.price}<span className="text-base opacity-70 font-medium">/mo</span></div>
              <p className="mt-2 text-sm opacity-90">{p.desc}</p>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex gap-2"><Check className="h-4 w-4" /> {f}</li>)}
              </ul>
              <Link to="/auth" className="block mt-8">
                <Button className={p.highlight ? "w-full bg-white text-primary hover:bg-white/90" : "w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow"}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>
      <Footer />
    </div>
  );
}

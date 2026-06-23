import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Check, Sparkles } from "lucide-react";
import { MockPaymentModal } from "@/components/site/MockPaymentModal";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — HumanLink" },
      { name: "description", content: "Free for kindness. Premium tiers help us keep the lights on." },
      { property: "og:title", content: "Pricing — HumanLink" },
      { property: "og:description", content: "HumanLink is free. Premium adds badges, priority, and analytics." },
    ],
  }),
  component: Pricing,
});

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[];
  sort_order: number;
};

type PaymentInfo = {
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  qr_image_url: string | null;
  instructions: string | null;
};

function formatPrice(cents: number, currency: string) {
  const value = cents / 100;
  if (currency === "INR") return `₹${value.toLocaleString("en-IN")}`;
  if (currency === "USD") return `$${value}`;
  return `${value} ${currency}`;
}

function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selected, setSelected] = useState<Plan | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("premium_plans").select("*").eq("is_active", true).order("sort_order");
      setPlans((data ?? []) as Plan[]);
    })();
  }, []);

  const choose = (p: Plan) => {
    if (!user) {
      navigate({ to: "/auth" });
      return;
    }
    setSelected(p);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Instant verified badge on activation
          </div>
          <h1 className="mt-3 text-5xl md:text-6xl font-bold">Free for kindness. Always.</h1>
          <p className="mt-3 text-muted-foreground">Upgrade in seconds with our secure demo gateway.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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

          {plans === null
            ? Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-80 rounded-3xl" />)
            : plans.map((p, i) => {
                const featured = i === Math.floor(plans.length / 2);
                return (
                  <div key={p.id} className={`rounded-3xl p-8 border ${featured ? "bg-gradient-brand text-primary-foreground shadow-pop border-transparent" : "bg-card border-border"}`}>
                    <div className="text-sm opacity-80">{p.name}</div>
                    <div className="mt-2 text-5xl font-bold">
                      {formatPrice(p.price_cents, p.currency)}
                      <span className="text-base opacity-70 font-medium">/{p.interval}</span>
                    </div>
                    <ul className="mt-6 space-y-2 text-sm">
                      {(p.features ?? []).map((f) => (
                        <li key={f} className="flex gap-2"><Check className="h-4 w-4" /> {f}</li>
                      ))}
                    </ul>
                    <Button
                      onClick={() => choose(p)}
                      className={featured ? "mt-8 w-full bg-white text-primary hover:bg-white/90" : "mt-8 w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow"}
                    >
                      Choose {p.name}
                    </Button>
                  </div>
                );
              })}
        </div>
      </section>
      <Footer />
      <MockPaymentModal plan={selected} open={!!selected} onOpenChange={(v) => !v && setSelected(null)} />
    </div>
  );
}


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
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [pay, setPay] = useState<PaymentInfo | null>(null);

  useEffect(() => {
    (async () => {
      const [p, s] = await Promise.all([
        supabase.from("premium_plans").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("payment_settings").select("*").limit(1).maybeSingle(),
      ]);
      setPlans((p.data ?? []) as Plan[]);
      setPay(s.data as PaymentInfo);
    })();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-6xl px-6 py-20 md:py-28">
        <div className="text-center">
          <h1 className="text-5xl md:text-6xl font-bold">Free for kindness. Always.</h1>
          <p className="mt-3 text-muted-foreground">Premium is optional — it keeps HumanLink running.</p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Free plan is hard-coded */}
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
                    <Link to="/auth" className="block mt-8">
                      <Button className={featured ? "w-full bg-white text-primary hover:bg-white/90" : "w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow"}>
                        Choose {p.name}
                      </Button>
                    </Link>
                  </div>
                );
              })}
        </div>

        {/* Payment details */}
        {pay && (pay.upi_id || pay.account_number || pay.qr_image_url) && (
          <div className="mt-16 glass rounded-3xl p-8 shadow-soft max-w-3xl mx-auto">
            <div className="flex items-center gap-2 mb-4">
              <Banknote className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Payment details</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-sm">
              {pay.upi_id && <Row label="UPI ID" value={pay.upi_id} />}
              {pay.bank_name && <Row label="Bank" value={pay.bank_name} />}
              {pay.account_holder && <Row label="Account holder" value={pay.account_holder} />}
              {pay.account_number && <Row label="Account number" value={pay.account_number} />}
              {pay.ifsc_code && <Row label="IFSC" value={pay.ifsc_code} />}
            </div>
            {pay.qr_image_url && (
              <div className="mt-6">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Scan to pay</div>
                <img src={pay.qr_image_url} alt="Payment QR code" className="h-48 w-48 rounded-2xl border border-border object-contain bg-white p-2" />
              </div>
            )}
            {pay.instructions && (
              <p className="mt-6 text-sm text-muted-foreground whitespace-pre-wrap">{pay.instructions}</p>
            )}
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

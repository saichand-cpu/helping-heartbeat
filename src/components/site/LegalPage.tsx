import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { useLegalConfig, displayValue, type PolicyType } from "@/lib/legal";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LegalSection = { id: string; heading: string; body: ReactNode };

export function LegalPage({
  title,
  intro,
  policyType,
  sections,
  showSafetyCta = true,
}: {
  title: string;
  intro: ReactNode;
  policyType?: PolicyType | "safety";
  sections: LegalSection[];
  showSafetyCta?: boolean;
}) {
  const { config, versions } = useLegalConfig();
  const row = policyType ? versions.find((v) => v.policy_type === policyType) : undefined;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 pt-28 pb-16">
        <header className="max-w-3xl">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">{title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            {row && <span>Version {row.version}</span>}
            {row && (
              <span>
                Last updated{" "}
                {new Date(row.effective_date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            )}
          </div>
          <div className="mt-6 text-base text-muted-foreground leading-relaxed">{intro}</div>
        </header>

        <div className="mt-12 grid gap-12 lg:grid-cols-[240px_1fr]">
          {/* Table of contents */}
          <nav aria-label="Table of contents" className="hidden lg:block">
            <div className="sticky top-28 rounded-2xl border border-border bg-card p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                On this page
              </p>
              <ul className="space-y-2 text-sm">
                {sections.map((s) => (
                  <li key={s.id}>
                    <a
                      href={`#${s.id}`}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      {s.heading}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="min-w-0 space-y-10">
            {sections.map((s) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <h2 className="text-xl font-semibold tracking-tight mb-3">{s.heading}</h2>
                <div className="prose-legal space-y-3 text-[15px] leading-relaxed text-muted-foreground">
                  {s.body}
                </div>
              </section>
            ))}

            <section id="contact" className="scroll-mt-28">
              <h2 className="text-xl font-semibold tracking-tight mb-3">Contact</h2>
              <div className="rounded-2xl border border-border bg-card p-5 text-sm space-y-2">
                <ContactRow label="Support email" value={displayValue(config?.support_email)} />
                <ContactRow label="Grievance email" value={displayValue(config?.grievance_email)} />
                <ContactRow
                  label="Grievance officer"
                  value={displayValue(config?.grievance_officer_name)}
                />
                <ContactRow label="Legal contact" value={displayValue(config?.legal_email)} />
                <ContactRow label="Operating entity" value={displayValue(config?.business_name)} />
                <ContactRow label="Address" value={displayValue(config?.business_address)} />
                <p className="pt-2 text-xs text-muted-foreground">
                  Contact details are maintained by the HumanLink team. Items marked “Not configured
                  yet” have not been published.
                </p>
              </div>
            </section>

            {showSafetyCta && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground">Need to raise a safety concern?</p>
                    <p className="text-sm text-muted-foreground">
                      Our moderation team reviews every report and grievance.
                    </p>
                  </div>
                </div>
                <Button asChild>
                  <Link to="/report-and-grievance">Report a Safety Concern</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
    </div>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1.5">
      {items.map((t, i) => (
        <li key={i}>{t}</li>
      ))}
    </ul>
  );
}

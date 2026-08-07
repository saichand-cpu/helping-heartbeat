import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";
import { Twitter, Github, Instagram, Linkedin } from "lucide-react";

const columns = [
  {
    title: "Product",
    links: [
      { to: "/requests" as const, label: "Browse requests" },
      { to: "/leaderboard" as const, label: "Leaderboard" },
      { to: "/pricing" as const, label: "Pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about" as const, label: "About" },
      { to: "/about" as const, label: "Leadership" },
      { to: "/about" as const, label: "Contact" },
    ],
  },
  {
    title: "Get started",
    links: [
      { to: "/auth" as const, label: "Create account" },
      { to: "/auth" as const, label: "Become a helper" },
      { to: "/auth" as const, label: "Sign in" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-secondary/40 mt-24">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-5">
        <div className="md:col-span-2 space-y-5">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
            Helping Humanity, One Connection at a Time. HumanLink makes asking for and offering help as simple as a single tap.
          </p>
          <div className="flex items-center gap-2">
            {[Twitter, Instagram, Linkedin, Github].map((Icon, i) => (
              <a key={i} href="#" aria-label="Social" className="h-9 w-9 grid place-items-center rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h4 className="text-sm font-semibold mb-4 text-foreground">{col.title}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {col.links.map((l, i) => (
                <li key={i}>
                  <Link to={l.to} className="hover:text-foreground transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
          <div>© {new Date().getFullYear()} HumanLink. Made with kindness.</div>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/terms-of-service" className="hover:text-foreground">Terms of Service</Link>
            <Link to="/privacy-policy" className="hover:text-foreground">Privacy Policy</Link>
            <Link to="/community-guidelines" className="hover:text-foreground">Community Guidelines</Link>
            <Link to="/user-safety" className="hover:text-foreground">User Safety</Link>
            <Link to="/refund-cancellation" className="hover:text-foreground">Refund &amp; Cancellation</Link>
            <Link to="/report-and-grievance" className="hover:text-foreground">Report &amp; Grievance</Link>
          </div>
        </div>
      </div>

    </footer>
  );
}

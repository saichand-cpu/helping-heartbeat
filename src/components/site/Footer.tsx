import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

export function Footer() {
  return (
    <footer className="border-t border-border bg-gradient-soft mt-24">
      <div className="mx-auto max-w-7xl px-6 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2 space-y-4">
          <Logo />
          <p className="text-sm text-muted-foreground max-w-sm">
            Connecting people through kindness. HumanLink makes asking for and offering help as simple as a single tap.
          </p>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/requests">Browse requests</Link></li>
            <li><Link to="/about">About</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold mb-3">Get started</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/auth">Create account</Link></li>
            <li><Link to="/auth">Become a helper</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} HumanLink. Made with kindness.
      </div>
    </footer>
  );
}

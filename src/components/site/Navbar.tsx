import { Link } from "@tanstack/react-router";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/", label: "Home" },
  { to: "/requests" as const, label: "Requests" },
  { to: "/founder" as const, label: "Founder" },
  { to: "/about" as const, label: "About" },
  { to: "/pricing" as const, label: "Pricing" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <nav className="glass flex items-center justify-between rounded-2xl px-4 py-2.5 shadow-soft">
          <Logo />
          <div className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="bg-gradient-brand text-primary-foreground border-0 shadow-glow">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-gradient-brand text-primary-foreground border-0 shadow-glow">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </nav>
        {open && (
          <div className="glass mt-2 rounded-2xl p-3 md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium rounded-lg hover:bg-accent">
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

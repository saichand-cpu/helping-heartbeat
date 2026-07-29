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
  { to: "/leaderboard" as const, label: "Leaderboard" },
  { to: "/about" as const, label: "About" },
  { to: "/pricing" as const, label: "Pricing" },
];

export function Navbar() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/85 backdrop-blur-md border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <nav className="flex h-16 items-center justify-between">
          <Logo />
          <div className="hidden md:flex items-center gap-1">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="px-3.5 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-secondary"
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {n.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme" className="rounded-full">
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            {user ? (
              <Link to="/dashboard">
                <Button size="sm" className="rounded-full h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth" className="hidden sm:inline-flex">
                  <Button variant="ghost" size="sm" className="rounded-full h-10 px-4">Sign in</Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="rounded-full h-10 px-5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
            <Button variant="ghost" size="icon" className="md:hidden rounded-full" onClick={() => setOpen(!open)} aria-label="Menu">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </nav>
        {open && (
          <div className="md:hidden pb-3 pt-1 space-y-1">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="block px-3 py-2.5 text-sm font-medium rounded-lg hover:bg-secondary">
                {n.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

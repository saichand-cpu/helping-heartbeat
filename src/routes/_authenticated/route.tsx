import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, HeartHandshake, MessageCircle, User as UserIcon, LogOut, Moon, Sun, Plus, Shield,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { useIsAdmin } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: AuthedLayout,
});

const baseNav = [
  { to: "/dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/requests" as const, label: "Requests", icon: HeartHandshake },
  { to: "/messages" as const, label: "Messages", icon: MessageCircle },
  { to: "/profile" as const, label: "Profile", icon: UserIcon },
];

function AuthedLayout() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const { isAdmin } = useIsAdmin();
  const nav = isAdmin
    ? [...baseNav, { to: "/admin" as const, label: "Admin", icon: Shield }]
    : baseNav;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);


  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[260px_1fr] gap-6 p-4 md:p-6">
        <aside className="hidden lg:block">
          <div className="glass rounded-3xl p-4 sticky top-6 shadow-soft">
            <div className="px-2 py-2"><Logo /></div>
            <nav className="mt-4 space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeProps={{ className: "bg-gradient-brand text-primary-foreground shadow-glow" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                >
                  <n.icon className="h-4 w-4" />
                  {n.label}
                </Link>
              ))}
            </nav>
            <div className="mt-4 pt-4 border-t border-border space-y-2">
              <Link to="/requests/new">
                <Button size="sm" className="w-full bg-gradient-brand text-primary-foreground border-0 shadow-glow">
                  <Plus className="h-4 w-4 mr-1" /> New request
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggle} className="flex-1">
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-1" /> : <Moon className="h-4 w-4 mr-1" />}
                  Theme
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground truncate px-2">{email}</div>
            </div>
          </div>
        </aside>

        {/* mobile top bar */}
        <div className="lg:hidden glass rounded-2xl px-4 py-3 flex items-center justify-between">
          <Logo />
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={toggle}>{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}</Button>
            <Button variant="ghost" size="icon" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>

        <main className="min-h-[80vh]">
          <Outlet />
        </main>

        {/* mobile bottom nav */}
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <div className="glass rounded-2xl px-2 py-2 grid grid-cols-4 shadow-pop">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} activeProps={{ className: "text-primary" }}
                className="flex flex-col items-center gap-0.5 py-1.5 text-xs text-muted-foreground">
                <n.icon className="h-5 w-5" /> {n.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

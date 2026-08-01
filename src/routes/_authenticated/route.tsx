import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, HeartHandshake, MessageCircle, User as UserIcon, LogOut, Moon, Sun, Plus, Shield, Newspaper, Trophy, Sparkles, BarChart3, Crown, Search, MoreHorizontal,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { useIsAdmin } from "@/hooks/use-role";
import { HumiAssistant } from "@/components/site/HumiAssistant";
import { NotificationBell } from "@/components/site/NotificationBell";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) throw redirect({ to: "/auth" });
    if (!location.pathname.startsWith("/onboarding")) {
      const { data: p } = await supabase
        .from("profiles")
        .select("profession, full_name" as never)
        .eq("id", data.user.id)
        .maybeSingle();
      const prof = (p as { profession?: string | null } | null)?.profession?.trim();
      const name = (p as { full_name?: string | null } | null)?.full_name?.trim();
      if (!prof || !name) throw redirect({ to: "/onboarding" });
    }
    return { user: data.user };
  },
  component: AuthedLayout,
});

const primaryNav = [
  { to: "/dashboard" as const, label: "Home", icon: LayoutDashboard },
  { to: "/feed" as const, label: "Feed", icon: Newspaper },
  { to: "/requests" as const, label: "Requests", icon: HeartHandshake },
  { to: "/search" as const, label: "Search", icon: Search },
  { to: "/messages" as const, label: "Messages", icon: MessageCircle },
];

const secondaryNav = [
  { to: "/humi" as const, label: "HUMI AI", icon: Sparkles },
  { to: "/capsules" as const, label: "Capsules", icon: Sparkles },
  { to: "/leaderboard" as const, label: "Leaderboard", icon: Trophy },
  { to: "/profile" as const, label: "Profile", icon: UserIcon },
];

function AuthedLayout() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState<string>("");
  const { isAdmin } = useIsAdmin();

  const sidebarNav = [
    ...primaryNav,
    ...secondaryNav,
    ...(isAdmin
      ? [
          { to: "/admin-metrics" as const, label: "Metrics", icon: BarChart3 },
          { to: "/admin" as const, label: "Admin", icon: Shield },
        ]
      : []),
  ];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl grid lg:grid-cols-[248px_1fr] gap-6 p-4 md:p-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block">
          <div className="rounded-3xl bg-card border border-border p-4 sticky top-6 shadow-soft">
            <div className="px-2 py-1 flex items-center justify-between">
              <Logo />
              <NotificationBell />
            </div>

            <Link to="/requests/new" className="block mt-5">
              <Button size="sm" className="w-full h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-semibold">
                <Plus className="h-4 w-4 mr-1.5" /> New request
              </Button>
            </Link>

            <nav className="mt-5 space-y-1">
              {sidebarNav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  activeProps={{ className: "bg-primary/10 text-primary" }}
                  inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
                >
                  <n.icon className="h-[18px] w-[18px]" />
                  {n.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5 pt-4 border-t border-border">
              {isAdmin && (
                <div className="flex items-center gap-1.5 mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                  <Crown className="h-3 w-3" /> God-mode · Pro unlocked
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggle} className="flex-1 justify-start rounded-xl">
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  Theme
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl">
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground truncate px-2 mt-2">{email}</div>
            </div>
          </div>
        </aside>

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center justify-between bg-card/80 backdrop-blur border border-border rounded-2xl px-4 py-2.5 sticky top-3 z-30 shadow-soft">
          <Logo />
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link to="/requests/new">
              <Button size="sm" className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-1" /> Ask
              </Button>
            </Link>
          </div>
        </div>

        <main className="min-h-[80vh]">
          <PageTransition>
            <Outlet />
          </PageTransition>
        </main>

        <HumiAssistant />

        {/* Apple-style mobile bottom nav: 5 primary + More */}
        <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40">
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-pop px-1.5 py-1.5 grid grid-cols-6 gap-0.5">
            {primaryNav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                activeProps={{ className: "text-primary bg-primary/10" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium transition-colors"
              >
                <n.icon className="h-[22px] w-[22px]" />
                <span>{n.label}</span>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-medium text-muted-foreground data-[state=open]:text-primary data-[state=open]:bg-primary/10">
                <MoreHorizontal className="h-[22px] w-[22px]" />
                <span>More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-2 w-56 rounded-2xl">
                <DropdownMenuLabel className="text-xs">Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {secondaryNav.map((n) => (
                  <DropdownMenuItem key={n.to} asChild>
                    <Link to={n.to} className="cursor-pointer">
                      <n.icon className="h-4 w-4 mr-2" /> {n.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/admin-metrics"><BarChart3 className="h-4 w-4 mr-2" /> Metrics</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/admin"><Shield className="h-4 w-4 mr-2" /> Admin</Link>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggle}>
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                  Toggle theme
                </DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

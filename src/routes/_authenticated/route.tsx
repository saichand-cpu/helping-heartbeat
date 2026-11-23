import { createFileRoute, Outlet, redirect, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/site/Logo";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, HeartHandshake, MessageCircle, User as UserIcon, LogOut, Moon, Sun, Plus, Shield, Newspaper, Trophy, Sparkles, BarChart3, Crown, Search, MoreHorizontal, Users, Compass,
} from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useEffect, useState } from "react";
import { useIsAdmin } from "@/hooks/use-role";
import { HumiAssistant } from "@/components/site/HumiAssistant";
import { NotificationBell } from "@/components/site/NotificationBell";
import { PageTransition } from "@/components/motion/PageTransition";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw redirect({ to: "/auth" });
    let user = sessionData.session.user;
    const { data, error } = await supabase.auth.getUser();
    if (data?.user) user = data.user;
    else if (error) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.data.session?.user) user = refreshed.data.session.user;
      else throw redirect({ to: "/auth" });
    }
    if (!location.pathname.startsWith("/onboarding")) {
      const { data: p } = await supabase.from("profiles").select("profession, full_name" as never).eq("id", user.id).maybeSingle();
      const prof = (p as { profession?: string | null } | null)?.profession?.trim();
      const name = (p as { full_name?: string | null } | null)?.full_name?.trim();
      if (!prof || !name) throw redirect({ to: "/onboarding" });
    }
    return { user };
  },
  component: AuthedLayout,
});

const primaryNav = [
  { to: "/dashboard" as const, label: "Home", icon: LayoutDashboard },
  { to: "/search" as const, label: "Discover", icon: Compass },
  { to: "/requests" as const, label: "Help", icon: HeartHandshake },
  { to: "/messages" as const, label: "Messages", icon: MessageCircle },
  { to: "/feed" as const, label: "Feed", icon: Newspaper },
];

const communityNav = [
  { to: "/groups" as const, label: "Communities", icon: Users },
  { to: "/humi" as const, label: "HUMI AI", icon: Sparkles },
  { to: "/leaderboard" as const, label: "Impact", icon: Trophy },
  { to: "/profile" as const, label: "My profile", icon: UserIcon },
];

function AuthedLayout() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const { isAdmin } = useIsAdmin();
  const sidebarNav = [...primaryNav, ...communityNav];

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const navLink = (n: (typeof sidebarNav)[number]) => (
    <Link
      key={n.to}
      to={n.to}
      activeOptions={{ exact: n.to === "/dashboard" }}
      activeProps={{ className: "bg-primary/10 text-primary font-semibold" }}
      inactiveProps={{ className: "text-muted-foreground hover:bg-muted hover:text-foreground" }}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
    >
      <n.icon className="h-[18px] w-[18px]" />
      {n.label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-[1440px] grid lg:grid-cols-[248px_minmax(0,1fr)] gap-4 lg:gap-6 p-3 sm:p-4 lg:p-6">
        <aside className="hidden lg:block">
          <div className="rounded-3xl bg-card border border-border p-4 sticky top-6 shadow-soft">
            <div className="px-2 py-1 flex items-center justify-between">
              <Logo />
              <NotificationBell />
            </div>
            <Link to="/requests/new" className="block mt-5">
              <Button size="sm" className="w-full h-11 rounded-xl font-semibold">
                <Plus className="h-4 w-4 mr-2" /> Ask for help
              </Button>
            </Link>
            <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Your HumanLink</div>
            <nav className="mt-2 space-y-1">
              {primaryNav.map(navLink)}
            </nav>
            <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Community & tools</div>
            <nav className="mt-2 space-y-1">
              {communityNav.map(navLink)}
            </nav>
            {isAdmin && (
              <>
                <div className="mt-6 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Administration</div>
                <nav className="mt-2 space-y-1">
                  <Link to="/admin-metrics" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><BarChart3 className="h-[18px] w-[18px]" /> Platform metrics</Link>
                  <Link to="/admin" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-muted"><Shield className="h-[18px] w-[18px]" /> Admin console</Link>
                </nav>
              </>
            )}
            <div className="mt-6 pt-4 border-t border-border">
              {isAdmin && <div className="flex items-center gap-1.5 mb-3 rounded-lg px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30"><Crown className="h-3 w-3" /> Admin access</div>}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={toggle} className="flex-1 justify-start rounded-xl">
                  {theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />} Appearance
                </Button>
                <Button variant="ghost" size="icon" onClick={signOut} className="rounded-xl" aria-label="Sign out"><LogOut className="h-4 w-4" /></Button>
              </div>
              <div className="text-xs text-muted-foreground truncate px-2 mt-2">{email}</div>
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <div className="lg:hidden flex items-center justify-between bg-card/90 backdrop-blur border border-border rounded-2xl px-3 sm:px-4 py-2.5 sticky top-2 z-30 shadow-soft">
            <Logo />
            <div className="flex items-center gap-1">
              <NotificationBell />
              <Link to="/requests/new"><Button size="sm" className="h-9 rounded-xl"><Plus className="h-4 w-4 mr-1" /> Ask</Button></Link>
            </div>
          </div>
          <main className="min-h-[80vh] min-w-0 mt-3 lg:mt-0">
            <PageTransition><Outlet /></PageTransition>
          </main>
        </div>

        <HumiAssistant />

        <div className="lg:hidden fixed bottom-2 left-2 right-2 z-40">
          <div className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-pop px-1 py-1 grid grid-cols-6 gap-0.5">
            {primaryNav.map((n) => (
              <Link key={n.to} to={n.to} activeOptions={{ exact: n.to === "/dashboard" }}
                activeProps={{ className: "text-primary bg-primary/10" }}
                inactiveProps={{ className: "text-muted-foreground" }}
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium transition-colors min-w-0">
                <n.icon className="h-5 w-5" /><span className="truncate max-w-full">{n.label}</span>
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-medium text-muted-foreground data-[state=open]:text-primary data-[state=open]:bg-primary/10">
                <MoreHorizontal className="h-5 w-5" /><span>More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" side="top" className="mb-2 w-60 rounded-2xl">
                <DropdownMenuLabel className="text-xs">More from HumanLink</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {communityNav.map((n) => <DropdownMenuItem key={n.to} asChild><Link to={n.to} className="cursor-pointer"><n.icon className="h-4 w-4 mr-2" />{n.label}</Link></DropdownMenuItem>)}
                {isAdmin && <><DropdownMenuSeparator /><DropdownMenuItem asChild><Link to="/admin-metrics"><BarChart3 className="h-4 w-4 mr-2" /> Platform metrics</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/admin"><Shield className="h-4 w-4 mr-2" /> Admin console</Link></DropdownMenuItem></>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={toggle}>{theme === "dark" ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}Appearance</DropdownMenuItem>
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="h-4 w-4 mr-2" />Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </div>
  );
}

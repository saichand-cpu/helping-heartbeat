import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  HeartHandshake, Award, Clock, CheckCircle2, MessageCircle, Sparkles, Plus, ArrowRight, Brain, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { smartMatch } from "@/lib/ai-match.functions";
import { UserSearch } from "@/components/site/UserSearch";
import { SuggestedForYou } from "@/components/site/SuggestedForYou";
import { NotificationOptIn } from "@/components/site/NotificationOptIn";
import { SubscriptionPanel } from "@/components/site/SubscriptionPanel";
import { PlanSummaryCard } from "@/components/site/PlanSummaryCard";
import { CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Profile = { full_name: string; karma_points: number; avatar_url: string | null; role: string };

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ active: 0, accepted: 0, completed: 0, unread: 0 });
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data: p } = await supabase.from("profiles").select("full_name, karma_points, avatar_url, role").eq("id", u.user.id).maybeSingle();
      setProfile(p as Profile | null);

      const [active, accepted, completed, unread] = await Promise.all([
        supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("requester_id", u.user.id).eq("status", "open"),
        supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("helper_id", u.user.id).eq("status", "accepted"),
        supabase.from("help_requests").select("id", { count: "exact", head: true }).eq("helper_id", u.user.id).eq("status", "completed"),
        supabase.from("messages").select("id", { count: "exact", head: true }).eq("receiver_id", u.user.id).eq("read", false),
      ]);
      setStats({
        active: active.count ?? 0,
        accepted: accepted.count ?? 0,
        completed: completed.count ?? 0,
        unread: unread.count ?? 0,
      });
    })();
  }, []);

  const cards = [
    { label: "Karma points", value: profile?.karma_points ?? 0, icon: Award, tint: "text-amber-600 bg-amber-500/10" },
    { label: "Active requests", value: stats.active, icon: Clock, tint: "text-primary bg-primary/10" },
    { label: "Currently helping", value: stats.accepted, icon: HeartHandshake, tint: "text-emerald-600 bg-emerald-500/10" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, tint: "text-violet-600 bg-violet-500/10" },
  ];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  const quick = [
    { to: "/requests/new" as const, label: "Need Help", sub: "Create a help request", icon: HeartHandshake, tint: "bg-primary text-primary-foreground" },
    { to: "/requests" as const, label: "Offer Help", sub: "Help someone in need", icon: Award, tint: "bg-brand text-white" },
    { to: "/requests/new" as const, label: "Emergency", sub: "Get urgent assistance", icon: Clock, tint: "bg-destructive text-destructive-foreground" },
  ];

  return (
    <div className="space-y-6 pb-28 lg:pb-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-1"
      >
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          {greeting}, <span className="text-foreground">{profile?.full_name || "friend"}</span> 👋
        </h1>
        <p className="text-sm text-muted-foreground">How can we help today?</p>
      </motion.div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {quick.map((q, i) => (
          <motion.div key={q.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={q.to} className="block rounded-2xl border border-border bg-card p-5 shadow-soft hover-lift">
              <div className={`h-10 w-10 rounded-full grid place-items-center ${q.tint}`}>
                <q.icon className="h-5 w-5" />
              </div>
              <div className="mt-3.5 text-sm font-semibold">{q.label}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{q.sub}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* AI assistant banner */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-soft flex items-center gap-4">
        <div className="h-12 w-12 shrink-0 rounded-2xl bg-accent grid place-items-center text-primary">
          <Sparkles className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-base font-semibold text-primary">AI Assistant</div>
          <div className="text-xs text-muted-foreground">How can I help you today?</div>
        </div>
        <Link to="/requests/new">
          <Button className="rounded-full h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90">Ask AI</Button>
        </Link>
      </div>

      <NotificationOptIn />

      <UserSearch />

      <SuggestedForYou />


      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList className="bg-muted rounded-2xl p-1 h-11">
          <TabsTrigger value="overview" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm h-9 px-4">
            <Sparkles className="h-4 w-4 mr-1.5" /> Overview
          </TabsTrigger>
          <TabsTrigger value="match" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm h-9 px-4">
            <Brain className="h-4 w-4 mr-1.5" /> AI Smart Match
          </TabsTrigger>
          <TabsTrigger value="subscription" className="rounded-xl data-[state=active]:bg-card data-[state=active]:shadow-sm h-9 px-4">
            <CreditCard className="h-4 w-4 mr-1.5" /> Subscription
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <PlanSummaryCard onManage={() => setTab("subscription")} />

          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div
                key={c.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04, duration: 0.3 }}
                className="rounded-2xl border border-border bg-card p-5 hover-lift"
              >
                <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${c.tint}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div className="mt-4 text-3xl font-semibold tracking-tight">{c.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card border border-border p-6 shadow-soft">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold tracking-tight">Visit the global feed</h3>
              <p className="text-sm text-muted-foreground mt-1">See updates, stories, and announcements from your community.</p>
              <Link to="/feed" className="mt-4 inline-flex">
                <Button variant="outline" className="rounded-xl gap-1">Open feed <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-gradient-to-br from-primary to-[#1d4ed8] text-primary-foreground shadow-pop relative overflow-hidden">
              <div className="absolute -bottom-16 -right-10 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden />
              <MessageCircle className="h-7 w-7" />
              <h3 className="mt-4 text-lg font-semibold tracking-tight">{stats.unread} unread {stats.unread === 1 ? "message" : "messages"}</h3>
              <p className="text-sm text-white/85 mt-1">Keep the conversations going. Kindness compounds.</p>
              <Link to="/messages" className="mt-4 inline-flex">
                <Button className="rounded-xl bg-white text-primary hover:bg-white/90 gap-1">Open inbox <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="match">
          <SmartMatchPanel />
        </TabsContent>

        <TabsContent value="subscription">
          <SubscriptionPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

type MatchResult = { request_id: string; title: string; category: string; urgency: string; score: number; reasons: string[] };

function SmartMatchPanel() {
  const run = useServerFn(smartMatch);
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setLoading(true);
    try {
      const res = await run();
      setMatches(res as MatchResult[]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-6 shadow-soft">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" /> AI Smart Match
          </div>
          <h3 className="text-xl font-semibold mt-1">Find people you're perfect to help</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Our AI scans open requests against your skills, interests, and bio to find the best matches.
          </p>
        </div>
        <Button onClick={go} disabled={loading} className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
          {loading ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
          {matches ? "Re-run match" : "Run smart match"}
        </Button>
      </div>

      {loading && (
        <div className="mt-5 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
      )}

      {!loading && matches && matches.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center py-10">
          No strong matches right now. Check back when new requests appear.
        </div>
      )}

      {!loading && matches && matches.length > 0 && (
        <div className="mt-5 grid md:grid-cols-2 gap-4">
          {matches.map((m) => (
            <motion.div key={m.request_id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4 flex gap-4 hover-lift">
              <div className="relative h-16 w-16 shrink-0">
                <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-muted opacity-30" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" className="text-primary"
                    strokeWidth="3" strokeDasharray={`${(m.score / 100) * 94.2} 94.2`} strokeLinecap="round" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-sm font-bold">{m.score}%</div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{m.title}</div>
                <div className="text-xs text-muted-foreground">{m.category} · {m.urgency}</div>
                <ul className="mt-2 text-xs space-y-1 text-muted-foreground">
                  {m.reasons.map((r, i) => <li key={i}>• {r}</li>)}
                </ul>
                <Link to="/requests" className="inline-block mt-2 text-xs text-primary font-medium">Offer help →</Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

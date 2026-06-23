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

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

type Profile = { full_name: string; karma_points: number; avatar_url: string | null; role: string };

function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ active: 0, accepted: 0, completed: 0, unread: 0 });

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
    { label: "Karma", value: profile?.karma_points ?? 0, icon: Award, color: "from-amber-400 to-orange-500" },
    { label: "Active", value: stats.active, icon: Clock, color: "from-blue-400 to-indigo-500" },
    { label: "Helping", value: stats.accepted, icon: HeartHandshake, color: "from-emerald-400 to-teal-500" },
    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "from-violet-400 to-fuchsia-500" },
  ];

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 md:p-8 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Welcome back</div>
            <h1 className="text-3xl md:text-4xl font-bold mt-1">
              Hi, <span className="text-gradient-brand">{profile?.full_name || "friend"}</span> 👋
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Ready to spread some kindness today?</p>
          </div>
          <div className="flex gap-2">
            <Link to="/requests/new">
              <Button className="bg-gradient-brand text-primary-foreground border-0 shadow-glow"><Plus className="h-4 w-4 mr-1" /> Ask for help</Button>
            </Link>
            <Link to="/requests">
              <Button variant="outline">Browse requests</Button>
            </Link>
          </div>
        </div>
      </motion.div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="overview"><Sparkles className="h-4 w-4 mr-1" /> Overview</TabsTrigger>
          <TabsTrigger value="match"><Brain className="h-4 w-4 mr-1" /> AI Smart Match</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
            {cards.map((c, i) => (
              <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="relative rounded-3xl border border-border bg-card p-5 overflow-hidden">
                <div className={`absolute -top-8 -right-8 h-24 w-24 rounded-full bg-gradient-to-br ${c.color} opacity-20 blur-2xl`} />
                <c.icon className="h-5 w-5 text-primary" />
                <div className="mt-3 text-3xl font-bold">{c.value}</div>
                <div className="text-xs text-muted-foreground">{c.label}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-6 shadow-soft">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 text-primary" /> Community
              </div>
              <h3 className="mt-2 text-xl font-semibold">Visit the global feed</h3>
              <p className="text-sm text-muted-foreground mt-1">See updates, stories, and announcements from your community.</p>
              <Link to="/feed" className="mt-4 inline-flex"><Button variant="outline" className="gap-1">Open feed <ArrowRight className="h-4 w-4" /></Button></Link>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl p-6 bg-gradient-brand text-primary-foreground shadow-pop relative overflow-hidden">
              <MessageCircle className="h-6 w-6" />
              <h3 className="mt-2 text-xl font-semibold">{stats.unread} unread messages</h3>
              <p className="text-sm opacity-90 mt-1">Keep the conversations going. Kindness compounds.</p>
              <Link to="/messages" className="mt-4 inline-flex"><Button variant="secondary" className="gap-1">Open inbox <ArrowRight className="h-4 w-4" /></Button></Link>
            </motion.div>
          </div>
        </TabsContent>

        <TabsContent value="match">
          <SmartMatchPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

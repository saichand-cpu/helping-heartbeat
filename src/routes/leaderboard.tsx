import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Search, Crown, Medal, Award } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({
    meta: [
      { title: "Leaderboard — HumanLink" },
      { name: "description", content: "Top helpers ranked by karma. Celebrate the most kind people in the community." },
      { property: "og:title", content: "Top Helpers — HumanLink" },
      { property: "og:description", content: "See who is spreading the most kindness this week, month, and all-time." },
    ],
  }),
  component: LeaderboardPage,
});

type Helper = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  karma_points: number;
  premium_tier: string | null;
  recent_helps: number;
};

type Range = "all" | "30d" | "7d";

function LeaderboardPage() {
  const [range, setRange] = useState<Range>("all");
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState<Helper[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setRows(null);
      const { data: u } = await supabase.auth.getUser();
      const meId = u.user?.id ?? null;
      // Pull top profiles by karma
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, karma_points, premium_tier, incognito")
        .order("karma_points", { ascending: false })
        .limit(100);

      // Recent helps per user for time-range filter
      const since =
        range === "7d"
          ? new Date(Date.now() - 7 * 86400000).toISOString()
          : range === "30d"
            ? new Date(Date.now() - 30 * 86400000).toISOString()
            : null;

      let helpsByUser: Record<string, number> = {};
      if (since) {
        const { data: helps } = await supabase
          .from("help_requests")
          .select("helper_id")
          .eq("status", "completed")
          .gte("updated_at", since)
          .not("helper_id", "is", null);
        for (const h of helps ?? []) {
          if (!h.helper_id) continue;
          helpsByUser[h.helper_id] = (helpsByUser[h.helper_id] ?? 0) + 1;
        }
      }

      if (cancelled) return;
      const enriched: Helper[] = (profiles ?? []).map((p) => {
        const isOwn = meId === p.id;
        const incog = (p as any).incognito && !isOwn;
        return {
          id: p.id,
          full_name: incog ? "Anonymous Helper" : (p.full_name ?? "Anonymous"),
          avatar_url: incog ? null : p.avatar_url,
          karma_points: p.karma_points ?? 0,
          premium_tier: incog ? null : ((p as any).premium_tier ?? null),
          recent_helps: helpsByUser[p.id] ?? 0,
        };
      });

      const ranked = since
        ? enriched.filter((p) => p.recent_helps > 0).sort((a, b) => b.recent_helps - a.recent_helps)
        : enriched.sort((a, b) => b.karma_points - a.karma_points);

      setRows(ranked);
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  const filtered = useMemo(() => {
    if (!rows) return null;
    if (!query.trim()) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.full_name.toLowerCase().includes(q));
  }, [rows, query]);

  const top3 = (filtered ?? []).slice(0, 3);
  const rest = (filtered ?? []).slice(3);

  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 md:px-6 py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass text-xs text-muted-foreground">
            <Trophy className="h-3.5 w-3.5 text-amber-500" /> Top helpers
          </div>
          <h1 className="mt-3 text-4xl md:text-6xl font-bold">
            Karma <span className="text-gradient-brand">Leaderboard</span>
          </h1>
          <p className="mt-3 text-muted-foreground">Celebrating people who turn kindness into action.</p>
        </motion.div>

        <div className="mt-8 glass rounded-2xl p-3 flex flex-wrap items-center gap-2 shadow-soft">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search helpers..."
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {([
              { v: "all", label: "All-time" },
              { v: "30d", label: "30 days" },
              { v: "7d", label: "7 days" },
            ] as { v: Range; label: string }[]).map((r) => (
              <Button
                key={r.v}
                size="sm"
                variant={range === r.v ? "default" : "ghost"}
                className={range === r.v ? "bg-gradient-brand text-primary-foreground border-0" : ""}
                onClick={() => setRange(r.v)}
              >
                {r.label}
              </Button>
            ))}
          </div>
        </div>

        {filtered === null ? (
          <div className="mt-10 space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-10 glass rounded-2xl p-12 text-center shadow-soft">
            <Trophy className="h-10 w-10 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">No helpers found for this range.</p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <div className="mt-10 grid grid-cols-3 gap-3 md:gap-6 items-end">
              {[1, 0, 2].map((idx) => {
                const h = top3[idx];
                if (!h) return <div key={idx} />;
                const heights = ["h-44", "h-56", "h-36"];
                const accents = [
                  { ring: "ring-slate-300", icon: Medal, color: "text-slate-400", bg: "from-slate-400/20 to-slate-200/5" },
                  { ring: "ring-amber-400", icon: Crown, color: "text-amber-500", bg: "from-amber-400/30 to-amber-200/10" },
                  { ring: "ring-orange-400", icon: Award, color: "text-orange-500", bg: "from-orange-400/20 to-orange-200/5" },
                ];
                const rankIdx = idx === 1 ? 1 : idx === 0 ? 0 : 2;
                const A = accents[rankIdx].icon;
                return (
                  <motion.div
                    key={h.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={`relative ${heights[rankIdx]} rounded-3xl bg-card border border-border overflow-hidden shadow-pop`}
                    style={{ transform: "perspective(800px) rotateX(2deg)" }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-b ${accents[rankIdx].bg}`} />
                    <div className="relative h-full p-3 md:p-4 flex flex-col items-center justify-end text-center">
                      <div className={`absolute top-3 right-3 ${accents[rankIdx].color}`}>
                        <A className="h-5 w-5" />
                      </div>
                      <div className={`h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground font-bold text-lg ring-4 ${accents[rankIdx].ring} ring-offset-2 ring-offset-card`}>
                        {h.avatar_url ? (
                          <img src={h.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                        ) : (
                          h.full_name.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="mt-2 font-semibold text-sm flex items-center gap-1 truncate max-w-full">
                        <span className="truncate">{h.full_name}</span>
                        {h.premium_tier && <VerifiedBadge tier={h.premium_tier} />}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {range === "all" ? `${h.karma_points} karma` : `${h.recent_helps} helps`}
                      </div>
                      <div className={`mt-2 text-2xl font-bold ${accents[rankIdx].color}`}>#{rankIdx + 1}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Rest */}
            <div className="mt-8 space-y-2">
              {rest.map((h, i) => (
                <motion.div
                  key={h.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.02 }}
                  className="glass rounded-2xl p-3 flex items-center gap-3 shadow-soft"
                >
                  <div className="w-8 text-center font-bold text-muted-foreground">#{i + 4}</div>
                  <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                    {h.avatar_url ? (
                      <img src={h.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
                    ) : (
                      h.full_name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate flex items-center gap-1">
                      {h.full_name}
                      {h.premium_tier && <VerifiedBadge tier={h.premium_tier} />}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {h.karma_points} karma{range !== "all" && ` · ${h.recent_helps} recent helps`}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </section>
      <Footer />
    </div>
  );
}

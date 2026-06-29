import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useIsAdmin } from "@/hooks/use-role";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, RefreshCw, Lock, Users, HeartHandshake, CheckCircle2,
  Newspaper, Eye, MousePointerClick, TrendingUp, TrendingDown, Minus,
} from "lucide-react";
import { getHumiBriefing, type HumiMetrics } from "@/lib/humi.functions";

export const Route = createFileRoute("/_authenticated/admin-metrics")({
  component: AdminMetricsPage,
});

function AdminMetricsPage() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) return <Skeleton className="h-40 w-full" />;
  if (!isAdmin) {
    return (
      <div className="glass rounded-3xl p-12 text-center shadow-soft max-w-lg mx-auto mt-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Admins only</h1>
        <p className="mt-2 text-muted-foreground">Metrics are restricted to admin users.</p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }
  return <MetricsContent />;
}

function MetricsContent() {
  const fn = useServerFn(getHumiBriefing);
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["humi-briefing"],
    queryFn: () => fn({ data: {} as never }) as Promise<HumiMetrics>,
    staleTime: 60_000,
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">Metrics</h1>
            <Badge className="bg-gradient-brand text-primary-foreground border-0">HUMI</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Today vs past 7 days, with an AI briefing from HUMI.</p>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline">
          <RefreshCw className={`h-4 w-4 mr-1 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </header>

      <HumiBriefing data={data} loading={isLoading} error={error as Error | null} />

      {isLoading || !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <>
          <TrendGrid data={data} />
          <TotalsRow data={data} />
        </>
      )}
    </div>
  );
}

function HumiBriefing({
  data, loading, error,
}: { data: HumiMetrics | undefined; loading: boolean; error: Error | null }) {
  return (
    <div className="relative overflow-hidden rounded-3xl p-6 md:p-8 shadow-soft glass border border-primary/20">
      <div className="absolute inset-0 bg-gradient-brand opacity-[0.06] pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-brand flex items-center justify-center shadow-glow">
            <Sparkles className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              HUMI briefing
              {data && (
                <span className="text-xs text-muted-foreground font-normal">
                  · {new Date(data.generatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground">Daily and 7-day momentum, summarised for admins</div>
          </div>
        </div>

        <div className="mt-4">
          {loading ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          ) : error ? (
            <p className="text-sm text-destructive">Couldn't load briefing: {error.message}</p>
          ) : data ? (
            <>
              <p className="text-base leading-relaxed">{data.briefing}</p>
              {data.highlights.length > 0 && (
                <ul className="mt-4 grid sm:grid-cols-2 gap-2">
                  {data.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm rounded-xl bg-background/50 px-3 py-2 border border-border/50">
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function TrendGrid({ data }: { data: HumiMetrics }) {
  const items: Array<{ label: string; today: number; week: number; Icon: any }> = [
    { label: "New members", today: data.today.newUsers, week: data.last7d.newUsers, Icon: Users },
    { label: "New requests", today: data.today.newRequests, week: data.last7d.newRequests, Icon: HeartHandshake },
    { label: "Completions", today: data.today.completed, week: data.last7d.completed, Icon: CheckCircle2 },
    { label: "New posts", today: data.today.newPosts, week: data.last7d.newPosts, Icon: Newspaper },
    { label: "Ad impressions", today: data.today.adImpressions, week: data.last7d.adImpressions, Icon: Eye },
    { label: "Ad clicks", today: data.today.adClicks, week: data.last7d.adClicks, Icon: MousePointerClick },
  ];
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Trends</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {items.map((i) => {
          // Today's run-rate vs. weekly average per day
          const avgPerDay = i.week / 7;
          const delta = i.today - avgPerDay;
          const pct = avgPerDay > 0 ? (delta / avgPerDay) * 100 : (i.today > 0 ? 100 : 0);
          const dir = delta > 0.5 ? "up" : delta < -0.5 ? "down" : "flat";
          const TrendIcon = dir === "up" ? TrendingUp : dir === "down" ? TrendingDown : Minus;
          const trendClass = dir === "up" ? "text-emerald-600 bg-emerald-500/10"
            : dir === "down" ? "text-rose-600 bg-rose-500/10"
            : "text-muted-foreground bg-muted";
          return (
            <div key={i.label} className="glass rounded-2xl p-5 shadow-soft">
              <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide">
                {i.label}<i.Icon className="h-3.5 w-3.5" />
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <div className="text-3xl font-bold">{i.today}</div>
                <div className="text-xs text-muted-foreground">today</div>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{i.week} in 7d</span>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md ${trendClass}`}>
                  <TrendIcon className="h-3 w-3" />
                  {pct >= 0 ? "+" : ""}{pct.toFixed(0)}% vs avg
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TotalsRow({ data }: { data: HumiMetrics }) {
  const items = [
    { label: "Total users", value: data.totals.users },
    { label: "Total requests", value: data.totals.requests },
    { label: "Open requests", value: data.totals.openRequests },
    { label: "Active ads", value: data.totals.activeAds },
  ];
  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-2">Totals</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {items.map((i) => (
          <div key={i.label} className="glass rounded-2xl p-5 shadow-soft">
            <div className="text-xs text-muted-foreground uppercase tracking-wide">{i.label}</div>
            <div className="mt-1 text-3xl font-bold">{i.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

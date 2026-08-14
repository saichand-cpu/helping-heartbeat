import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Compass, Trophy, Users, HandHeart, Sparkles, ArrowRight, MapPin, Search as SearchIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { SuggestedForYou } from "@/components/site/SuggestedForYou";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { categoryEmoji, categoryLabel } from "@/lib/groups";
import { timeAgo } from "@/lib/social";

export const Route = createFileRoute("/_authenticated/discover")({
  component: DiscoverPage,
});

type Helper = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  location: string | null;
  karma_points: number | null;
  premium_tier: string | null;
};

type GroupRow = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  avatar_url: string | null;
  location: string | null;
  created_at: string;
};

type RequestRow = {
  id: string;
  title: string;
  category: string;
  urgency: string;
  location: string | null;
  created_at: string;
};

function Section({
  icon: Icon, title, subtitle, action, children,
}: {
  icon: typeof Compass;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-3"
    >
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Icon className="h-[18px] w-[18px] text-primary" aria-hidden /> {title}
          </h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </motion.section>
  );
}

function DiscoverPage() {
  const [helpers, setHelpers] = useState<Helper[]>([]);
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [newGroups, setNewGroups] = useState<GroupRow[]>([]);
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [h, g, r] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, profession, location, karma_points, premium_tier")
          .order("karma_points", { ascending: false })
          .limit(8),
        supabase
          .from("groups")
          .select("id, name, category, description, avatar_url, location, created_at")
          .eq("privacy", "public")
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("help_requests")
          .select("id, title, category, urgency, location, created_at")
          .eq("status", "open")
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (!alive) return;
      setHelpers((h.data ?? []) as Helper[]);
      const all = (g.data ?? []) as GroupRow[];
      setGroups(all.slice(0, 6));
      setNewGroups(all.slice(6, 12));
      setRequests((r.data ?? []) as RequestRow[]);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 pb-24 lg:pb-6">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Compass className="h-4 w-4 text-primary" aria-hidden /> Discover
        </div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">Find people, groups and help</h1>
        <p className="mt-1 text-muted-foreground">
          Explore your community — helpers near you, active requests and groups worth joining.
        </p>
        <Link to="/search" className="mt-4 block">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground shadow-soft transition-colors hover:bg-muted">
            <SearchIcon className="h-4 w-4" aria-hidden />
            Search people, posts, groups and requests
          </div>
        </Link>
      </header>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-2xl" />)}
        </div>
      ) : (
        <>
          <Section icon={Sparkles} title="Recommended people" subtitle="Based on your area and interests">
            <SuggestedForYou />
          </Section>

          <Section
            icon={Trophy}
            title="Top helpers"
            subtitle="People with the strongest reputation on HumanLink"
            action={
              <Link to="/leaderboard">
                <Button variant="ghost" size="sm">All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              </Link>
            }
          >
            {helpers.length === 0 ? (
              <EmptyState icon={Trophy} title="No helpers yet" description="Reputation builds as people complete help." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {helpers.map((p) => (
                  <Link
                    key={p.id}
                    to="/profile/$userId"
                    params={{ userId: p.id }}
                    className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft transition-colors hover:bg-muted"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={p.avatar_url ?? undefined} alt={p.full_name ?? "Member"} />
                      <AvatarFallback>{(p.full_name ?? "H").slice(0, 1)}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {p.full_name ?? "HumanLink member"}
                        {p.premium_tier && <VerifiedBadge tier={p.premium_tier} className="h-4 w-4" />}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {p.profession || "Helper"}{p.location ? ` · ${p.location}` : ""}
                      </div>
                    </div>
                    <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
                      {p.karma_points ?? 0}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section
            icon={HandHeart}
            title="Help people are asking for"
            subtitle="Open requests from the community"
            action={
              <Link to="/requests">
                <Button variant="ghost" size="sm">All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              </Link>
            }
          >
            {requests.length === 0 ? (
              <EmptyState
                icon={HandHeart}
                title="No help requests yet"
                description="Be the first person in your community to ask for help."
                action={<Link to="/requests/new"><Button>Ask for help</Button></Link>}
              />
            ) : (
              <div className="space-y-2.5">
                {requests.map((r) => (
                  <Link
                    key={r.id}
                    to="/requests/$requestId"
                    params={{ requestId: r.id }}
                    className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-colors hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{r.title}</p>
                        <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">{r.category.replace("_", " ")}</span>
                          {r.location && (<><span aria-hidden>·</span><MapPin className="h-3 w-3" aria-hidden />{r.location}</>)}
                          <span aria-hidden>·</span>{timeAgo(r.created_at)}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-lg border px-2 py-0.5 text-[11px] font-medium capitalize ${
                          r.urgency === "emergency" || r.urgency === "high"
                            ? "border-destructive/25 bg-destructive/10 text-destructive"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                      >
                        {r.urgency}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Section>

          <Section
            icon={Users}
            title="Popular groups"
            subtitle="Communities you can join right now"
            action={
              <Link to="/groups">
                <Button variant="ghost" size="sm">All <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button>
              </Link>
            }
          >
            {groups.length === 0 ? (
              <EmptyState
                icon={Users}
                title="No groups yet"
                description="Start the first community on HumanLink."
                action={<Link to="/groups"><Button>Create a group</Button></Link>}
              />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((g) => <GroupTile key={g.id} g={g} />)}
              </div>
            )}
          </Section>

          {newGroups.length > 0 && (
            <Section icon={Compass} title="New communities" subtitle="Recently created on HumanLink">
              <div className="grid gap-3 sm:grid-cols-2">
                {newGroups.map((g) => <GroupTile key={g.id} g={g} />)}
              </div>
            </Section>
          )}
        </>
      )}
    </div>
  );
}

function GroupTile({ g }: { g: GroupRow }) {
  return (
    <Link
      to="/groups/$groupId"
      params={{ groupId: g.id }}
      className="flex items-start gap-3 rounded-2xl border border-border bg-card p-3.5 shadow-soft transition-colors hover:bg-muted"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg" aria-hidden>
        {categoryEmoji(g.category)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold">{g.name}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {categoryLabel(g.category)}{g.location ? ` · ${g.location}` : ""}
        </span>
        {g.description && (
          <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">{g.description}</span>
        )}
      </span>
    </Link>
  );
}

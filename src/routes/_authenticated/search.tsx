import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Search as SearchIcon, MapPin, X, SlidersHorizontal, Users, HeartHandshake,
  Sparkles, ShieldCheck, Award, Loader2, Plus, Frown,
} from "lucide-react";
import { displayIdentity } from "@/lib/identity";

export const Route = createFileRoute("/_authenticated/search")({
  component: AdvancedSearch,
});

type Tab = "requests" | "people";
type UserType = "all" | "verified" | "helpers";

const CATEGORIES = [
  "education", "medical", "food", "transport", "technology",
  "elder_care", "child_care", "jobs", "donations", "emergency", "other",
] as const;

const SUGGESTED_SKILLS = [
  "Tutoring", "Coding", "Design", "Cooking", "Driving", "Elderly care",
  "Childcare", "Translation", "Medical", "Handyman", "Music", "Fitness",
];

type Req = {
  id: string; title: string; description: string; category: string;
  urgency: string; location: string | null; created_at: string; requester_id: string;
};
type Person = {
  id: string; full_name: string | null; username: string | null;
  avatar_url: string | null; profession: string | null; location: string | null;
  bio: string | null;
  skills: string[] | null; verified: boolean | null; karma_points: number | null;
  incognito: boolean | null; premium_tier: string | null;
  account_type: string | null; org_type: string | null;
};

function AdvancedSearch() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("requests");
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [userType, setUserType] = useState<UserType>("all");
  const [skills, setSkills] = useState<string[]>([]);
  const [skillDraft, setSkillDraft] = useState("");

  const [me, setMe] = useState<string | null>(null);
  const [reqs, setReqs] = useState<Req[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const addSkill = (s: string) => {
    const v = s.trim();
    if (!v) return;
    setSkills((prev) => (prev.includes(v) ? prev : [...prev, v]));
    setSkillDraft("");
  };
  const removeSkill = (s: string) => setSkills((prev) => prev.filter((x) => x !== s));

  const clearAll = () => {
    setQ(""); setCity(""); setCategory("all"); setUserType("all"); setSkills([]);
  };

  const activeCount = useMemo(() => {
    let n = 0;
    if (q.trim()) n++;
    if (city.trim()) n++;
    if (tab === "requests" && category !== "all") n++;
    if (tab === "people" && userType !== "all") n++;
    if (skills.length) n++;
    return n;
  }, [q, city, category, userType, skills, tab]);

  // Debounced search
  useEffect(() => {
    const t = window.setTimeout(async () => {
      setLoading(true);
      try {
        if (tab === "requests") {
          const safe = q.trim().replace(/[%_]/g, "");
          const cityTerm = city.trim().replace(/[%_]/g, "");
          let query = supabase
            .from("help_requests")
            .select("id, title, description, category, urgency, location, created_at, requester_id")
            .eq("status", "open")
            .order("created_at", { ascending: false })
            .limit(60);
          if (category !== "all") query = query.eq("category", category as never);
          if (safe) query = query.or(`title.ilike.%${safe}%,description.ilike.%${safe}%`);
          if (cityTerm) query = query.ilike("location", `%${cityTerm}%`);
          if (skills.length) {
            const like = skills.map((s) => `description.ilike.%${s.replace(/[%_]/g, "")}%`).join(",");
            query = query.or(like);
          }
          const { data } = await query;
          setReqs(((data as Req[] | null) ?? []));
        } else {
          const safe = q.trim().replace(/[%_]/g, "");
          const cityTerm = city.trim().replace(/[%_]/g, "");
          let query = supabase
            .from("profiles")
            .select("id, full_name, username, avatar_url, profession, location, skills, verified, karma_points, incognito, premium_tier" as never)
            .limit(60);
          if (safe) {
            query = query.or(
              `full_name.ilike.%${safe}%,username.ilike.%${safe}%,profession.ilike.%${safe}%`,
            );
          }
          if (cityTerm) query = query.ilike("location", `%${cityTerm}%`);
          if (skills.length) query = query.overlaps("skills" as never, skills as never);
          if (userType === "verified") query = query.eq("verified", true);
          if (userType === "helpers") query = query.gt("karma_points", 0);
          const { data } = await query;
          const rows = ((data as unknown as Person[]) ?? []).filter((r) => r?.id !== me);
          setPeople(rows);
        }
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => window.clearTimeout(t);
  }, [tab, q, city, category, userType, skills, me]);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 lg:pb-6">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-brand p-6 md:p-8 text-primary-foreground shadow-pop relative overflow-hidden">
        <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex items-start gap-3">
          <div className="h-11 w-11 rounded-2xl bg-white/20 grid place-items-center">
            <SearchIcon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold">Discover</h1>
            <p className="text-sm text-primary-foreground/90 mt-1">
              Find the right help — or the right helper — with skill, category and city filters.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="glass rounded-2xl p-1.5 flex gap-1 shadow-soft w-fit">
        <TabButton active={tab === "requests"} onClick={() => setTab("requests")} icon={<HeartHandshake className="h-4 w-4" />}>
          Requests
        </TabButton>
        <TabButton active={tab === "people"} onClick={() => setTab("people")} icon={<Users className="h-4 w-4" />}>
          People
        </TabButton>
      </div>

      {/* Filter Panel */}
      <div className="glass rounded-3xl p-5 shadow-soft space-y-4">
        <div className="grid md:grid-cols-[1fr_260px] gap-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tab === "requests"
                ? "Search by title, keyword, or description…"
                : "Search by name, username or profession…"}
              className="pl-9 h-11 rounded-2xl"
            />
          </div>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or region"
              className="pl-9 h-11 rounded-2xl"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          {tab === "requests" ? (
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c} className="capitalize">
                    {c.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <Select value={userType} onValueChange={(v) => setUserType(v as UserType)}>
              <SelectTrigger className="h-11 rounded-2xl">
                <SelectValue placeholder="Member type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="helpers">Active helpers (karma &gt; 0)</SelectItem>
                <SelectItem value="verified">Verified members</SelectItem>
              </SelectContent>
            </Select>
          )}

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SlidersHorizontal className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={skillDraft}
                onChange={(e) => setSkillDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") { e.preventDefault(); addSkill(skillDraft); }
                }}
                placeholder="Add a skill and press Enter"
                className="pl-9 h-11 rounded-2xl"
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-2xl"
              onClick={() => addSkill(skillDraft)}
              disabled={!skillDraft.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Suggested skills */}
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_SKILLS.filter((s) => !skills.includes(s)).slice(0, 8).map((s) => (
            <button
              key={s}
              onClick={() => addSkill(s)}
              className="text-xs px-2.5 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-accent transition-colors"
            >
              + {s}
            </button>
          ))}
        </div>

        {/* Active chips */}
        {(skills.length > 0 || activeCount > 0) && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border">
            {skills.map((s) => (
              <Badge key={s} variant="secondary" className="gap-1 rounded-full pl-3 pr-1 py-1">
                {s}
                <button
                  onClick={() => removeSkill(s)}
                  className="ml-1 h-5 w-5 grid place-items-center rounded-full hover:bg-background/50"
                  aria-label={`Remove ${s}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {activeCount > 0 && (
              <button
                onClick={clearAll}
                className="ml-auto text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          {loading ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching…</>
          ) : (
            <>
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              {tab === "requests" ? `${reqs.length} request${reqs.length === 1 ? "" : "s"}` : `${people.length} member${people.length === 1 ? "" : "s"}`} found
            </>
          )}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-40 rounded-3xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : tab === "requests" ? (
        reqs.length === 0 ? (
          <EmptyState
            title="No requests match your filters"
            hint="Try widening your search — remove a skill, clear the city, or pick a different category."
            action={
              <Link to="/requests/new">
                <Button className="bg-gradient-brand text-primary-foreground border-0 shadow-glow">
                  <Plus className="h-4 w-4 mr-1" /> Create a request
                </Button>
              </Link>
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {reqs.map((r, i) => (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
                onClick={() => navigate({ to: "/requests" })}
                className="text-left rounded-3xl border border-border bg-card p-5 hover:shadow-pop hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <Badge variant="secondary" className="capitalize">{r.category.replace("_", " ")}</Badge>
                  <Badge
                    className={
                      r.urgency === "emergency"
                        ? "bg-destructive/15 text-destructive border-0"
                        : r.urgency === "high"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-0"
                          : "bg-accent text-accent-foreground border-0"
                    }
                  >
                    {r.urgency}
                  </Badge>
                </div>
                <h3 className="mt-3 font-semibold text-lg leading-snug line-clamp-2">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {r.location || "Anywhere"}
                </div>
              </motion.button>
            ))}
          </div>
        )
      ) : people.length === 0 ? (
        <EmptyState
          title="No members match your filters"
          hint="Try a broader city, remove some skills, or switch to 'Everyone'."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {people.map((p, i) => {
            const id = displayIdentity(p, me);
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.02 }}
              >
                <Link
                  to="/profile/$userId"
                  params={{ userId: p.id }}
                  className="block rounded-3xl border border-border bg-card p-5 hover:shadow-pop hover:-translate-y-0.5 transition-all h-full"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      {id.avatar_url && <AvatarImage src={id.avatar_url} />}
                      <AvatarFallback className="text-lg">{id.initial}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold truncate flex items-center gap-1">
                        {id.name}
                        {p.verified && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {p.profession || "Member"}
                      </div>
                    </div>
                  </div>
                  {p.location && (
                    <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {p.location}
                    </div>
                  )}
                  {p.skills?.length ? (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {p.skills.slice(0, 4).map((s) => (
                        <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>
                      ))}
                      {p.skills.length > 4 && (
                        <Badge variant="outline" className="text-[10px] font-normal">+{p.skills.length - 4}</Badge>
                      )}
                    </div>
                  ) : null}
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Award className="h-3 w-3 text-amber-500" />
                    {p.karma_points ?? 0} karma
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TabButton({
  active, onClick, icon, children,
}: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={
        "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-xl transition-all " +
        (active
          ? "bg-gradient-brand text-primary-foreground shadow-glow"
          : "text-muted-foreground hover:text-foreground hover:bg-accent")
      }
    >
      {icon}
      {children}
    </button>
  );
}

function EmptyState({
  title, hint, action,
}: { title: string; hint: string; action?: React.ReactNode }) {
  return (
    <div className="glass rounded-3xl p-12 text-center">
      <div className="h-14 w-14 mx-auto rounded-2xl bg-accent grid place-items-center text-muted-foreground">
        <Frown className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-xl font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">{hint}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

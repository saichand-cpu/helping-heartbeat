import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { X, UserPlus, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/use-follow";
import { displayIdentity } from "@/lib/identity";

type Row = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  location: string | null;
  incognito: boolean | null;
  premium_tier: string | null;
};

export function SuggestedForYou() {
  const [me, setMe] = useState<string | null>(null);
  const [myLoc, setMyLoc] = useState<string | null>(null);
  const [myProf, setMyProf] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<Row[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      const uid = u?.user?.id;
      if (!uid) {
        setLoading(false);
        return;
      }
      setMe(uid);
      const { data: mine } = await supabase
        .from("profiles")
        .select("location, profession" as never)
        .eq("id", uid)
        .maybeSingle();
      const loc = (mine as { location?: string } | null)?.location ?? null;
      const prof = (mine as { profession?: string } | null)?.profession ?? null;
      setMyLoc(loc);
      setMyProf(prof);

      const { data: following } = await supabase
        .from("follows")
        .select("followed_id")
        .eq("follower_id", uid);
      const excluded = new Set<string>([uid, ...((following ?? []).map((f) => f.followed_id))]);

      // Prefer same location or profession, fall back to recent profiles
      const orFilters: string[] = [];
      if (loc) orFilters.push(`location.ilike.%${loc}%`);
      if (prof) orFilters.push(`profession.ilike.%${prof}%`);

      let query = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, profession, location, incognito, premium_tier" as never)
        .neq("id", uid)
        .limit(12);
      if (orFilters.length) query = query.or(orFilters.join(","));

      const { data } = await query;
      const rows = ((data as unknown as Row[]) ?? []).filter((r) => r?.id && !excluded.has(r.id));

      // Top up with recent profiles if we have too few
      if (rows.length < 6) {
        const { data: more } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, profession, location, incognito, premium_tier" as never)
          .neq("id", uid)
          .order("created_at", { ascending: false })
          .limit(12);
        for (const m of ((more as unknown as Row[]) ?? [])) {
          if (m?.id && !excluded.has(m.id) && !rows.find((r) => r.id === m.id)) rows.push(m);
          if (rows.length >= 8) break;
        }
      }
      setSuggestions(rows.slice(0, 8));
      setLoading(false);
    })();
  }, []);

  const visible = suggestions.filter((s) => !dismissed.has(s.id));

  if (loading) {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 w-40 rounded-2xl bg-muted/40 animate-pulse shrink-0" />
        ))}
      </div>
    );
  }
  if (!visible.length) return null;

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Sparkles className="h-4 w-4 text-primary" /> Suggested for you
        </div>
        {(myLoc || myProf) && (
          <div className="text-[11px] text-muted-foreground">
            Based on {myProf ? `your work${myLoc ? " · " : ""}` : ""}{myLoc || ""}
          </div>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
        {visible.map((r) => (
          <SuggestionCard
            key={r.id}
            row={r}
            viewerId={me}
            onDismiss={() => setDismissed((d) => new Set(d).add(r.id))}
          />
        ))}
      </div>
    </section>
  );
}

function SuggestionCard({
  row,
  viewerId,
  onDismiss,
}: {
  row: Row;
  viewerId: string | null;
  onDismiss: () => void;
}) {
  const { following: isFollowing, toggle, busy } = useFollow(row.id);
  const id = displayIdentity(row, viewerId);
  const loading = busy;
  return (
    <div className="w-40 shrink-0 snap-start rounded-2xl border border-border bg-card p-3 flex flex-col items-center text-center relative">
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="absolute top-1.5 right-1.5 h-6 w-6 grid place-items-center rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <Link to="/profile/$userId" params={{ userId: row.id }} className="flex flex-col items-center gap-2">
        <Avatar className="h-16 w-16 mt-1 ring-2 ring-primary/20">
          {id.avatar_url && <AvatarImage src={id.avatar_url} />}
          <AvatarFallback className="text-lg">{id.initial}</AvatarFallback>
        </Avatar>
        <div className="text-sm font-semibold leading-tight line-clamp-2 min-h-[2.5rem]">{id.name}</div>
        <div className="text-[11px] text-muted-foreground line-clamp-1 min-h-[1rem]">
          {row.profession || "Member"}
        </div>
      </Link>
      <Button
        size="sm"
        onClick={toggle}
        disabled={loading}
        variant={isFollowing ? "outline" : "default"}
        className={
          isFollowing
            ? "mt-2 w-full h-8 text-xs border-amber-500/50 text-amber-600 dark:text-amber-400"
            : "mt-2 w-full h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
        }
      >
        {isFollowing ? (
          <><Check className="h-3 w-3 mr-1" /> Following</>
        ) : (
          <><UserPlus className="h-3 w-3 mr-1" /> Follow</>
        )}
      </Button>
    </div>
  );
}

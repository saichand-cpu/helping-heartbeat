import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { motion } from "framer-motion";
import { Sparkles, Loader2, MessageCircle, Award, MapPin, CheckCircle2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { recommendHelpers, type HelperRec } from "@/lib/helper-match.functions";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";

export function RecommendedHelpers({
  requestId,
  requesterId,
  currentUserId,
}: {
  requestId: string;
  requesterId: string;
  currentUserId: string | null;
}) {
  const run = useServerFn(recommendHelpers);
  const [recs, setRecs] = useState<HelperRec[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = currentUserId === requesterId;

  useEffect(() => {
    let cancelled = false;
    if (!isOwner) return; // only the requester (or admin, handled server-side) sees recs
    (async () => {
      // Try cache first
      const { data: cached } = await supabase
        .from("helper_recommendations")
        .select("helper_id, score, reasons")
        .eq("request_id", requestId)
        .order("score", { ascending: false })
        .limit(8);
      if (cached && cached.length > 0 && !cancelled) {
        // Enrich cached rows with profile info
        const ids = cached.map((c) => c.helper_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, karma_points, verified, availability, profession, location")
          .in("id", ids);
        const pMap = new Map((profiles ?? []).map((p) => [p.id, p]));
        const enriched: HelperRec[] = cached.map((c) => {
          const p = pMap.get(c.helper_id);
          return {
            helper_id: c.helper_id,
            score: c.score,
            reasons: c.reasons ?? [],
            full_name: p?.full_name ?? null,
            avatar_url: p?.avatar_url ?? null,
            karma_points: p?.karma_points ?? null,
            verified: p?.verified ?? null,
            availability: p?.availability ?? null,
            profession: p?.profession ?? null,
            location: p?.location ?? null,
            completed_helps: 0,
          };
        });
        setRecs(enriched);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId, isOwner]);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await run({ data: { requestId } });
      setRecs(res);
    } catch (e) {
      setError((e as Error).message ?? "Could not load recommendations");
    } finally {
      setLoading(false);
    }
  };

  if (!isOwner) return null;

  return (
    <div className="rounded-3xl bg-card border border-border p-5 md:p-6 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Brain className="h-4 w-4 text-primary" /> AI Helper Matching
          </div>
          <h2 className="mt-1 text-lg font-semibold">Recommended helpers</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ranked by skills, location, availability, karma, and response time.
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading}>
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
          ) : (
            <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
          )}
          {recs ? "Refresh" : "Find matches"}
        </Button>
      </div>

      {error && <p className="mt-3 text-xs text-destructive">{error}</p>}

      {loading && !recs && (
        <div className="mt-4 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      )}

      {!loading && recs && recs.length === 0 && (
        <div className="mt-6 text-sm text-muted-foreground text-center py-8">
          No strong matches yet. Try again after your request has been live for a bit.
        </div>
      )}

      {recs && recs.length > 0 && (
        <div className="mt-4 grid gap-3">
          {recs.map((r) => (
            <motion.div
              key={r.helper_id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl border border-border bg-card p-4 flex gap-3"
            >
              <div className="relative shrink-0">
                {r.avatar_url ? (
                  <img
                    src={r.avatar_url}
                    alt={r.full_name ?? "Helper"}
                    className="h-12 w-12 rounded-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-primary" aria-hidden />
                )}
                <div className="absolute -bottom-1 -right-1 rounded-full bg-background text-[10px] font-bold px-1.5 py-0.5 border border-border">
                  {r.score}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    to="/profile/$userId"
                    params={{ userId: r.helper_id }}
                    className="font-semibold text-sm truncate hover:underline"
                  >
                    {r.full_name ?? "Helper"}
                  </Link>
                  {r.verified && <VerifiedBadge tier={null} />}
                  {r.availability === "available" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                      Available
                    </span>
                  )}
                  {r.availability === "emergency_only" && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-700 dark:text-red-300">
                      Emergency only
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
                  {r.profession && <span className="truncate">{r.profession}</span>}
                  {r.location && (
                    <span className="inline-flex items-center gap-0.5">
                      <MapPin className="h-3 w-3" /> {r.location}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-0.5">
                    <Award className="h-3 w-3" /> {r.karma_points ?? 0}
                  </span>
                  {r.completed_helps > 0 && (
                    <span className="inline-flex items-center gap-0.5">
                      <CheckCircle2 className="h-3 w-3" /> {r.completed_helps}
                    </span>
                  )}
                </div>
                {r.reasons.length > 0 && (
                  <ul className="mt-1.5 text-[11px] text-muted-foreground space-y-0.5">
                    {r.reasons.slice(0, 2).map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex flex-col gap-1.5 shrink-0 justify-center">
                <Link
                  to="/messages"
                  search={{ userId: r.helper_id } as never}
                >
                  <Button size="sm" className="h-8 gap-1">
                    <MessageCircle className="h-3.5 w-3.5" /> Message
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

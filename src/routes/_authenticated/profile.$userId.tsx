import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Award, ShieldCheck, EyeOff, MessageCircle, Phone, Lock, Loader2, ArrowLeft, MapPin, Check, X, UserPlus, UserCheck,
  Star, Send, Trash2,
} from "lucide-react";
import { useFollow } from "@/hooks/use-follow";
import { ProfileMediaGrid } from "@/components/site/ProfileMediaGrid";

export const Route = createFileRoute("/_authenticated/profile/$userId")({
  component: PublicProfile,
});

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  karma_points: number;
  verified: boolean;
  incognito: boolean;
  premium_tier: string | null;
  skills: string[] | null;
  languages: string[] | null;
  phone: string | null;
  account_type: string | null;
  org_type: string | null;
  fundraising_link: string | null;
  operational_hours: string | null;
};

type SharedOffer = {
  id: string;
  request_id: string;
  status: string;
  helper_id: string;
  request_title: string;
  requester_id: string;
};

function PublicProfile() {
  const { userId } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [offers, setOffers] = useState<SharedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);
  const [messaging, setMessaging] = useState(false);

  const load = async () => {
    const { data: u } = await supabase.auth.getUser();
    const meId = u.user?.id ?? null;
    setMe(meId);

    if (meId === userId) {
      navigate({ to: "/profile", replace: true });
      return;
    }

    const [{ data: prof }, { data: contact }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, full_name, avatar_url, bio, location, karma_points, verified, incognito, premium_tier, skills, languages, account_type, org_type, fundraising_link, operational_hours")
        .eq("id", userId)
        .maybeSingle(),
      supabase
        .from("profile_contacts" as never)
        .select("phone")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);
    const phone = ((contact as { phone?: string } | null)?.phone) ?? null;
    setProfile(prof ? ({ ...(prof as object), phone } as Profile) : null);

    if (meId) {
      // Offers where (I'm helper, target is requester) OR (I'm requester, target is helper)
      const { data: rows } = await supabase
        .from("request_offers")
        .select("id, request_id, status, helper_id, help_requests!inner(title, requester_id)")
        .or(`helper_id.eq.${meId},helper_id.eq.${userId}`);
      const filtered = ((rows as any[]) ?? [])
        .filter((r) => {
          const reqId = r.help_requests?.requester_id;
          return (
            (r.helper_id === meId && reqId === userId) ||
            (r.helper_id === userId && reqId === meId)
          );
        })
        .map((r) => ({
          id: r.id,
          request_id: r.request_id,
          status: r.status,
          helper_id: r.helper_id,
          request_title: r.help_requests.title,
          requester_id: r.help_requests.requester_id,
        }));
      setOffers(filtered);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const hasAcceptedOffer = offers.some((o) => o.status === "accepted");
  const incomingPending = offers.filter((o) => o.helper_id === userId && o.status === "pending");

  const respondOffer = async (offerId: string, status: "accepted" | "declined") => {
    setActioning(offerId);
    const { error } = await supabase.from("request_offers").update({ status } as never).eq("id", offerId);
    setActioning(null);
    if (error) return toast.error(error.message);
    toast.success(status === "accepted" ? "Offer accepted — contact unlocked" : "Offer declined");
    load();
  };

  const startChat = () => {
    if (!profile) return;
    navigate({ to: "/messages", search: { user: profile.id } });
  };

  const callNow = () => {
    if (!profile?.phone) return;
    window.location.href = `tel:${profile.phone}`;
  };

  if (loading) return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="rounded-3xl bg-black border border-[hsl(45_90%_55%)]/40 h-56 animate-pulse" />
      <div className="rounded-3xl bg-black border border-[hsl(45_90%_55%)]/40 h-40 animate-pulse" />
    </div>
  );
  if (!profile) return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-3xl bg-black border border-[hsl(45_90%_55%)]/40 p-12 text-center shadow-pop">
        <div className="h-24 w-24 mx-auto rounded-full bg-white/[0.04] border border-[hsl(45_90%_55%)]/30 grid place-items-center text-white/40 text-3xl mb-4">?</div>
        <h2 className="text-xl font-bold text-white mb-1">User Profile Not Found</h2>
        <p className="text-sm text-white/60 mb-5">This account may have been removed or the link is broken.</p>
        <Link to="/requests"><Button variant="outline" className="border-[hsl(45_90%_55%)]/40 text-white hover:bg-white/5"><ArrowLeft className="h-4 w-4 mr-1" /> Back to requests</Button></Link>
      </div>
    </div>
  );

  const display = profile.incognito ? "Anonymous Helper" : profile.full_name;
  const initial = (display || "?").charAt(0).toUpperCase();

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-6 space-y-6">
      <button onClick={() => history.back()} className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl bg-gradient-brand p-6 md:p-8 text-primary-foreground shadow-pop relative overflow-hidden">
        <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/20 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur grid place-items-center text-3xl font-bold overflow-hidden">
            {profile.incognito ? <EyeOff className="h-8 w-8" /> :
              profile.avatar_url ? <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" /> : initial}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold truncate">{display}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <Badge variant="secondary" className="gap-1"><Award className="h-3 w-3" /> {profile.karma_points} karma</Badge>
              {profile.verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3 w-3" /> Verified</Badge>}
              {profile.location && !profile.incognito && (
                <Badge variant="secondary" className="gap-1"><MapPin className="h-3 w-3" /> {profile.location}</Badge>
              )}
            </div>
          </div>
        </div>
        {profile.bio && !profile.incognito && (
          <p className="relative mt-4 text-sm text-primary-foreground/90 max-w-prose">{profile.bio}</p>
        )}
      </motion.div>

      {/* Follow + stats */}
      <FollowBlock targetId={profile.id} />

      {/* Action bar */}
      <div className="glass rounded-3xl p-5 shadow-soft space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={startChat}
            disabled={messaging}
            size="lg"
            className="h-12 px-6 text-base font-semibold bg-[hsl(220_90%_56%)] hover:bg-[hsl(220_90%_50%)] text-white border-0 shadow-[0_0_24px_-4px_hsl(220_90%_56%/0.7)] hover:shadow-[0_0_32px_-4px_hsl(220_90%_56%/0.9)] transition-all"
          >
            {messaging ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <MessageCircle className="h-5 w-5 mr-2" />}
            Message
          </Button>
          {hasAcceptedOffer && profile.phone ? (
            <Button onClick={callNow} variant="outline" className="border-primary/40 text-primary">
              <Phone className="h-4 w-4 mr-1" /> Call {profile.phone}
            </Button>
          ) : (
            <Button disabled variant="outline" className="text-muted-foreground">
              <Lock className="h-3.5 w-3.5 mr-1" /> Call unlocks after accepted offer
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Contact details (phone) stay private until {(display ?? "this user").split(" ")[0]} accepts your offer to help on a specific request.
        </p>
      </div>

      {/* Pending offers from this user (only shown to the requester) */}
      {incomingPending.length > 0 && (
        <div className="glass rounded-3xl p-5 shadow-soft">
          <h3 className="font-semibold mb-3">{display.split(" ")[0]} offered to help on:</h3>
          <ul className="space-y-2">
            {incomingPending.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
                <span className="text-sm truncate">{o.request_title}</span>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" onClick={() => respondOffer(o.id, "accepted")} disabled={actioning === o.id}
                    className="bg-gradient-brand text-primary-foreground border-0">
                    <Check className="h-3.5 w-3.5 mr-1" /> Accept
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => respondOffer(o.id, "declined")} disabled={actioning === o.id}>
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Skills/Languages */}
      {(profile.skills?.length || profile.languages?.length) && !profile.incognito ? (
        <div className="glass rounded-3xl p-5 shadow-soft space-y-3">
          {profile.skills?.length ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <Badge key={s} variant="secondary">{s}</Badge>)}
              </div>
            </div>
          ) : null}
          {profile.languages?.length ? (
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Languages</div>
              <div className="flex flex-wrap gap-1.5">
                {profile.languages.map((s) => <Badge key={s} variant="outline">{s}</Badge>)}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
      <ProfileMediaGrid userId={profile.id} isOwner={false} />
      <ReviewsSection targetId={profile.id} targetName={display} me={me} />
    </div>
  );
}

type ReviewRow = {
  id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  request_id: string | null;
  reviewer_name?: string | null;
  reviewer_avatar?: string | null;
};

function ReviewsSection({ targetId, targetName, me }: { targetId: string; targetName: string; me: string | null }) {
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const hydrate = async (list: ReviewRow[]) => {
    const ids = Array.from(new Set(list.map((r) => r.reviewer_id)));
    if (!ids.length) return list;
    const { data } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", ids);
    const map = new Map((data ?? []).map((p) => [p.id, p]));
    return list.map((r) => {
      const p = map.get(r.reviewer_id);
      return { ...r, reviewer_name: p?.full_name ?? null, reviewer_avatar: p?.avatar_url ?? null };
    });
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("reviews")
        .select("id, reviewer_id, reviewee_id, rating, comment, created_at, request_id")
        .eq("reviewee_id", targetId)
        .order("created_at", { ascending: false })
        .limit(100);
      const hydrated = await hydrate((data as ReviewRow[]) ?? []);
      if (!cancelled) { setRows(hydrated); setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [targetId]);

  useEffect(() => {
    const ch = supabase
      .channel(`reviews:${targetId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "reviews", filter: `reviewee_id=eq.${targetId}` }, async (payload) => {
        const r = payload.new as ReviewRow;
        const [hydrated] = await hydrate([r]);
        setRows((prev) => prev.find((x) => x.id === r.id) ? prev : [hydrated, ...prev]);
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "reviews", filter: `reviewee_id=eq.${targetId}` }, (payload) => {
        const r = payload.old as ReviewRow;
        setRows((prev) => prev.filter((x) => x.id !== r.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetId]);

  const submit = async () => {
    if (!me) return toast.error("Sign in to leave a review");
    if (me === targetId) return toast.error("You can't review yourself");
    const text = comment.trim();
    if (!text) return toast.error("Write a short review first");
    setSubmitting(true);
    const optimisticId = `tmp-${Date.now()}`;
    const optimistic: ReviewRow = {
      id: optimisticId, reviewer_id: me, reviewee_id: targetId,
      rating, comment: text, created_at: new Date().toISOString(), request_id: null,
    };
    const [hydrated] = await hydrate([optimistic]);
    setRows((prev) => [hydrated, ...prev]);
    const { data, error } = await supabase
      .from("reviews")
      .insert({ reviewee_id: targetId, reviewer_id: me, rating, comment: text } as never)
      .select("id, reviewer_id, reviewee_id, rating, comment, created_at, request_id")
      .single();
    setSubmitting(false);
    if (error || !data) {
      setRows((prev) => prev.filter((x) => x.id !== optimisticId));
      return toast.error(error?.message || "Could not post review");
    }
    setComment("");
    setRating(5);
    setRows((prev) => {
      const without = prev.filter((x) => x.id !== optimisticId && x.id !== (data as ReviewRow).id);
      return [{ ...(data as ReviewRow), reviewer_name: hydrated.reviewer_name, reviewer_avatar: hydrated.reviewer_avatar }, ...without];
    });
    toast.success("Review posted");
  };

  const remove = async (id: string) => {
    const prev = rows;
    setRows((r) => r.filter((x) => x.id !== id));
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) { setRows(prev); toast.error(error.message); }
  };

  const avg = rows.length ? (rows.reduce((a, r) => a + (r.rating || 0), 0) / rows.length).toFixed(1) : "—";

  return (
    <div className="rounded-3xl bg-black border border-[hsl(45_90%_55%)]/40 p-5 md:p-6 shadow-pop">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-[hsl(45_90%_60%)] fill-[hsl(45_90%_60%)]" />
          <h2 className="text-lg font-bold text-white">User Reviews</h2>
        </div>
        <div className="text-sm text-white/70">
          <span className="text-white font-semibold tabular-nums">{avg}</span> · {rows.length} review{rows.length === 1 ? "" : "s"}
        </div>
      </div>

      {me && me !== targetId && (
        <div className="rounded-2xl border border-[hsl(45_90%_55%)]/30 bg-white/[0.02] p-4 mb-5 space-y-3">
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
                className="p-1 hover:scale-110 transition-transform"
              >
                <Star className={`h-5 w-5 ${n <= rating ? "fill-[hsl(45_90%_60%)] text-[hsl(45_90%_60%)]" : "text-white/30"}`} />
              </button>
            ))}
            <span className="text-xs text-white/60 ml-2">{rating}/5</span>
          </div>
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Share your experience with ${targetName.split(" ")[0]}…`}
            rows={3}
            maxLength={800}
            className="bg-black/60 border-white/10 text-white placeholder:text-white/40"
          />
          <div className="flex justify-end">
            <Button
              onClick={submit}
              disabled={submitting || !comment.trim()}
              className="bg-[hsl(220_90%_56%)] hover:bg-[hsl(220_90%_50%)] text-white border-0 shadow-[0_0_20px_-4px_hsl(220_90%_56%/0.7)]"
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Post review
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-white/[0.03] animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="py-10 text-center text-sm text-white/60">
          No reviews yet — be the first to share how {targetName.split(" ")[0]} helped you.
        </div>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
              <div className="flex items-start gap-3">
                <Link
                  to="/profile/$userId"
                  params={{ userId: r.reviewer_id }}
                  className="h-10 w-10 rounded-full bg-gradient-to-br from-[hsl(220_90%_56%)] to-[hsl(220_95%_65%)] grid place-items-center text-white text-sm font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-[hsl(220_90%_56%)]/60 transition"
                >
                  {r.reviewer_avatar ? (
                    <img src={r.reviewer_avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    (r.reviewer_name || "U").charAt(0).toUpperCase()
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <Link
                      to="/profile/$userId"
                      params={{ userId: r.reviewer_id }}
                      className="text-sm font-semibold text-[hsl(220_95%_70%)] hover:underline truncate"
                    >
                      {r.reviewer_name || "User"}
                    </Link>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-3.5 w-3.5 ${i < (r.rating || 0) ? "fill-[hsl(45_90%_60%)] text-[hsl(45_90%_60%)]" : "text-white/20"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="text-[11px] text-white/50 mt-0.5">
                    {new Date(r.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                  </div>
                  {r.comment && (
                    <p className="text-sm text-white/85 mt-2 whitespace-pre-wrap break-words">{r.comment}</p>
                  )}
                </div>
                {me === r.reviewer_id && (
                  <button
                    onClick={() => remove(r.id)}
                    className="text-white/40 hover:text-red-400 transition"
                    aria-label="Delete review"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FollowBlock({ targetId }: { targetId: string }) {
  const { following, followers, followingCount, busy, toggle, isMe, loading } = useFollow(targetId);
  return (
    <div className="rounded-3xl bg-black border border-[hsl(45_90%_55%)]/40 p-5 shadow-pop flex flex-wrap items-center justify-between gap-4">
      <div className="grid grid-cols-2 gap-3 flex-1 min-w-[240px]">
        <div className="rounded-2xl border border-[hsl(45_90%_55%)]/30 bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl md:text-3xl font-black text-[hsl(220_95%_70%)] tabular-nums">
            {followers.toLocaleString()}
          </div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-[hsl(45_90%_60%)] mt-0.5 font-semibold">
            Followers
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(45_90%_55%)]/30 bg-white/[0.02] px-4 py-3 text-center">
          <div className="text-2xl md:text-3xl font-black text-[hsl(220_95%_70%)] tabular-nums">
            {followingCount.toLocaleString()}
          </div>
          <div className="text-[11px] uppercase tracking-[0.15em] text-[hsl(45_90%_60%)] mt-0.5 font-semibold">
            Following
          </div>
        </div>
      </div>
      {!isMe && (
        <Button
          onClick={toggle}
          disabled={busy || loading}
          className={following
            ? "bg-black border border-[hsl(45_90%_55%)]/60 text-white hover:bg-[hsl(45_90%_55%)]/10"
            : "bg-[hsl(220_90%_56%)] hover:bg-[hsl(220_90%_50%)] text-white border-0 shadow-[0_0_20px_-4px_hsl(220_90%_56%/0.7)]"}
        >
          {following ? <UserCheck className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}

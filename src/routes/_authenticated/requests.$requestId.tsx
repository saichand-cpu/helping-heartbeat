import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, AlertTriangle, Heart, PhoneCall, Phone,
  GraduationCap, Stethoscope, Utensils, Car, Laptop, Users, Baby, Briefcase, Gift, Siren,
  Award, ShieldCheck, UserRound, Star, Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LeafletMap, useGeocodedPins } from "@/components/site/LeafletMap";
import { CallOverlay } from "@/components/site/CallOverlay";
import { useWebRTC } from "@/hooks/use-webrtc";
import { usePresence } from "@/hooks/use-presence";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { pinKindFor } from "@/lib/org-types";
import { resolveMediaUrl } from "@/lib/upload";
import { Thread, type Conversation } from "./messages";
import { RecommendedHelpers } from "@/components/site/RecommendedHelpers";

export const Route = createFileRoute("/_authenticated/requests/$requestId")({
  component: RequestDetailsPage,
  head: () => ({
    meta: [
      { title: "Request Details — HumanLink" },
      { name: "description", content: "Full request details, requester profile, and instant chat." },
      { property: "og:title", content: "Request Details — HumanLink" },
      { property: "og:description", content: "Full request details, requester profile, and instant chat." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Request = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  location: string | null;
  status: string;
  created_at: string;
  requester_id: string;
  image_url: string | null;
  budget: number | null;
  deadline: string | null;
};

type OwnerProfile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  karma_points: number | null;
  verified: boolean | null;
  premium_tier: string | null;
  profession: string | null;
  account_type: string | null;
  org_type: string | null;
  last_seen_at: string | null;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  education: GraduationCap, medical: Stethoscope, food: Utensils, transport: Car,
  technology: Laptop, elder_care: Users, child_care: Baby, jobs: Briefcase,
  donations: Gift, emergency: Siren, other: Heart,
};

const URGENCY_STYLE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-accent text-accent-foreground",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  emergency: "bg-destructive/15 text-destructive",
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function relativeSeen(iso?: string | null) {
  if (!iso) return "Offline";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "Active just now";
  if (m < 60) return `Last seen ${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Last seen ${h}h ago`;
  const d = Math.floor(h / 24);
  return `Last seen ${d}d ago`;
}

function RequestDetailsPage() {
  const { requestId } = Route.useParams();
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [request, setRequest] = useState<Request | null>(null);
  const [owner, setOwner] = useState<OwnerProfile | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [reviews, setReviews] = useState(0);
  const [phone, setPhone] = useState<string | null>(null);
  const [imgUrl, setImgUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatReady, setChatReady] = useState(false);

  const rtc = useWebRTC(me);
  const presence = usePresence(me);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  // Load request + owner
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setNotFound(false);
    (async () => {
      const { data: req, error } = await supabase
        .from("help_requests")
        .select("*")
        .eq("id", requestId)
        .maybeSingle();
      if (!alive) return;
      if (error || !req) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const r = req as Request;
      setRequest(r);

      const [{ data: prof }, { data: contact }, { count: fCount }, { count: gCount }, { count: rCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio, karma_points, verified, premium_tier, profession, account_type, org_type, last_seen_at")
          .eq("id", r.requester_id)
          .maybeSingle(),
        supabase.from("profile_contacts").select("phone").eq("user_id", r.requester_id).maybeSingle(),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("followed_id", r.requester_id),
        supabase.from("follows").select("*", { count: "exact", head: true }).eq("follower_id", r.requester_id),
        supabase.from("reviews").select("*", { count: "exact", head: true }).eq("reviewee_id", r.requester_id),
      ]);
      if (!alive) return;
      setOwner((prof as OwnerProfile | null) ?? null);
      setPhone((contact as { phone?: string | null } | null)?.phone ?? null);
      setFollowers(fCount ?? 0);
      setFollowing(gCount ?? 0);
      setReviews(rCount ?? 0);

      if (r.image_url) {
        resolveMediaUrl(r.image_url).then((u) => { if (alive) setImgUrl(u); });
      } else {
        setImgUrl(null);
      }
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [requestId]);

  // Find-or-create conversation with owner (skip if viewing own request)
  const findOrCreate = useCallback(async (meId: string, targetId: string) => {
    const pairFilter = `and(participant_one_id.eq.${meId},participant_two_id.eq.${targetId}),and(participant_one_id.eq.${targetId},participant_two_id.eq.${meId})`;
    const { data: existing } = await supabase
      .from("conversations").select("*").or(pairFilter).maybeSingle();
    if (existing) return existing as { id: string };
    const [participant_one_id, participant_two_id] = [meId, targetId].sort();
    const { data: created, error } = await supabase
      .from("conversations")
      .insert({ participant_one_id, participant_two_id })
      .select("*").single();
    if (!error && created) return created as { id: string };
    if (error?.code === "23505") {
      const { data: raced } = await supabase
        .from("conversations").select("*").or(pairFilter).maybeSingle();
      return raced as { id: string } | null;
    }
    throw error ?? new Error("Conversation create failed");
  }, []);

  useEffect(() => {
    if (!me || !request?.requester_id) return;
    if (me === request.requester_id) { setChatReady(false); return; }
    let alive = true;
    (async () => {
      try {
        const conv = await findOrCreate(me, request.requester_id);
        if (!alive || !conv) return;
        setConversationId(conv.id);
        setChatReady(true);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not open chat");
      }
    })();
    return () => { alive = false; };
  }, [me, request?.requester_id, findOrCreate]);

  useEffect(() => { rtc.listenTo(owner?.id ?? null); }, [owner?.id, rtc]);

  const other = useMemo<Conversation | null>(() => {
    if (!owner || !UUID_RE.test(owner.id)) return null;
    return {
      conversation_id: conversationId,
      other_id: owner.id,
      last: "",
      time: new Date().toISOString(),
      full_name: owner.full_name,
      avatar_url: owner.avatar_url,
      profession: owner.profession,
      unread: 0,
    };
  }, [owner, conversationId]);

  const kind = pinKindFor(owner?.account_type, owner?.org_type);
  const pins = useGeocodedPins(
    request?.location ? [{ id: request.id, location: request.location, label: request.title, kind }] : [],
  );

  const Icon = request ? (CATEGORY_ICONS[request.category] ?? Heart) : Heart;
  const isOwn = !!me && !!request && me === request.requester_id;
  const online = presence.isOnline(owner?.id);
  const username = owner?.full_name ? "@" + owner.full_name.toLowerCase().replace(/\s+/g, "") : "@user";

  if (notFound) {
    return (
      <div className="rounded-3xl bg-card border border-border p-10 text-center space-y-3">
        <AlertTriangle className="h-8 w-8 mx-auto text-destructive" />
        <h1 className="text-xl font-semibold">Request not found</h1>
        <p className="text-sm text-muted-foreground">It may have been removed or fulfilled.</p>
        <Link to="/requests"><Button variant="outline">Back to requests</Button></Link>
      </div>
    );
  }

  return (
    <div className="pb-24 lg:pb-6 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/requests" })}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        <h1 className="text-lg font-bold text-primary">Request Details</h1>
      </div>

      {request && isOwn && (
        <RecommendedHelpers
          requestId={request.id}
          requesterId={request.requester_id}
          currentUserId={me}
        />
      )}

      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">

        {/* Request info */}
        <motion.section
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-card border border-border p-6 shadow-soft space-y-5"
        >
          {loading || !request ? (
            <div className="space-y-3">
              <Skeleton className="h-11 w-11 rounded-xl" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-accent grid place-items-center text-primary">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">
                      {request.category?.replace("_", " ")}
                    </div>
                    <h2 className="text-2xl font-bold leading-tight">{request.title}</h2>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <Badge className={URGENCY_STYLE[request.urgency] + " border-0"}>
                    {request.urgency === "emergency" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {request.urgency}
                  </Badge>
                  <Badge variant="outline" className="capitalize">{request.status}</Badge>
                </div>
              </div>

              <p className="text-sm leading-relaxed whitespace-pre-wrap">{request.description}</p>

              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl border border-border p-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{request.location || "Anywhere"}</span>
                </div>
                <div className="rounded-2xl border border-border p-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary shrink-0" />
                  <span>Posted {new Date(request.created_at).toLocaleString()}</span>
                </div>
                {request.deadline && (
                  <div className="rounded-2xl border border-border p-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span>Needed by {new Date(request.deadline).toLocaleDateString()}</span>
                  </div>
                )}
                {typeof request.budget === "number" && request.budget > 0 && (
                  <div className="rounded-2xl border border-border p-3 flex items-center gap-2">
                    <Gift className="h-4 w-4 text-emerald-500 shrink-0" />
                    <span>Budget ₹{request.budget}</span>
                  </div>
                )}
              </div>

              {imgUrl && (
                <a href={imgUrl} target="_blank" rel="noreferrer" className="block">
                  <img src={imgUrl} alt={request.title} className="w-full rounded-2xl object-cover max-h-[420px]" />
                </a>
              )}

              {request.location && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <h3 className="text-sm font-semibold">Location</h3>
                  </div>
                  {pins?.length ? (
                    <LeafletMap pins={pins} height={220} />
                  ) : (
                    <div className="h-[220px] rounded-2xl border border-border bg-muted grid place-items-center text-xs text-muted-foreground animate-pulse">
                      Locating…
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.section>

        {/* Owner profile + chat */}
        <aside className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-card border border-border p-5 shadow-soft"
          >
            {loading || !owner ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Link
                    to="/profile/$userId" params={{ userId: owner.id }}
                    className="relative h-16 w-16 rounded-full bg-primary grid place-items-center text-primary-foreground text-xl font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/60 transition"
                  >
                    {owner.avatar_url
                      ? <img src={owner.avatar_url} alt="" className="h-full w-full object-cover" />
                      : (owner.full_name || "U").charAt(0).toUpperCase()}
                    {online && (
                      <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-background" />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-semibold truncate">{owner.full_name || "User"}</span>
                      {owner.verified && <VerifiedBadge tier={owner.premium_tier} />}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{username}</div>
                    <div className={"text-[11px] mt-0.5 flex items-center gap-1 " + (online ? "text-emerald-500" : "text-muted-foreground")}>
                      <span className={"h-1.5 w-1.5 rounded-full " + (online ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/50")} />
                      {online ? "Online" : relativeSeen(owner.last_seen_at)}
                    </div>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                  <Stat icon={<Award className="h-3.5 w-3.5" />} label="Karma" value={owner.karma_points ?? 0} />
                  <Stat icon={<UserRound className="h-3.5 w-3.5" />} label="Followers" value={followers} />
                  <Stat icon={<ShieldCheck className="h-3.5 w-3.5" />} label="Following" value={following} />
                  <Stat icon={<Star className="h-3.5 w-3.5" />} label="Reviews" value={reviews} />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <Link to="/profile/$userId" params={{ userId: owner.id }} className="col-span-2">
                    <Button variant="outline" className="w-full">View Full Profile</Button>
                  </Link>
                  <Button
                    onClick={() => rtc.startCall(owner.id).catch((e) => toast.error(e instanceof Error ? e.message : "Call failed"))}
                    disabled={isOwn}
                    className="bg-primary text-primary-foreground shadow-sm"
                    size="sm"
                  >
                    <PhoneCall className="h-4 w-4 mr-1" /> Call
                  </Button>
                  {phone ? (
                    <Button asChild variant="outline" size="sm" className="border-border text-foreground hover:bg-accent">
                      <a href={`tel:${phone}`}><Phone className="h-4 w-4 mr-1" /> {phone}</a>
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled title="Phone hidden by privacy settings">
                      <Phone className="h-4 w-4 mr-1" /> Private
                    </Button>
                  )}
                </div>
              </>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl bg-card border border-border shadow-soft overflow-hidden h-[560px] flex flex-col"
          >
            {isOwn ? (
              <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-6 text-center">
                <div>
                  <Heart className="h-8 w-8 mx-auto mb-2 text-primary/60" />
                  This is your request. Helpers who reach out will appear in your Messages.
                </div>
              </div>
            ) : !me || !other || !chatReady ? (
              <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-6 text-center">
                <div className="space-y-2">
                  <Loader2 className="h-6 w-6 mx-auto text-primary animate-spin" />
                  <p>Opening chat…</p>
                </div>
              </div>
            ) : (
              <Thread
                me={me}
                other={other}
                onBack={() => navigate({ to: "/requests" })}
                onStartCall={() => rtc.startCall(other.other_id)}
                isPeerOnline={online}
              />
            )}
          </motion.div>
        </aside>
      </div>

      <CallOverlay
        status={rtc.status}
        peerName={owner?.full_name ?? null}
        peerAvatar={owner?.avatar_url ?? null}
        muted={rtc.muted}
        onAccept={() => rtc.acceptCall().catch((e) => toast.error(e instanceof Error ? e.message : "Mic denied"))}
        onDecline={rtc.declineCall}
        onHangup={rtc.hangup}
        onToggleMute={rtc.toggleMute}
      />
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-2">
      <div className="flex items-center justify-center text-primary">{icon}</div>
      <div className="text-sm font-bold mt-0.5">{value}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

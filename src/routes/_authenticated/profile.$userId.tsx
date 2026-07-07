import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Award, ShieldCheck, EyeOff, MessageCircle, Phone, Lock, Loader2, ArrowLeft, MapPin, Check, X, UserPlus, UserCheck,
} from "lucide-react";
import { useFollow } from "@/hooks/use-follow";

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
        .select("id, full_name, avatar_url, bio, location, karma_points, verified, incognito, premium_tier, skills, languages")
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

  if (loading) return <div className="glass rounded-3xl h-96 animate-pulse" />;
  if (!profile) return (
    <div className="glass rounded-3xl p-12 text-center">
      <p className="text-muted-foreground">Profile not found.</p>
      <Link to="/requests"><Button variant="ghost" className="mt-3"><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button></Link>
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
          <Button onClick={startChat} disabled={messaging} className="bg-gradient-brand text-primary-foreground border-0 shadow-glow">
            {messaging ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1" />}
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
    </div>
  );
}

function FollowBlock({ targetId }: { targetId: string }) {
  const { following, followers, followingCount, busy, toggle, isMe, loading } = useFollow(targetId);
  return (
    <div className="glass rounded-3xl p-5 shadow-soft flex flex-wrap items-center justify-between gap-3">
      <div className="flex gap-6 text-sm">
        <div><span className="font-bold text-base">{followers}</span> <span className="text-muted-foreground">Followers</span></div>
        <div><span className="font-bold text-base">{followingCount}</span> <span className="text-muted-foreground">Following</span></div>
      </div>
      {!isMe && (
        <Button
          onClick={toggle}
          disabled={busy || loading}
          className={following
            ? "bg-card border border-amber-400/60 text-foreground hover:bg-amber-500/10"
            : "bg-gradient-brand text-primary-foreground border-0 shadow-glow"}
        >
          {following ? <UserCheck className="h-4 w-4 mr-1" /> : <UserPlus className="h-4 w-4 mr-1" />}
          {following ? "Following" : "Follow"}
        </Button>
      )}
    </div>
  );
}

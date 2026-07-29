import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Handshake, MessageCircle, Loader2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { displayIdentity } from "@/lib/identity";
import { toast } from "sonner";

type Seeker = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
  location: string | null;
  incognito: boolean | null;
  premium_tier: string | null;
  verified: boolean | null;
  cofounder_pitch: string | null;
  skills: string[] | null;
};

export function CoFounderCarousel() {
  const navigate = useNavigate();
  const [me, setMe] = useState<string | null>(null);
  const [rows, setRows] = useState<Seeker[] | null>(null);
  const [pitching, setPitching] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      setMe(u?.user?.id ?? null);
      const { data } = await supabase
        .from("profiles")
        .select(
          "id, full_name, avatar_url, profession, location, incognito, premium_tier, verified, cofounder_pitch, skills" as never,
        )
        .eq("seeking_cofounder" as never, true as never)
        .order("karma_points", { ascending: false })
        .limit(20);
      setRows(((data as unknown as Seeker[]) ?? []).filter((r) => r?.id));
    })();
  }, []);

  const pitch = async (target: Seeker) => {
    if (!me) {
      navigate({ to: "/auth" });
      return;
    }
    if (target.id === me) {
      navigate({ to: "/messages" });
      return;
    }
    console.info("[HumanLink messaging] (1) Message button clicked", { selectedUserId: target.id, source: "CoFounderCarousel" });
    setPitching(target.id);
    const { error } = await supabase.from("messages").insert({
      sender_id: me,
      receiver_id: target.id,
      content: "Hi! I saw your co-founder pitch on HumanLink — would love to connect.",
    });
    setPitching(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    navigate({ to: "/messages", search: { userId: target.id } as never });
  };

  return (
    <section className="mx-auto max-w-6xl px-6 pb-16">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-card border border-border px-3 py-1 text-[11px] font-medium text-muted-foreground">
            <Handshake className="h-3.5 w-3.5 text-primary" /> Community
          </div>
          <h2 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            🤝 Find a <span className="bg-primary bg-clip-text text-transparent">Co-Founder</span>
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Real members who've flagged themselves as open to building together.
          </p>
        </div>
      </div>

      {rows === null ? (
        <div className="flex gap-4 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="min-w-[260px] h-56 rounded-3xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-10 text-center">
          <p className="text-muted-foreground">
            No one is publicly seeking a co-founder yet. Turn on the flag from your profile to appear here.
          </p>
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-3 snap-x snap-mandatory scrollbar-thin">
          {rows.map((r, i) => {
            const id = displayIdentity(r, me);
            return (
              <motion.article
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="snap-start shrink-0 w-[280px] rounded-3xl p-5 shadow-pop flex flex-col gap-3 bg-[#000] border border-amber-400/40 text-white"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12 ring-2 ring-amber-400/60">
                    {id.avatar_url && <AvatarImage src={id.avatar_url} />}
                    <AvatarFallback className="bg-primary/20 text-white">{id.initial}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 font-semibold truncate">
                      <span className="truncate">{id.name}</span>
                      {r?.verified && !id.isIncognito && <VerifiedBadge tier={r?.premium_tier} className="h-4 w-4" />}
                    </div>
                    <div className="text-[11px] text-white/70 truncate">
                      {r?.profession || "Member"}
                    </div>
                  </div>
                </div>

                {r?.location && !id.isIncognito && (
                  <div className="inline-flex items-center gap-1 text-[11px] text-white/60">
                    <MapPin className="h-3 w-3" /> {r.location}
                  </div>
                )}

                <p className="text-xs text-white/80 line-clamp-3 min-h-[48px]">
                  {r?.cofounder_pitch?.trim() || "Open to collaborating on meaningful, human-first projects."}
                </p>

                {r?.skills?.length ? (
                  <div className="flex flex-wrap gap-1">
                    {r.skills.slice(0, 3).map((s) => (
                      <Badge key={s} variant="outline" className="border-amber-400/40 text-amber-200 text-[10px]">
                        {s}
                      </Badge>
                    ))}
                  </div>
                ) : null}

                <div className="mt-auto flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => pitch(r)}
                    disabled={pitching === r.id}
                    className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground border-0"
                  >
                    {pitching === r.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <><MessageCircle className="h-3.5 w-3.5 mr-1" /> Pitch</>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate({ to: "/profile/$userId", params: { userId: r.id } })}
                    className="border-amber-400/50 text-amber-200 hover:bg-amber-400/10 bg-transparent"
                  >
                    View
                  </Button>
                </div>
              </motion.article>
            );
          })}
        </div>
      )}
    </section>
  );
}

import { Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { MapPin, Award, ShieldCheck, HeartHandshake, MessageCircle, UserPlus, UserCheck, Loader2, Briefcase } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFollow } from "@/hooks/use-follow";
import { displayIdentity } from "@/lib/identity";
import { ReportBlockMenu } from "@/components/site/ReportBlockMenu";
import { cn } from "@/lib/utils";


export type UserCardData = {
  id: string;
  full_name: string | null;
  username?: string | null;
  avatar_url: string | null;
  profession: string | null;
  location?: string | null;
  bio?: string | null;
  skills?: string[] | null;
  verified?: boolean | null;
  karma_points?: number | null;
  incognito?: boolean | null;
  premium_tier?: string | null;
  account_type?: string | null;
  org_type?: string | null;
};

export function UserCard({
  user,
  me,
  online,
  compact = false,
}: {
  user: UserCardData;
  me: string | null;
  online?: boolean;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const { following, toggle, busy, isMe } = useFollow(user.id);
  const id = displayIdentity(user, me);
  const isNgo = user.org_type && String(user.org_type).toLowerCase().includes("ngo");
  const isBusiness = user.account_type === "business";
  const isPro = user.premium_tier === "pro" || user.premium_tier === "plus";

  const message = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.info("[HumanLink messaging] (1) Message button clicked", { selectedUserId: user.id, source: "UserCard" });
    navigate({ to: "/messages", search: { userId: user.id } as never });
  };

  const doFollow = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle();
  };

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Link
        to="/profile/$userId"
        params={{ userId: user.id }}
        className={cn(
          "block rounded-3xl border bg-card hover:shadow-pop hover:-translate-y-0.5 transition-all h-full",
          isNgo
            ? "border-emerald-500/40 shadow-[0_0_20px_-8px_rgba(16,185,129,0.6)]"
            : isBusiness
              ? "border-amber-400/40"
              : "border-border",
          compact ? "p-3" : "p-5",
        )}
      >
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className={cn(
              compact ? "h-11 w-11" : "h-14 w-14",
              isBusiness ? "ring-2 ring-amber-400/50" : isNgo ? "ring-2 ring-emerald-400/70" : "ring-2 ring-primary/20",
            )}>
              {id.avatar_url && <AvatarImage src={id.avatar_url} />}
              <AvatarFallback className={compact ? "text-sm" : "text-lg"}>{id.initial}</AvatarFallback>
            </Avatar>
            {online && (
              <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-background shadow-[0_0_8px_rgba(16,185,129,0.9)]" aria-label="Online" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold truncate flex items-center gap-1">
              <span className="truncate">{id.name}</span>
              {isNgo && <HeartHandshake className="h-3.5 w-3.5 text-emerald-400 shrink-0" />}
              {isPro && !isNgo && <ShieldCheck className="h-3.5 w-3.5 text-amber-400 shrink-0" />}
              {user.verified && !isPro && !isNgo && <ShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {user.profession || (isBusiness ? "Business" : isNgo ? "NGO" : "Member")}
              {user.username ? ` · @${user.username}` : ""}
            </div>
          </div>
          {!isMe && (
            <div onClick={(e) => e.preventDefault()}>
              <ReportBlockMenu targetUserId={user.id} targetName={id.name} />
            </div>
          )}
        </div>


        {!compact && user.bio && (
          <p className="mt-3 text-xs text-muted-foreground line-clamp-2">{user.bio}</p>
        )}

        {!compact && user.location && (
          <div className="mt-3 text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {user.location}
          </div>
        )}

        {!compact && user.skills?.length ? (
          <div className="mt-3 flex flex-wrap gap-1">
            {user.skills.slice(0, 4).map((s) => (
              <Badge key={s} variant="outline" className="text-[10px] font-normal">{s}</Badge>
            ))}
            {user.skills.length > 4 && (
              <Badge variant="outline" className="text-[10px] font-normal">+{user.skills.length - 4}</Badge>
            )}
          </div>
        ) : null}

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Award className="h-3 w-3 text-amber-500" />
            {user.karma_points ?? 0} karma
          </div>
          {!isMe && (
            <div className="flex items-center gap-1.5">
              <Button
                size="sm"
                variant={following ? "outline" : "default"}
                onClick={doFollow}
                disabled={busy}
                className={cn(
                  "h-8 rounded-full px-3 text-xs",
                  !following && "bg-primary text-primary-foreground hover:bg-primary/90",
                )}
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> :
                  following ? <><UserCheck className="h-3 w-3 mr-1" /> Following</> :
                  <><UserPlus className="h-3 w-3 mr-1" /> Follow</>}
              </Button>
              <Button
                size="sm"
                onClick={message}
                className="h-8 rounded-full px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground border-0"
              >
                <MessageCircle className="h-3 w-3 mr-1" /> Message
              </Button>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

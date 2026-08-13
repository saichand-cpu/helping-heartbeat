import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2, MoreHorizontal, Trash2, MapPin, EyeOff, CheckCircle2,
  HandHeart, ChevronLeft, ChevronRight, Megaphone, Users, Flag, Pin, Sparkles,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { BookmarkButton } from "@/components/site/BookmarkButton";
import { CommentsPanel } from "@/components/social/CommentsPanel";
import { displayIdentity } from "@/lib/identity";
import { mediaUrl, timeAgo, POST_TYPE_META, type FeedPost } from "@/lib/social";
import { toast } from "sonner";

export function PostCard({
  post, me, onLike, onShare, onDelete, onUpdate, isAdmin = false, canModerate = false,
}: {
  post: FeedPost;
  me: string | null;
  onLike: () => void;
  onShare: () => void;
  onDelete: () => void;
  onUpdate?: (patch: Partial<FeedPost>) => void;
  isAdmin?: boolean;
  canModerate?: boolean;
}) {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [burst, setBurst] = useState(false);
  const [comments, setComments] = useState(false);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const lastTap = useRef(0);
  const isOwner = me === post.author_id;
  const meta = POST_TYPE_META[post.post_type];
  const identity = displayIdentity({ ...post.author, id: post.author_id }, me);
  const isHelp = post.post_type === "help_request" || post.post_type === "emergency";

  useEffect(() => {
    let alive = true;
    void Promise.all(post.media.map((m) => mediaUrl(m))).then((u) => { if (alive) setUrls(u); });
    return () => { alive = false; };
  }, [post.media]);

  const doubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      if (!post.liked_by_me) onLike();
      setBurst(true);
      setTimeout(() => setBurst(false), 700);
    }
    lastTap.current = now;
  };

  const offerHelp = async () => {
    if (!me) return;
    if (post.author_id === me) return toast("This is your own request");
    window.location.href = `/messages?userId=${post.author_id}`;
  };

  const toggleResolved = async () => {
    const { error } = await supabase.from("posts").update({ resolved: !post.resolved }).eq("id", post.id);
    if (error) return toast.error(error.message);
    onUpdate?.({ resolved: !post.resolved });
    toast.success(!post.resolved ? "Marked as help completed 💙" : "Reopened");
  };

  const togglePin = async () => {
    const { error } = await supabase.from("posts").update({ pinned: !post.pinned }).eq("id", post.id);
    if (error) return toast.error(error.message);
    onUpdate?.({ pinned: !post.pinned });
  };

  return (
    <motion.article
      id={post.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`rounded-2xl border bg-card shadow-soft overflow-hidden ${
        post.post_type === "emergency" ? "border-destructive/40" : "border-border"
      }`}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-4 pb-3">
        {identity.isIncognito || isOwner ? (
          <Avatar identity={identity} />
        ) : (
          <Link to="/profile/$userId" params={{ userId: post.author_id }}><Avatar identity={identity} /></Link>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-sm font-semibold truncate">
            {identity.isIncognito || isOwner ? (
              <span>{isOwner ? "You" : identity.name}</span>
            ) : (
              <Link to="/profile/$userId" params={{ userId: post.author_id }} className="hover:underline truncate">
                {identity.name}
              </Link>
            )}
            {identity.premium_tier && <VerifiedBadge tier={identity.premium_tier} className="h-4 w-4" />}
            {post.author?.karma_points ? (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-amber-600 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                <Sparkles className="h-2.5 w-2.5" /> {post.author.karma_points}
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
            <span>{timeAgo(post.created_at)}</span>
            {post.group && (
              <>
                <span>·</span>
                <Link to="/groups/$groupId" params={{ groupId: post.group.id }} className="inline-flex items-center gap-1 hover:text-foreground truncate">
                  <Users className="h-3 w-3" /> {post.group.name}
                </Link>
              </>
            )}
            {post.location && (
              <>
                <span>·</span>
                <span className="inline-flex items-center gap-0.5 truncate"><MapPin className="h-3 w-3" /> {post.location}</span>
              </>
            )}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger className="text-muted-foreground hover:text-foreground p-1" aria-label="Post menu">
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onShare}><Share2 className="h-3.5 w-3.5 mr-2" /> Share</DropdownMenuItem>
            {(canModerate || isAdmin) && (
              <DropdownMenuItem onClick={() => void togglePin()}>
                <Pin className="h-3.5 w-3.5 mr-2" /> {post.pinned ? "Unpin" : "Pin post"}
              </DropdownMenuItem>
            )}
            {isHelp && isOwner && (
              <DropdownMenuItem onClick={() => void toggleResolved()}>
                <CheckCircle2 className="h-3.5 w-3.5 mr-2" /> {post.resolved ? "Reopen request" : "Mark resolved"}
              </DropdownMenuItem>
            )}
            {!isOwner && (
              <DropdownMenuItem onClick={() => { window.location.href = "/report-and-grievance"; }}>
                <Flag className="h-3.5 w-3.5 mr-2" /> Report
              </DropdownMenuItem>
            )}
            {(isOwner || isAdmin || canModerate) && (
              <DropdownMenuItem className="text-destructive" onClick={onDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Badges */}
      {(meta || post.is_announcement || post.resolved) && (
        <div className="px-4 pb-2 flex flex-wrap items-center gap-1.5">
          {post.is_announcement && (
            <span className="inline-flex items-center gap-1 rounded border border-primary/25 bg-primary/10 text-primary px-2 py-0.5 text-[11px] font-semibold">
              <Megaphone className="h-3 w-3" /> Official
            </span>
          )}
          {meta && (
            <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}>
              {meta.label}
            </span>
          )}
          {post.resolved && (
            <span className="inline-flex items-center gap-1 rounded border border-emerald-500/25 bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[11px] font-semibold">
              <CheckCircle2 className="h-3 w-3" /> Help completed
            </span>
          )}
        </div>
      )}

      {/* Body */}
      {post.body && (
        <p className="px-4 pb-3 text-sm leading-relaxed whitespace-pre-wrap break-words">
          {post.body.split(/(\s+)/).map((tok, i) =>
            tok.startsWith("#") ? <span key={i} className="text-primary">{tok}</span> : tok,
          )}
        </p>
      )}

      {/* Poll */}
      {post.poll && <PollBlock post={post} me={me} />}

      {/* Media carousel */}
      {urls.length > 0 && (
        <div className="relative bg-black/[0.03] dark:bg-white/[0.03]" onClick={doubleTap}>
          {post.media[idx]?.kind === "video" ? (
            <video src={urls[idx] ?? undefined} controls playsInline preload="metadata" className="w-full max-h-[560px] object-contain" />
          ) : (
            <img src={urls[idx] ?? undefined} alt="" loading="lazy" className="w-full max-h-[560px] object-cover" />
          )}
          {urls.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)); }}
                disabled={idx === 0}
                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center disabled:opacity-0"
              ><ChevronLeft className="h-4 w-4" /></button>
              <button
                onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(urls.length - 1, i + 1)); }}
                disabled={idx === urls.length - 1}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center disabled:opacity-0"
              ><ChevronRight className="h-4 w-4" /></button>
              <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                {urls.map((_, i) => (
                  <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === idx ? "bg-primary" : "bg-foreground/25"}`} />
                ))}
              </div>
            </>
          )}
          <AnimatePresence>
            {burst && (
              <motion.div
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 1.4, opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="h-24 w-24 text-white fill-red-500 drop-shadow-lg" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1 px-2 py-2">
        <Button variant="ghost" size="sm" onClick={onLike} className={post.liked_by_me ? "text-red-500" : "text-muted-foreground"}>
          <motion.span whileTap={{ scale: 1.35 }} className="mr-1 inline-flex">
            <Heart className={`h-[18px] w-[18px] ${post.liked_by_me ? "fill-current" : ""}`} />
          </motion.span>
          {post.like_count || ""}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setComments(true)} className="text-muted-foreground">
          <MessageCircle className="h-[18px] w-[18px] mr-1" /> {commentCount || ""}
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare} className="text-muted-foreground">
          <Share2 className="h-[18px] w-[18px]" />
        </Button>
        <div className="ml-auto flex items-center gap-1">
          {isHelp && !post.resolved && !isOwner && (
            <Button size="sm" onClick={() => void offerHelp()} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <HandHeart className="h-4 w-4 mr-1.5" /> I can help
            </Button>
          )}
          <BookmarkButton postId={post.id} />
        </div>
      </div>

      <CommentsPanel
        postId={post.id}
        postAuthorId={post.author_id}
        me={me}
        open={comments}
        onOpenChange={setComments}
        onCountChange={setCommentCount}
      />
    </motion.article>
  );
}

function Avatar({ identity }: { identity: ReturnType<typeof displayIdentity> }) {
  return (
    <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
      {identity.isIncognito ? <EyeOff className="h-4 w-4" />
        : identity.avatar_url ? <img src={identity.avatar_url} alt="" className="h-full w-full object-cover" />
        : identity.initial}
    </div>
  );
}

function PollBlock({ post, me }: { post: FeedPost; me: string | null }) {
  const [votes, setVotes] = useState<{ user_id: string; option_index: number }[]>([]);
  const options = post.poll?.options ?? [];

  const load = async () => {
    const { data } = await supabase.from("poll_votes").select("user_id, option_index").eq("post_id", post.id);
    setVotes(data ?? []);
  };
  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [post.id]);

  const mine = votes.find((v) => v.user_id === me)?.option_index;
  const total = votes.length || 0;

  const vote = async (i: number) => {
    if (!me) return;
    const { error } = await supabase.from("poll_votes").upsert(
      { post_id: post.id, user_id: me, option_index: i },
      { onConflict: "post_id,user_id" },
    );
    if (error) return toast.error(error.message);
    void load();
  };

  return (
    <div className="px-4 pb-3 space-y-2">
      {post.poll?.question && <p className="text-sm font-medium">{post.poll.question}</p>}
      {options.map((opt, i) => {
        const count = votes.filter((v) => v.option_index === i).length;
        const pct = total ? Math.round((count / total) * 100) : 0;
        const chosen = mine === i;
        return (
          <button
            key={i}
            onClick={() => void vote(i)}
            className={`relative w-full text-left rounded-xl border px-3 py-2.5 text-sm overflow-hidden transition ${
              chosen ? "border-primary" : "border-border hover:border-primary/40"
            }`}
          >
            {mine !== undefined && (
              <motion.span
                initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                className="absolute inset-y-0 left-0 bg-primary/10"
              />
            )}
            <span className="relative flex items-center justify-between gap-2">
              <span>{opt}</span>
              {mine !== undefined && <span className="text-xs text-muted-foreground">{pct}%</span>}
            </span>
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">{total} {total === 1 ? "vote" : "votes"}</p>
    </div>
  );
}

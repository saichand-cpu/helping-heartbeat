import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { VerifiedBadge } from "@/components/site/VerifiedBadge";
import { MediaPicker } from "@/components/site/MediaPicker";
import { ShareSheet } from "@/components/site/ShareSheet";
import { StoriesBar } from "@/components/site/StoriesBar";
import { toast } from "sonner";
import {
  Heart, MessageCircle, Share2, Send, Sparkles, Megaphone, Loader2, Wand2, EyeOff, Trash2,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { writeCaption } from "@/lib/ai.functions";
import { displayIdentity } from "@/lib/identity";
import { resolveMediaUrl, type UploadedMedia } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

type Post = {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  is_announcement: boolean;
  created_at: string;
  author?: { id?: string; full_name: string; avatar_url: string | null; premium_tier: string | null; incognito?: boolean };
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

type Ad = {
  id: string;
  title: string;
  description: string;
  destination_url: string;
  image_url: string | null;
};

const PAGE = 8;

function FeedPage() {
  const { isAdmin } = useIsAdmin();
  const [me, setMe] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Composer
  const [body, setBody] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [announce, setAnnounce] = useState(false);
  const [improving, setImproving] = useState(false);
  const captionFn = useServerFn(writeCaption);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    supabase.from("advertisements").select("*").eq("active", true).then(({ data }) => setAds((data ?? []) as Ad[]));
  }, []);

  const fetchPage = useCallback(async () => {
    if (done) return;
    setLoading(true);
    let q = supabase
      .from("posts")
      .select("id, author_id, body, image_url, is_announcement, created_at")
      .order("is_announcement", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(PAGE);
    if (cursorRef.current) q = q.lt("created_at", cursorRef.current);
    const { data: rows } = await q;
    if (!rows || rows.length === 0) {
      setDone(true);
      setLoading(false);
      return;
    }

    const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
    const postIds = rows.map((r) => r.id);
    const [{ data: authors }, { data: likes }, { data: comments }, { data: myLikes }] = await Promise.all([
      supabase.from("profiles").select("id, full_name, avatar_url, premium_tier, incognito").in("id", authorIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
      supabase.from("post_comments").select("post_id").in("post_id", postIds),
      me ? supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", me) : Promise.resolve({ data: [] as any[] }),
    ]);

    const authorMap = new Map((authors ?? []).map((a: any) => [a.id, a]));
    const likeCount: Record<string, number> = {};
    for (const l of likes ?? []) likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1;
    const commentCount: Record<string, number> = {};
    for (const c of comments ?? []) commentCount[c.post_id] = (commentCount[c.post_id] ?? 0) + 1;
    const mine = new Set((myLikes ?? []).map((l: any) => l.post_id));

    const enriched: Post[] = rows.map((r) => ({
      ...r,
      author: authorMap.get(r.author_id),
      like_count: likeCount[r.id] ?? 0,
      comment_count: commentCount[r.id] ?? 0,
      liked_by_me: mine.has(r.id),
    }));

    setPosts((prev) => [...prev, ...enriched]);
    cursorRef.current = rows[rows.length - 1].created_at;
    if (rows.length < PAGE) setDone(true);
    setLoading(false);
  }, [done, me]);

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading) fetchPage();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, loading]);

  const createPost = async () => {
    if (!body.trim() || !me) return;
    const { data, error } = await supabase
      .from("posts")
      .insert({
        author_id: me,
        body: body.trim(),
        image_url: imageUrl.trim() || null,
        is_announcement: !!(isAdmin && announce),
      })
      .select()
      .single();
    if (error) return toast.error(error.message);
    const { data: prof } = await supabase.from("profiles").select("id, full_name, avatar_url, premium_tier, incognito").eq("id", me).maybeSingle();
    setPosts((prev) => [
      { ...(data as any), author: prof as any, like_count: 0, comment_count: 0, liked_by_me: false },
      ...prev,
    ]);
    setBody("");
    setImageUrl("");
    setAnnounce(false);
    toast.success("Posted");
  };

  const toggleLike = async (post: Post) => {
    if (!me) return;
    const liked = post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: !liked, like_count: p.like_count + (liked ? -1 : 1) } : p,
      ),
    );
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: me });
    }
  };

  const share = async (post: Post) => {
    const url = `${window.location.origin}/feed#${post.id}`;
    if (navigator.share) {
      try { await navigator.share({ title: "HumanLink", text: post.body.slice(0, 80), url }); return; } catch { /* */ }
    }
    await navigator.clipboard.writeText(url);
    toast.success("Link copied");
  };

  const writeWithHumi = async () => {
    setImproving(true);
    try {
      const { caption } = await captionFn({ data: { draft: body, tone: "warm" } });
      if (caption) setBody(caption);
      toast.success("HUMI polished your draft");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not reach HUMI");
    } finally {
      setImproving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24 lg:pb-6 max-w-2xl mx-auto w-full">
      <header>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="h-4 w-4 text-primary" /> Community feed
        </div>
        <h1 className="text-3xl font-bold mt-1">What's happening</h1>
      </header>

      {/* Composer */}
      <div className="glass rounded-3xl p-4 md:p-5 shadow-soft space-y-3">
        <Textarea
          placeholder="Share an update, a story, or a thank you..."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <div className="flex items-center gap-2">
          <ImageIcon className="h-4 w-4 text-muted-foreground" />
          <Input placeholder="Image URL (optional)" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="text-sm" />
        </div>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <label className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                <Switch checked={announce} onCheckedChange={setAnnounce} />
                <Megaphone className="h-3.5 w-3.5" /> Official
              </label>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={writeWithHumi}
              disabled={improving}
              className="border-primary/40 text-primary hover:bg-primary/5"
            >
              {improving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Wand2 className="h-3.5 w-3.5 mr-1" />}
              Write with HUMI
            </Button>
          </div>
          <Button
            onClick={createPost}
            disabled={!body.trim()}
            className="bg-gradient-brand text-primary-foreground border-0 shadow-glow"
            size="sm"
          >
            <Send className="h-3.5 w-3.5 mr-1" /> Post
          </Button>
        </div>
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {posts.map((p, i) => (
          <div key={p.id}>
            <PostCard
              post={p}
              me={me}
              onLike={() => toggleLike(p)}
              onShare={() => share(p)}
              onDelete={async () => {
                if (!confirm("Delete this post?")) return;
                const { error } = await supabase.from("posts").delete().eq("id", p.id);
                if (error) return toast.error(error.message);
                setPosts((prev) => prev.filter((x) => x.id !== p.id));
                toast.success("Post deleted");
              }}
            />
            {ads.length > 0 && (i + 1) % 6 === 0 && (
              <div className="mt-4">
                <AdCard ad={ads[Math.floor(i / 6) % ads.length]} />
              </div>
            )}
          </div>
        ))}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}
          </div>
        )}
        {!loading && posts.length === 0 && (
          <div className="glass rounded-3xl p-12 text-center shadow-soft">
            <p className="text-muted-foreground">No posts yet. Be the first to share something kind.</p>
          </div>
        )}
        <div ref={sentinelRef} className="h-8" />
      </div>
    </div>
  );
}

function PostCard({
  post, me, onLike, onShare, onDelete,
}: {
  post: Post;
  me: string | null;
  onLike: () => void;
  onShare: () => void;
  onDelete: () => void;
}) {
  const [showComments, setShowComments] = useState(false);
  const isOwner = me === post.author_id;

  const announcementClass = post.is_announcement
    ? "ring-2 ring-amber-400/70 shadow-[0_0_24px_-4px_rgba(245,158,11,0.6)] bg-gradient-to-br from-primary/[0.04] via-card to-amber-500/[0.04]"
    : "bg-card";

  return (
    <motion.article
      id={post.id}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-3xl border border-border p-5 shadow-soft ${announcementClass}`}
    >
      {post.is_announcement && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r from-primary to-amber-500 text-white text-[11px] font-bold uppercase tracking-wide mb-3">
          <Megaphone className="h-3 w-3" /> Official Announcement
        </div>
      )}
      {(() => {
        const id = displayIdentity({ ...post.author, id: post.author_id }, me);
        const clickable = !id.isIncognito && post.author_id !== me;
        const Header = (
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold overflow-hidden">
              {id.isIncognito ? (
                <EyeOff className="h-4 w-4" />
              ) : id.avatar_url ? (
                <img src={id.avatar_url} alt="" className="h-full w-full object-cover rounded-full" />
              ) : (
                id.initial
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm flex items-center gap-1 truncate">
                {id.name}
                {id.premium_tier && <VerifiedBadge tier={id.premium_tier} />}
                {id.isIncognito && <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">incognito</span>}
              </div>
              <div className="text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>
        );
        return clickable ? (
          <Link to="/profile/$userId" params={{ userId: post.author_id }} className="block hover:opacity-90">{Header}</Link>
        ) : Header;
      })()}
      <p className="whitespace-pre-wrap text-sm leading-relaxed">{post.body}</p>
      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-3 w-full rounded-2xl border border-border max-h-[480px] object-cover" />
      )}
      <div className="mt-4 flex items-center gap-1 text-sm">
        <Button variant="ghost" size="sm" onClick={onLike} className={post.liked_by_me ? "text-red-500" : "text-muted-foreground"}>
          <Heart className={`h-4 w-4 mr-1 ${post.liked_by_me ? "fill-current" : ""}`} /> {post.like_count}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setShowComments((v) => !v)} className="text-muted-foreground">
          <MessageCircle className="h-4 w-4 mr-1" /> {post.comment_count}
        </Button>
        <Button variant="ghost" size="sm" onClick={onShare} className="text-muted-foreground ml-auto">
          <Share2 className="h-4 w-4" />
        </Button>
        {isOwner && (
          <Button variant="ghost" size="sm" onClick={onDelete} className="text-muted-foreground hover:text-destructive" aria-label="Delete post">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <CommentThread postId={post.id} me={me} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

type Comment = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  author?: { id?: string; full_name: string; avatar_url: string | null; premium_tier: string | null; incognito?: boolean };
};

function CommentThread({ postId, me }: { postId: string; me: string | null }) {
  const [items, setItems] = useState<Comment[]>([]);
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from("post_comments")
        .select("id, author_id, body, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      const ids = Array.from(new Set((rows ?? []).map((r) => r.author_id)));
      const { data: authors } = ids.length
        ? await supabase.from("profiles").select("id, full_name, avatar_url, premium_tier, incognito").in("id", ids)
        : { data: [] as any[] };
      const map = new Map((authors ?? []).map((a: any) => [a.id, a]));
      if (cancelled) return;
      setItems((rows ?? []).map((r) => ({ ...r, author: map.get(r.author_id) })));
      setLoading(false);
    })();

    const ch = supabase
      .channel(`comments:${postId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` },
        async (payload) => {
          const row = payload.new as any;
          const { data: a } = await supabase.from("profiles").select("id, full_name, avatar_url, premium_tier, incognito").eq("id", row.author_id).maybeSingle();
          setItems((prev) => prev.find((c) => c.id === row.id) ? prev : [...prev, { ...row, author: a as any }]);
        })
      .subscribe();

    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [postId]);

  const send = async () => {
    if (!body.trim() || !me) return;
    const text = body.trim();
    setBody("");
    const { error } = await supabase.from("post_comments").insert({ post_id: postId, author_id: me, body: text });
    if (error) toast.error(error.message);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-3">
      {loading ? <Skeleton className="h-12" /> : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">Be the first to comment.</p>
      ) : (
        items.map((c) => {
          const id = displayIdentity({ ...c.author, id: c.author_id }, me);
          return (
            <div key={c.id} className="flex gap-2 text-sm">
              <div className="h-7 w-7 shrink-0 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-xs font-bold">
                {id.isIncognito ? <EyeOff className="h-3 w-3" /> : id.initial}
              </div>
              <div className="flex-1 bg-muted/40 rounded-2xl px-3 py-2">
                <div className="text-xs font-medium flex items-center gap-1">
                  {id.name}
                  {id.premium_tier && <VerifiedBadge tier={id.premium_tier} className="h-3 w-3" />}
                </div>
                <div className="whitespace-pre-wrap">{c.body}</div>
              </div>
            </div>
          );
        })
      )}
      <div className="flex gap-2">
        <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a comment..." />
        <Button size="sm" onClick={send} disabled={!body.trim()} className="bg-gradient-brand text-primary-foreground border-0">
          <Send className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  const ref = useRef<HTMLAnchorElement>(null);
  const loggedRef = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || loggedRef.current) return;
    const obs = new IntersectionObserver(async (entries) => {
      if (entries[0].isIntersecting && !loggedRef.current) {
        loggedRef.current = true;
        obs.disconnect();
        const { data } = await supabase.auth.getUser();
        await supabase.from("ad_events").insert({
          ad_id: ad.id,
          event_type: "impression",
          user_id: data.user?.id ?? null,
        });
      }
    }, { threshold: 0.5 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [ad.id]);

  const onClick = async () => {
    const { data } = await supabase.auth.getUser();
    void supabase.from("ad_events").insert({
      ad_id: ad.id,
      event_type: "click",
      user_id: data.user?.id ?? null,
    });
  };

  return (
    <a
      ref={ref}
      href={ad.destination_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={onClick}
      className="block rounded-3xl border border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-amber-500/5 p-5 hover:shadow-pop transition"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground bg-background/60 px-2 py-0.5 rounded-full">Sponsored</span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <div className="flex gap-3">
        {ad.image_url && <img src={ad.image_url} alt="" className="h-16 w-16 rounded-xl object-cover" />}
        <div className="flex-1 min-w-0">
          <div className="font-semibold">{ad.title}</div>
          <div className="text-sm text-muted-foreground line-clamp-2">{ad.description}</div>
        </div>
      </div>
    </a>
  );
}

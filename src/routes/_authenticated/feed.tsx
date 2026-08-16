import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { MediaPicker } from "@/components/site/MediaPicker";
import { ShareSheet } from "@/components/site/ShareSheet";
import { StoriesBar } from "@/components/site/StoriesBar";
import { PostCard } from "@/components/social/PostCard";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
  Send, Megaphone, Loader2, Wand2, HandHeart, HeartHandshake, Newspaper, ExternalLink, Users,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { writeCaption } from "@/lib/ai.functions";
import { extractHashtags, normalizeMedia, timeAgo, type FeedPost } from "@/lib/social";
import type { UploadedMedia } from "@/lib/upload";

type Search = { compose?: string };

export const Route = createFileRoute("/_authenticated/feed")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    compose: typeof s.compose === "string" ? s.compose : undefined,
  }),
  component: FeedPage,
});

type Ad = {
  id: string;
  title: string;
  description: string;
  destination_url: string;
  image_url: string | null;
};

const PAGE = 8;

const TABS = [
  { key: "for_you", label: "For You" },
  { key: "following", label: "Following" },
  { key: "groups", label: "Groups" },
  { key: "help", label: "Help" },
] as const;
type TabKey = (typeof TABS)[number]["key"];

function FeedPage() {
  const { compose } = Route.useSearch();
  const { isAdmin } = useIsAdmin();
  const [me, setMe] = useState<string | null>(null);
  const [tab, setTab] = useState<TabKey>("for_you");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const cursorRef = useRef<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Composer
  const [body, setBody] = useState("");
  const [media, setMedia] = useState<UploadedMedia | null>(null);
  const [postType, setPostType] = useState<"normal" | "help_request" | "offer_help">(
    compose === "offer_help" ? "offer_help" : "normal",
  );
  const [announce, setAnnounce] = useState(false);
  const [posting, setPosting] = useState(false);
  const [improving, setImproving] = useState(false);
  const [shareFor, setShareFor] = useState<FeedPost | null>(null);
  const captionFn = useServerFn(writeCaption);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
    supabase.from("advertisements").select("*").eq("active", true).then(({ data }) => setAds((data ?? []) as Ad[]));
  }, []);

  const reset = useCallback(() => {
    cursorRef.current = null;
    setPosts([]);
    setDone(false);
    setError(null);
  }, []);

  const fetchPage = useCallback(async () => {
    if (done) return;
    setLoading(true);
    setError(null);
    try {
      let q = supabase
        .from("posts")
        .select(
          "id, author_id, body, image_url, media, post_type, visibility, location, hashtags, poll, event_at, group_id, is_announcement, resolved, pinned, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(PAGE);

      if (cursorRef.current) q = q.lt("created_at", cursorRef.current);

      if (tab === "help") {
        q = q.in("post_type", ["help_request", "offer_help", "emergency"]);
      } else if (tab === "following" && me) {
        const { data: f } = await supabase.from("follows").select("followed_id").eq("follower_id", me);
        const ids = (f ?? []).map((r) => r.followed_id);
        if (ids.length === 0) {
          setPosts([]);
          setDone(true);
          setLoading(false);
          return;
        }
        q = q.in("author_id", ids);
      } else if (tab === "groups" && me) {
        const { data: g } = await supabase
          .from("group_members")
          .select("group_id")
          .eq("user_id", me)
          .eq("status", "active");
        const ids = (g ?? []).map((r) => r.group_id);
        if (ids.length === 0) {
          setPosts([]);
          setDone(true);
          setLoading(false);
          return;
        }
        q = q.in("group_id", ids);
      }

      const { data: rows, error: qErr } = await q;
      if (qErr) throw qErr;
      if (!rows || rows.length === 0) {
        setDone(true);
        setLoading(false);
        return;
      }

      const authorIds = Array.from(new Set(rows.map((r) => r.author_id)));
      const groupIds = Array.from(new Set(rows.map((r) => r.group_id).filter(Boolean))) as string[];
      const postIds = rows.map((r) => r.id);
      const [{ data: authors }, { data: likes }, { data: comments }, { data: myLikes }, { data: groups }] =
        await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, avatar_url, premium_tier, incognito, verified, karma_points, account_type, org_type")
            .in("id", authorIds),
          supabase.from("post_likes").select("post_id").in("post_id", postIds),
          supabase.from("post_comments").select("post_id").in("post_id", postIds),
          me
            ? supabase.from("post_likes").select("post_id").in("post_id", postIds).eq("user_id", me)
            : Promise.resolve({ data: [] as { post_id: string }[] }),
          groupIds.length
            ? supabase.from("groups").select("id, name, avatar_url, verified").in("id", groupIds)
            : Promise.resolve({ data: [] as { id: string; name: string; avatar_url: string | null; verified: boolean }[] }),
        ]);

      const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));
      const groupMap = new Map((groups ?? []).map((g) => [g.id, g]));
      const likeCount: Record<string, number> = {};
      for (const l of likes ?? []) likeCount[l.post_id] = (likeCount[l.post_id] ?? 0) + 1;
      const commentCount: Record<string, number> = {};
      for (const c of comments ?? []) commentCount[c.post_id] = (commentCount[c.post_id] ?? 0) + 1;
      const mine = new Set((myLikes ?? []).map((l) => l.post_id));

      const enriched = rows.map((r) => ({
        ...r,
        media: normalizeMedia(r),
        hashtags: (r.hashtags ?? []) as string[],
        poll: (r.poll ?? null) as FeedPost["poll"],
        author: authorMap.get(r.author_id) as FeedPost["author"],
        group: (r.group_id ? groupMap.get(r.group_id) : null) as FeedPost["group"],
        like_count: likeCount[r.id] ?? 0,
        comment_count: commentCount[r.id] ?? 0,
        liked_by_me: mine.has(r.id),
      })) as FeedPost[];

      setPosts((prev) => [...prev, ...enriched]);
      cursorRef.current = rows[rows.length - 1].created_at;
      if (rows.length < PAGE) setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the feed");
    } finally {
      setLoading(false);
    }
  }, [done, me, tab]);

  useEffect(() => {
    reset();
  }, [tab, reset]);

  useEffect(() => {
    void fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, tab]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !loading && !error) void fetchPage();
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, [fetchPage, loading, error]);

  // Realtime: keep counts and new posts in sync
  useEffect(() => {
    const ch = supabase
      .channel("feed-live")
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "posts" }, (payload) => {
        const row = payload.old as { id: string };
        setPosts((prev) => prev.filter((p) => p.id !== row.id));
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "post_likes" }, (payload) => {
        const row = payload.new as { post_id: string; user_id: string };
        if (row.user_id === me) return;
        setPosts((prev) => prev.map((p) => (p.id === row.post_id ? { ...p, like_count: p.like_count + 1 } : p)));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "post_likes" }, (payload) => {
        const row = payload.old as { post_id: string; user_id: string };
        if (row?.user_id === me) return;
        setPosts((prev) =>
          prev.map((p) => (p.id === row.post_id ? { ...p, like_count: Math.max(0, p.like_count - 1) } : p)),
        );
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [me]);

  const createPost = async () => {
    if (!body.trim() || !me) return;
    setPosting(true);
    const text = body.trim();
    const { data, error: insErr } = await supabase
      .from("posts")
      .insert({
        author_id: me,
        body: text,
        post_type: postType,
        hashtags: extractHashtags(text),
        media: media ? [{ path: media.path, kind: media.kind }] : [],
        image_url: media ? `feed-media:${media.path}` : null,
        is_announcement: !!(isAdmin && announce),
      })
      .select()
      .single();
    setPosting(false);
    if (insErr) return toast.error(insErr.message);

    const { data: prof } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, premium_tier, incognito, verified, karma_points, account_type, org_type")
      .eq("id", me)
      .maybeSingle();

    setPosts((prev) => [
      {
        ...(data as unknown as FeedPost),
        media: normalizeMedia(data as { media?: unknown; image_url?: string | null }),
        author: prof as FeedPost["author"],
        group: null,
        like_count: 0,
        comment_count: 0,
        liked_by_me: false,
      },
      ...prev,
    ]);
    setBody("");
    setMedia(null);
    setPostType("normal");
    setAnnounce(false);
    toast.success("Posted");
  };

  const toggleLike = async (post: FeedPost) => {
    if (!me) return;
    const liked = post.liked_by_me;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, liked_by_me: !liked, like_count: p.like_count + (liked ? -1 : 1) } : p,
      ),
    );
    if (liked) await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", me);
    else await supabase.from("post_likes").insert({ post_id: post.id, user_id: me });
  };

  const writeWithHumi = async () => {
    setImproving(true);
    try {
      const { caption } = await captionFn({ data: { draft: body, tone: "warm" } });
      if (caption) setBody(caption);
      toast.success("HUMI polished your draft");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not reach HUMI");
    } finally {
      setImproving(false);
    }
  };

  const emptyCopy = useMemo(() => {
    if (tab === "following") return { title: "Nothing from people you follow", desc: "Follow helpers and organisations to fill this tab." };
    if (tab === "groups") return { title: "No group posts yet", desc: "Join a community to see what members are sharing." };
    if (tab === "help") return { title: "No help posts yet", desc: "Be the first person in your community to ask for help." };
    return { title: "The feed is quiet", desc: "Share an update, a story or a thank you to get things going." };
  }, [tab]);

  return (
    <div className="mx-auto w-full max-w-2xl space-y-5 pb-24 lg:pb-6">
      <StoriesBar me={me} />

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Home</h1>
        <p className="text-sm text-muted-foreground">What's happening in your community</p>
      </header>

      {/* Composer */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4 shadow-soft md:p-5">
        <Textarea
          placeholder="What's happening in your community?"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={3}
          aria-label="Write a post"
          className="resize-none"
        />
        <MediaPicker value={media} onChange={setMedia} />

        <div className="flex flex-wrap items-center gap-2">
          {([
            { v: "normal", label: "Post", icon: Newspaper },
            { v: "help_request", label: "Ask for help", icon: HandHeart },
            { v: "offer_help", label: "Offer help", icon: HeartHandshake },
          ] as const).map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => setPostType(o.v)}
              aria-pressed={postType === o.v}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                postType === o.v
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <o.icon className="h-3.5 w-3.5" aria-hidden /> {o.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch checked={announce} onCheckedChange={setAnnounce} aria-label="Post as official announcement" />
                <Megaphone className="h-3.5 w-3.5" aria-hidden /> Official
              </label>
            )}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={writeWithHumi}
              disabled={improving || !body.trim()}
              className="border-primary/40 text-primary hover:bg-primary/5"
            >
              {improving ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-1 h-3.5 w-3.5" />}
              Write with HUMI
            </Button>
          </div>
          <Button onClick={createPost} disabled={!body.trim() || posting} size="sm">
            {posting ? <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1 h-3.5 w-3.5" />}
            Post
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" aria-label="Feed filters" className="flex gap-1 rounded-xl border border-border bg-card p-1 shadow-soft">
        {TABS.map((t) => (
          <button
            key={t.key}
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`relative flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab === t.key && (
              <motion.span
                layoutId="feed-tab"
                className="absolute inset-0 rounded-lg bg-primary/10"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-4">
        {error && <ErrorState description={error} onRetry={() => { reset(); void fetchPage(); }} />}

        {posts.map((p, i) => (
          <div key={p.id}>
            <PostCard
              post={p}
              me={me}
              isAdmin={!!isAdmin}
              canModerate={!!isAdmin}
              onLike={() => toggleLike(p)}
              onShare={() => setShareFor(p)}
              onUpdate={(patch) => setPosts((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...patch } : x)))}
              onDelete={async () => {
                if (!confirm("Delete this post?")) return;
                const { error: delErr } = await supabase.from("posts").delete().eq("id", p.id);
                if (delErr) return toast.error(delErr.message);
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
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        )}

        {!loading && !error && posts.length === 0 && (
          <EmptyState
            icon={tab === "groups" ? Users : Newspaper}
            title={emptyCopy.title}
            description={emptyCopy.desc}
            action={
              tab === "help" ? (
                <Link to="/requests/new"><Button>Ask for help</Button></Link>
              ) : tab === "groups" ? (
                <Link to="/groups"><Button>Browse groups</Button></Link>
              ) : tab === "following" ? (
                <Link to="/discover"><Button>Find people to follow</Button></Link>
              ) : undefined
            }
          />
        )}

        <div ref={sentinelRef} className="h-8" />
      </div>

      <ShareSheet
        open={!!shareFor}
        onOpenChange={(v) => !v && setShareFor(null)}
        url={shareFor && typeof window !== "undefined" ? `${window.location.origin}/feed#${shareFor.id}` : ""}
        title="HumanLink"
        text={shareFor?.body ?? ""}
      />
    </div>
  );
}

function AdCard({ ad }: { ad: Ad }) {
  useEffect(() => {
    void supabase.from("ad_events").insert({ ad_id: ad.id, event_type: "impression" });
  }, [ad.id]);

  return (
    <a
      href={ad.destination_url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => void supabase.from("ad_events").insert({ ad_id: ad.id, event_type: "click" })}
      className="block overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-colors hover:bg-muted"
    >
      <div className="flex items-center justify-between px-4 pt-3">
        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Sponsored
        </span>
        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      </div>
      {ad.image_url && (
        <img src={ad.image_url} alt={ad.title} loading="lazy" className="mt-3 h-48 w-full object-cover" />
      )}
      <div className="p-4">
        <p className="text-sm font-semibold">{ad.title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{ad.description}</p>
      </div>
    </a>
  );
}

export { timeAgo };

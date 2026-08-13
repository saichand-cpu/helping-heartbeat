import { useCallback, useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Loader2, MoreHorizontal, Pin, Send, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { displayIdentity } from "@/lib/identity";
import { timeAgo, type FeedAuthor } from "@/lib/social";
import { toast } from "sonner";

type CommentRow = {
  id: string;
  post_id: string;
  author_id: string;
  body: string;
  parent_id: string | null;
  pinned: boolean;
  created_at: string;
  author?: FeedAuthor;
  likes: number;
  liked_by_me: boolean;
};

export function CommentsPanel({
  postId, postAuthorId, me, open, onOpenChange, onCountChange,
}: {
  postId: string;
  postAuthorId: string;
  me: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCountChange?: (n: number) => void;
}) {
  const [items, setItems] = useState<CommentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<CommentRow | null>(null);
  const [sort, setSort] = useState<"newest" | "top">("newest");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: rows } = await supabase
      .from("post_comments")
      .select("id, post_id, author_id, body, parent_id, pinned, created_at")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    const list = rows ?? [];
    const ids = Array.from(new Set(list.map((r) => r.author_id)));
    const commentIds = list.map((r) => r.id);
    const [{ data: authors }, { data: likes }] = await Promise.all([
      ids.length
        ? supabase.from("profiles").select("id, full_name, avatar_url, premium_tier, incognito, karma_points").in("id", ids)
        : Promise.resolve({ data: [] as never[] }),
      commentIds.length
        ? supabase.from("comment_likes").select("comment_id, user_id").in("comment_id", commentIds)
        : Promise.resolve({ data: [] as never[] }),
    ]);
    const amap = new Map((authors ?? []).map((a) => [a.id, a as unknown as FeedAuthor]));
    const likeCount: Record<string, number> = {};
    const mine = new Set<string>();
    for (const l of (likes ?? []) as { comment_id: string; user_id: string }[]) {
      likeCount[l.comment_id] = (likeCount[l.comment_id] ?? 0) + 1;
      if (l.user_id === me) mine.add(l.comment_id);
    }
    const enriched: CommentRow[] = list.map((r) => ({
      ...r,
      author: amap.get(r.author_id),
      likes: likeCount[r.id] ?? 0,
      liked_by_me: mine.has(r.id),
    }));
    setItems(enriched);
    onCountChange?.(enriched.length);
    setLoading(false);
  }, [postId, me, onCountChange]);

  useEffect(() => { if (open) void load(); }, [open, load]);

  useEffect(() => {
    if (!open) return;
    const ch = supabase
      .channel(`comments-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "post_comments", filter: `post_id=eq.${postId}` }, () => void load())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
  }, [open, postId, load]);

  const send = async () => {
    if (!body.trim() || !me) return;
    setSending(true);
    const { error } = await supabase.from("post_comments").insert({
      post_id: postId,
      author_id: me,
      body: body.trim(),
      parent_id: replyTo?.id ?? null,
    });
    setSending(false);
    if (error) return toast.error(error.message);
    setBody("");
    setReplyTo(null);
    void load();
  };

  const toggleLike = async (c: CommentRow) => {
    if (!me) return;
    setItems((prev) => prev.map((x) => x.id === c.id
      ? { ...x, liked_by_me: !c.liked_by_me, likes: x.likes + (c.liked_by_me ? -1 : 1) } : x));
    if (c.liked_by_me) await supabase.from("comment_likes").delete().eq("comment_id", c.id).eq("user_id", me);
    else await supabase.from("comment_likes").insert({ comment_id: c.id, user_id: me });
  };

  const remove = async (c: CommentRow) => {
    const { error } = await supabase.from("post_comments").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    void load();
  };

  const togglePin = async (c: CommentRow) => {
    const { error } = await supabase.from("post_comments").update({ pinned: !c.pinned }).eq("id", c.id);
    if (error) return toast.error(error.message);
    void load();
  };

  const roots = items.filter((c) => !c.parent_id);
  const sorted = [...roots].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (sort === "top") return b.likes - a.likes;
    return +new Date(b.created_at) - +new Date(a.created_at);
  });

  const Row = ({ c, depth = 0 }: { c: CommentRow; depth?: number }) => {
    const id = displayIdentity({ ...c.author, id: c.author_id }, me);
    const canManage = me === c.author_id;
    const canPin = me === postAuthorId && depth === 0;
    const replies = items.filter((x) => x.parent_id === c.id);
    return (
      <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className={depth ? "pl-9" : ""}>
        <div className="flex gap-3 py-2.5">
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold overflow-hidden">
            {id.avatar_url ? <img src={id.avatar_url} alt="" className="h-full w-full object-cover" /> : id.initial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 text-xs">
              {id.isIncognito || c.author_id === me ? (
                <span className="font-semibold">{c.author_id === me ? "You" : id.name}</span>
              ) : (
                <Link to="/profile/$userId" params={{ userId: c.author_id }} className="font-semibold hover:underline">
                  {id.name}
                </Link>
              )}
              <span className="text-muted-foreground">{timeAgo(c.created_at)}</span>
              {c.pinned && <span className="inline-flex items-center gap-1 text-[10px] text-primary"><Pin className="h-3 w-3" /> Pinned</span>}
            </div>
            <p className="text-sm mt-0.5 whitespace-pre-wrap break-words">{c.body}</p>
            <div className="flex items-center gap-3 mt-1 text-[11px] text-muted-foreground">
              <button onClick={() => void toggleLike(c)} className={`inline-flex items-center gap-1 ${c.liked_by_me ? "text-red-500" : ""}`}>
                <Heart className={`h-3.5 w-3.5 ${c.liked_by_me ? "fill-current" : ""}`} /> {c.likes || ""}
              </button>
              {depth === 0 && <button onClick={() => setReplyTo(c)} className="hover:text-foreground">Reply</button>}
            </div>
          </div>
          {(canManage || canPin) && (
            <DropdownMenu>
              <DropdownMenuTrigger className="text-muted-foreground h-6"><MoreHorizontal className="h-4 w-4" /></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canPin && <DropdownMenuItem onClick={() => void togglePin(c)}><Pin className="h-3.5 w-3.5 mr-2" />{c.pinned ? "Unpin" : "Pin"}</DropdownMenuItem>}
                {canManage && <DropdownMenuItem className="text-destructive" onClick={() => void remove(c)}><Trash2 className="h-3.5 w-3.5 mr-2" />Delete</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        {replies.map((r) => <Row key={r.id} c={r} depth={depth + 1} />)}
      </motion.div>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-2xl sm:max-w-2xl sm:mx-auto p-0 flex flex-col">
        <SheetHeader className="px-4 py-3 border-b border-border">
          <SheetTitle className="flex items-center justify-between text-base">
            Comments
            <button
              onClick={() => setSort((s) => (s === "newest" ? "top" : "newest"))}
              className="text-xs font-normal text-muted-foreground hover:text-foreground"
            >
              Sort: {sort === "newest" ? "Newest" : "Top"}
            </button>
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 divide-y divide-border/60">
          {loading ? (
            <div className="py-10 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : sorted.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No comments yet — be the first kind word here.
            </div>
          ) : (
            sorted.map((c) => <Row key={c.id} c={c} />)
          )}
        </div>

        <div className="border-t border-border p-3 space-y-2">
          {replyTo && (
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
              Replying to {displayIdentity({ ...replyTo.author, id: replyTo.author_id }, me).name}
              <button onClick={() => setReplyTo(null)} className="hover:text-foreground">Cancel</button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="Add a comment…"
              className="rounded-xl"
            />
            <Button size="icon" disabled={!body.trim() || sending} onClick={() => void send()} className="rounded-xl shrink-0">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send, ArrowLeft, Loader2, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

type Conversation = {
  other_id: string;
  last: string;
  time: string;
  full_name: string | null;
  avatar_url: string | null;
  unread: number;
};

type Msg = {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  read?: boolean;
  pending?: boolean;
};

function MessagesPage() {
  const [me, setMe] = useState<string | null>(null);
  const [convos, setConvos] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const buildConvos = (rows: Msg[], meId: string) => {
    const map = new Map<string, Conversation>();
    rows.forEach((m) => {
      const other = m.sender_id === meId ? m.receiver_id : m.sender_id;
      if (!map.has(other)) {
        map.set(other, { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, unread: 0 });
      }
    });
    return map;
  };

  const loadConvos = async () => {
    if (!me) return;
    const { data } = await supabase
      .from("messages")
      .select("id, sender_id, receiver_id, content, created_at")
      .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
      .order("created_at", { ascending: false })
      .limit(200);

    const map = buildConvos((data ?? []) as Msg[], me);
    const others = Array.from(map.keys());
    if (others.length) {
      const { data: profs } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", others);
      (profs ?? []).forEach((p: any) => {
        const c = map.get(p.id);
        if (c) { c.full_name = p.full_name; c.avatar_url = p.avatar_url; }
      });
    }
    setConvos(Array.from(map.values()));
    setLoading(false);
  };

  useEffect(() => {
    if (!me) return;
    loadConvos();

    // Global realtime: refresh list previews on any new message touching me
    const ch = supabase
      .channel(`msg-list:${me}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `receiver_id=eq.${me}` },
        (payload) => {
          const m = payload.new as Msg;
          const other = m.sender_id;
          setConvos((prev) => {
            const idx = prev.findIndex((c) => c.other_id === other);
            const next: Conversation = idx >= 0
              ? { ...prev[idx], last: m.content, time: m.created_at, unread: activeId === other ? 0 : prev[idx].unread + 1 }
              : { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, unread: activeId === other ? 0 : 1 };
            const without = prev.filter((c) => c.other_id !== other);
            return [next, ...without];
          });
        })
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `sender_id=eq.${me}` },
        (payload) => {
          const m = payload.new as Msg;
          const other = m.receiver_id;
          setConvos((prev) => {
            const idx = prev.findIndex((c) => c.other_id === other);
            const next: Conversation = idx >= 0
              ? { ...prev[idx], last: m.content, time: m.created_at }
              : { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, unread: 0 };
            const without = prev.filter((c) => c.other_id !== other);
            return [next, ...without];
          });
        })
      .subscribe();

    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [me, activeId]);

  const activeConvo = useMemo(() => convos.find((c) => c.other_id === activeId) ?? null, [convos, activeId]);

  return (
    <div className="pb-24 lg:pb-6">
      <div className="glass rounded-3xl shadow-soft overflow-hidden grid md:grid-cols-[320px_1fr] h-[calc(100vh-140px)] min-h-[520px]">
        {/* List pane */}
        <aside className={cn("border-r border-border/40 overflow-y-auto", activeId && "hidden md:block")}>
          <div className="px-4 py-3 border-b border-border/40">
            <h1 className="text-lg font-bold">Messages</h1>
            <p className="text-xs text-muted-foreground">Live conversations</p>
          </div>
          {loading ? (
            <div className="p-3 space-y-2">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : convos.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              <MessageCircle className="h-7 w-7 mx-auto mb-2 text-primary" />
              No conversations yet.
            </div>
          ) : (
            <ul>
              {convos.map((c) => (
                <li key={c.other_id}>
                  <button
                    onClick={() => { setActiveId(c.other_id); setConvos((prev) => prev.map((x) => x.other_id === c.other_id ? { ...x, unread: 0 } : x)); }}
                    className={cn(
                      "w-full text-left px-4 py-3 flex gap-3 items-center hover:bg-accent/40 transition-colors border-b border-border/30",
                      activeId === c.other_id && "bg-accent/60",
                    )}
                  >
                    <div className="h-11 w-11 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold overflow-hidden shrink-0">
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : (c.full_name || "U").charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-semibold truncate text-sm">{c.full_name || "User"}</div>
                        <div className="text-[10px] text-muted-foreground">{new Date(c.time).toLocaleDateString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground truncate flex-1">{c.last}</div>
                        {c.unread > 0 && (
                          <span className="text-[10px] font-bold rounded-full bg-amber-500 text-black px-1.5 py-0.5 shadow-[0_0_8px_rgba(245,158,11,0.7)]">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Thread pane */}
        <section className={cn("flex flex-col min-h-0", !activeId && "hidden md:flex")}>
          {activeConvo && me ? (
            <Thread me={me} other={activeConvo} onBack={() => setActiveId(null)} />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-muted-foreground p-8 text-center">
              <div>
                <MessageCircle className="h-10 w-10 mx-auto mb-2 text-primary/60" />
                Select a conversation to start chatting.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Thread({ me, other, onBack }: { me: string; other: Conversation; onBack: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  // Mark all unread messages from `other` as read (server + optimistic local).
  const markThreadRead = useCallback(async (rows: Msg[]) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
    const unreadIds = rows.filter((m) => m.receiver_id === me && m.sender_id === other.other_id && !m.read && !m.pending).map((m) => m.id);
    if (unreadIds.length === 0) return;
    setMsgs((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read: true } : m)));
    await supabase
      .from("messages")
      .update({ read: true })
      .in("id", unreadIds)
      .eq("receiver_id", me);
  });

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setMsgs([]);
    (async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${me},receiver_id.eq.${other.other_id}),and(sender_id.eq.${other.other_id},receiver_id.eq.${me})`)
        .order("created_at", { ascending: true })
        .limit(200);
      if (!alive) return;
      const rows = (data ?? []) as Msg[];
      setMsgs(rows);
      setLoading(false);
      markThreadRead(rows);
    })();

    const ch = supabase
      .channel(`thread:${[me, other.other_id].sort().join(":")}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          const inThread =
            (m.sender_id === me && m.receiver_id === other.other_id) ||
            (m.sender_id === other.other_id && m.receiver_id === me);
          if (!inThread) return;
          setMsgs((prev) => {
            // replace optimistic pending if same sender+content
            const idx = prev.findIndex((x) => x.pending && x.sender_id === m.sender_id && x.content === m.content);
            if (idx >= 0) {
              const copy = prev.slice();
              copy[idx] = m;
              return copy;
            }
            if (prev.find((x) => x.id === m.id)) return prev;
            return [...prev, m];
          });
          // If the incoming message is addressed to me, mark it read immediately.
          if (m.receiver_id === me && m.sender_id === other.other_id) {
            markThreadRead([m]);
          }
        })
      .on("postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const m = payload.new as Msg;
          const inThread =
            (m.sender_id === me && m.receiver_id === other.other_id) ||
            (m.sender_id === other.other_id && m.receiver_id === me);
          if (!inThread) return;
          setMsgs((prev) => prev.map((x) => (x.id === m.id ? { ...x, ...m } : x)));
        })
      .subscribe();

    const onVis = () => {
      if (document.visibilityState === "visible") {
        setMsgs((prev) => { markThreadRead(prev); return prev; });
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      alive = false;
      supabase.removeChannel(ch);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [me, other.other_id, markThreadRead]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [msgs.length]);

  const send = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setSending(true);
    const optimistic: Msg = {
      id: `tmp-${Date.now()}`,
      sender_id: me,
      receiver_id: other.other_id,
      content,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setMsgs((prev) => [...prev, optimistic]);
    setText("");
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: me, receiver_id: other.other_id, content })
      .select()
      .single();
    if (error) {
      setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
      setText(content);
    } else if (data) {
      setMsgs((prev) => {
        const without = prev.filter((m) => m.id !== optimistic.id && m.id !== (data as Msg).id);
        return [...without, data as Msg];
      });
    }
    setSending(false);
  };

  return (
    <div className="flex flex-col min-h-0 h-full">
      <header className="px-4 py-3 border-b border-border/40 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-sm font-bold overflow-hidden">
          {other.avatar_url ? <img src={other.avatar_url} alt="" className="h-full w-full object-cover" /> : (other.full_name || "U").charAt(0)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">{other.full_name || "User"}</div>
          <div className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </div>
        </div>
      </header>

      <div ref={scrollerRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2 bg-gradient-to-b from-transparent to-accent/10">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-2/3 rounded-2xl" />)}
          </div>
        ) : msgs.length === 0 ? (
          <div className="text-center text-xs text-muted-foreground py-10">Say hello — start the conversation.</div>
        ) : (
          <AnimatePresence initial={false}>
            {msgs.map((m) => {
              const mine = m.sender_id === me;
              return (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={cn("flex", mine ? "justify-end" : "justify-start")}
                >
                  <div className={cn(
                    "max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-soft",
                    mine
                      ? "bg-gradient-brand text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm",
                    m.pending && "opacity-70",
                  )}>
                    <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    <div className={cn("text-[10px] mt-0.5 opacity-70 text-right")}>
                      {m.pending ? "sending…" : new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <form
        onSubmit={(e) => { e.preventDefault(); send(); }}
        className="border-t border-border/40 p-3 flex items-center gap-2 bg-background/60 backdrop-blur"
      >
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message…"
          className="h-10"
        />
        <Button
          type="submit"
          disabled={!text.trim() || sending}
          size="icon"
          className="h-10 w-10 bg-gradient-brand text-primary-foreground border-0 shadow-glow shrink-0"
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </form>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MessageCircle, Send, ArrowLeft, Loader2, Check, CheckCheck, Phone, MapPin, Search as SearchIcon, Smile, ImageIcon, X } from "lucide-react";
import { LeafletMap } from "@/components/site/LeafletMap";
import { CallOverlay } from "@/components/site/CallOverlay";
import { useWebRTC } from "@/hooks/use-webrtc";
import { usePresence } from "@/hooks/use-presence";
import { uploadFeedMedia, resolveMediaUrl } from "@/lib/upload";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

function parseLocation(content?: string | null): { lat: number; lng: number } | null {
  const m = content?.match(/^\[loc:(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)\]/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}
function parseCall(content?: string | null): string | null {
  const m = content?.match(/^\[call:([a-z]+)\]/);
  return m ? m[1] : null;
}

export const Route = createFileRoute("/_authenticated/messages")({
  validateSearch: (s: Record<string, unknown>) => ({
    user: typeof s?.user === "string" ? s.user : undefined,
  }),
  component: MessagesPage,
});

type Conversation = {
  other_id: string;
  last: string;
  time: string;
  full_name: string | null;
  avatar_url: string | null;
  profession: string | null;
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
  const rtc = useWebRTC(me);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  // Keep a signaling channel open to the active peer so incoming offers arrive.
  useEffect(() => { rtc.listenTo(activeId); }, [activeId, rtc]);

  const callPeer = useMemo(
    () => convos.find((c) => c.other_id === rtc.peerId) ?? null,
    [convos, rtc.peerId],
  );

  const buildConvos = (rows: Msg[], meId: string) => {
    const map = new Map<string, Conversation>();
    rows.forEach((m) => {
      const other = m.sender_id === meId ? m.receiver_id : m.sender_id;
      if (!map.has(other)) {
        map.set(other, { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, profession: null, unread: 0 });
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
              : { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, profession: null, unread: activeId === other ? 0 : 1 };
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
              : { other_id: other, last: m.content, time: m.created_at, full_name: null, avatar_url: null, profession: null, unread: 0 };
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
                  <div
                    className={cn(
                      "w-full px-4 py-3 flex gap-3 items-center hover:bg-accent/40 transition-colors border-b border-border/30",
                      activeId === c.other_id && "bg-accent/60",
                    )}
                  >
                    <Link
                      to="/profile/$userId"
                      params={{ userId: c.other_id }}
                      className="h-11 w-11 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold overflow-hidden shrink-0 hover:ring-2 hover:ring-primary/60 transition"
                      aria-label="Open profile"
                    >
                      {c.avatar_url ? <img src={c.avatar_url} alt="" className="h-full w-full object-cover" /> : (c.full_name || "U").charAt(0)}
                    </Link>
                    <button
                      type="button"
                      onClick={() => { setActiveId(c.other_id); setConvos((prev) => prev.map((x) => x.other_id === c.other_id ? { ...x, unread: 0 } : x)); }}
                      className="flex-1 min-w-0 text-left"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold truncate text-sm hover:text-primary transition-colors">
                          {c?.full_name || "User"}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{c?.time ? new Date(c.time).toLocaleDateString() : ""}</span>
                      </div>
                      {c?.profession && (
                        <div className="text-[10px] text-amber-500/90 truncate">{c.profession}</div>
                      )}
                      <div className="flex items-center gap-2">
                        <div className="text-xs text-muted-foreground truncate flex-1">{c.last}</div>
                        {c.unread > 0 && (
                          <span className="text-[10px] font-bold rounded-full bg-amber-500 text-black px-1.5 py-0.5 shadow-[0_0_8px_rgba(245,158,11,0.7)]">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Thread pane */}
        <section className={cn("flex flex-col min-h-0", !activeId && "hidden md:flex")}>
          {activeConvo && me ? (
            <Thread me={me} other={activeConvo} onBack={() => setActiveId(null)} onStartCall={() => rtc.startCall(activeConvo.other_id)} />
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

      <CallOverlay
        status={rtc.status}
        peerName={callPeer?.full_name ?? null}
        peerAvatar={callPeer?.avatar_url ?? null}
        muted={rtc.muted}
        onAccept={() => rtc.acceptCall().catch((e) => toast.error(e?.message || "Mic permission denied"))}
        onDecline={rtc.declineCall}
        onHangup={rtc.hangup}
        onToggleMute={rtc.toggleMute}
      />
    </div>
  );
}

function Thread({ me, other, onBack, onStartCall }: { me: string; other: Conversation; onBack: () => void; onStartCall: () => void }) {
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
  }, [me, other.other_id]);

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
            if (m.content?.startsWith("[call:")) {
              toast(`📞 Incoming call from ${other?.full_name || "user"}`, {
                description: "Tap Accept in the thread to answer.",
                duration: 8000,
              });
            }
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

  const sendRaw = async (content: string) => {
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
    const { data, error } = await supabase
      .from("messages")
      .insert({ sender_id: me, receiver_id: other.other_id, content })
      .select()
      .single();
    if (error) {
      setMsgs((prev) => prev.filter((m) => m.id !== optimistic.id));
      toast.error(error.message || "Failed to send");
    } else if (data) {
      setMsgs((prev) => {
        const without = prev.filter((m) => m.id !== optimistic.id && m.id !== (data as Msg).id);
        return [...without, data as Msg];
      });
    }
    setSending(false);
  };

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText("");
    await sendRaw(content);
  };

  const startCall = async () => {
    try {
      onStartCall();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not start call";
      toast.error(msg);
    }
  };

  const [sharingLoc, setSharingLoc] = useState(false);
  const shareLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.error("Geolocation not available");
      return;
    }
    setSharingLoc(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos?.coords?.latitude;
        const lng = pos?.coords?.longitude;
        setSharingLoc(false);
        if (typeof lat !== "number" || typeof lng !== "number") {
          toast.error("Could not read location");
          return;
        }
        await sendRaw(`[loc:${lat.toFixed(6)},${lng.toFixed(6)}] My current location`);
      },
      (err) => {
        setSharingLoc(false);
        toast.error(err?.message || "Location permission denied");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };


  return (
    <div className="flex flex-col min-h-0 h-full">
      <header className="px-4 py-3 border-b border-amber-500/30 flex items-center gap-3 bg-black/40">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <Link to="/profile/$userId" params={{ userId: other.other_id }} className="h-9 w-9 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground text-sm font-bold overflow-hidden hover:ring-2 hover:ring-primary/60 transition" aria-label="Open profile">
          {other.avatar_url ? <img src={other.avatar_url} alt="" className="h-full w-full object-cover" /> : (other.full_name || "U").charAt(0)}
        </Link>
        <div className="min-w-0 flex-1">
          <Link to="/profile/$userId" params={{ userId: other.other_id }} className="font-semibold text-sm truncate hover:text-primary transition-colors block">{other.full_name || "User"}</Link>
          <div className="text-[10px] text-emerald-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
          </div>
        </div>
        <Button
          type="button"
          onClick={startCall}
          size="icon"
          className="h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-[0_0_16px_rgba(59,130,246,0.6)] hover:scale-105 transition-transform shrink-0"
          aria-label="Start call"
          title="Start voice/video call"
        >
          <Phone className="h-4 w-4" />
        </Button>
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
              const loc = parseLocation(m?.content);
              const call = parseCall(m?.content);
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
                    {loc ? (
                      <a
                        href={`https://www.google.com/maps?q=${loc.lat},${loc.lng}`}
                        target="_blank"
                        rel="noreferrer"
                        className="block space-y-2"
                      >
                        <div className="flex items-center gap-1 text-xs opacity-90">
                          <MapPin className="h-3 w-3" /> Shared location
                        </div>
                        <div className="w-[220px] max-w-full">
                          <LeafletMap pins={[{ id: m.id, lat: loc.lat, lng: loc.lng }]} height={140} interactive={false} zoom={13} />
                        </div>
                        <div className="text-[10px] opacity-80">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)} — tap to open
                        </div>
                      </a>
                    ) : call ? (
                      <div className="flex items-center gap-2">
                        <span className="grid place-items-center h-8 w-8 rounded-full bg-primary/20 text-primary">
                          <Phone className="h-4 w-4" />
                        </span>
                        <div>
                          <div className="font-semibold">{mine ? "You started" : "Incoming"} {call} call</div>
                          <div className="text-[10px] opacity-80">Tap to answer · WebRTC not yet wired</div>
                        </div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-wrap break-words">{m.content}</div>
                    )}
                    <div className={cn("text-[10px] mt-0.5 opacity-80 text-right flex items-center gap-1 justify-end")}>
                      <span>
                        {m.pending ? "sending…" : new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {mine && !m.pending && (
                        m.read
                          ? <CheckCheck className="h-3 w-3 text-sky-300" aria-label="Read" />
                          : <Check className="h-3 w-3 opacity-80" aria-label="Sent" />
                      )}
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
        className="border-t border-amber-500/30 p-3 flex items-center gap-2 bg-black/50 backdrop-blur"
      >
        <Button
          type="button"
          onClick={shareLocation}
          disabled={sharingLoc || sending}
          size="icon"
          variant="outline"
          className="h-10 w-10 shrink-0 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
          aria-label="Share location"
          title="Share your current location"
        >
          {sharingLoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
        </Button>
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

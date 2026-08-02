import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import {
  Send, Paperclip, Loader2, Mic, MicOff, Volume2, VolumeX, X, ShieldAlert,
  Sparkles, ArrowRight, HeartHandshake, Users, Building2, Newspaper, MessageCircle, Trophy, Square, PanelLeft,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { HumiOrb, HumiAurora } from "./HumiOrb";
import { HumiMarkdown } from "./HumiMarkdown";
import { HumiSidebar } from "./HumiSidebar";
import {
  ACTIONS_DELIMITER, HUMI_AGENTS, agentById, detectEmergency,
  type HumiAction, type HumiAgentId,
} from "@/lib/humi-agents";
import {
  createThread, deleteThread, listMessages, listThreads, saveMessage, titleFrom, updateThread,
  type HumiAttachment, type HumiDbMessage, type HumiThread,
} from "@/lib/humi-threads";
import { setPendingSend, takePendingSend } from "@/lib/humi-pending";
import { authenticatedFetch } from "@/lib/authenticated-fetch";

const MAX_FILE_BYTES = 6 * 1024 * 1024;

type UiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments: HumiAttachment[];
  actions: HumiAction[];
};

const STARTERS = [
  { icon: HeartHandshake, label: "Post a help request", text: "Help me write and post a help request on HumanLink." },
  { icon: Users, label: "Find nearby helpers", text: "Find volunteers near me who can help this week." },
  { icon: Sparkles, label: "Plan my week", text: "Plan my week around my goals and give me a daily schedule." },
  { icon: Building2, label: "Grow my business", text: "Build a 30-day marketing plan for my small business." },
];

async function fileToAttachment(file: File): Promise<HumiAttachment> {
  if (file.size > MAX_FILE_BYTES) throw new Error(`${file.name} is larger than 6MB`);
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Could not read file"));
    r.readAsDataURL(file);
  });
  return { name: file.name, mime: file.type || "application/octet-stream", dataUrl };
}

function splitActions(raw: string): { text: string; actions: HumiAction[] } {
  const idx = raw.lastIndexOf(ACTIONS_DELIMITER);
  if (idx === -1) return { text: raw, actions: [] };
  const text = raw.slice(0, idx).trimEnd();
  const tail = raw.slice(idx + ACTIONS_DELIMITER.length).trim().replace(/^```(json)?|```$/g, "").trim();
  try {
    const parsed = JSON.parse(tail);
    if (Array.isArray(parsed)) {
      return {
        text,
        actions: parsed
          .filter((a) => a && typeof a.kind === "string" && typeof a.label === "string")
          .slice(0, 4) as HumiAction[],
      };
    }
  } catch {
    /* stream may be mid-JSON */
  }
  return { text, actions: [] };
}

const ACTION_ICON: Record<string, typeof Sparkles> = {
  create_request: HeartHandshake,
  emergency_request: ShieldAlert,
  find_helpers: Users,
  find_ngos: Building2,
  open_feed: Newspaper,
  open_messages: MessageCircle,
  open_leaderboard: Trophy,
  prompt: ArrowRight,
};

export function HumiWorkspace({ threadId }: { threadId?: string }) {
  const navigate = useNavigate();
  const [threads, setThreads] = useState<HumiThread[]>([]);
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<HumiAttachment[]>([]);
  const [streaming, setStreaming] = useState("");
  const [busy, setBusy] = useState(false);
  const [agent, setAgent] = useState<HumiAgentId>("general");
  const [emergency, setEmergency] = useState(false);
  const [listening, setListening] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [loadingThread, setLoadingThread] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const activeAgent = useMemo(() => agentById(agent), [agent]);

  const refreshThreads = useCallback(async () => {
    try {
      setThreads(await listThreads());
    } catch {
      /* silent */
    }
  }, []);

  useEffect(() => {
    void refreshThreads();
  }, [refreshThreads]);

  // Load the messages for the thread in the URL.
  useEffect(() => {
    let cancelled = false;
    if (!threadId) {
      setMessages([]);
      setStreaming("");
      setEmergency(false);
      return;
    }
    setLoadingThread(true);
    listMessages(threadId)
      .then((rows: HumiDbMessage[]) => {
        if (cancelled) return;
        setMessages(
          rows
            .filter((r) => r.role !== "system")
            .map((r) => ({
              id: r.id,
              role: r.role as "user" | "assistant",
              content: r.content,
              attachments: Array.isArray(r.attachments) ? r.attachments : [],
              actions: Array.isArray(r.actions) ? r.actions : [],
            })),
        );
      })
      .catch(() => toast.error("Could not load this conversation"))
      .finally(() => !cancelled && setLoadingThread(false));
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, busy]);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
      if (mod && e.key.toLowerCase() === "j") {
        e.preventDefault();
        void navigate({ to: "/humi" });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const speakOut = useCallback(
    (text: string) => {
      if (!speak || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      const clean = text.replace(/[#*`>|_-]/g, " ").slice(0, 900);
      const u = new SpeechSynthesisUtterance(clean);
      u.rate = 1.02;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [speak],
  );

  const runStream = useCallback(
    async (tid: string, history: UiMessage[], isEmergency: boolean) => {
      const controller = new AbortController();
      abortRef.current = controller;
      setBusy(true);
      setStreaming("");

      try {
        const res = await authenticatedFetch("/api/humi-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            agent,
            emergency: isEmergency,
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
          }),
        });

        if (!res.ok || !res.body) {
          toast.error((await res.text().catch(() => "")) || "HUMI could not respond");
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let raw = "";
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          raw += decoder.decode(value, { stream: true });
          setStreaming(splitActions(raw).text);
        }

        const { text, actions } = splitActions(raw);
        const saved = await saveMessage({ threadId: tid, role: "assistant", content: text, actions });
        setMessages((prev) => [
          ...prev,
          { id: saved.id, role: "assistant", content: text, attachments: [], actions },
        ]);
        setStreaming("");
        speakOut(text);
        void refreshThreads();
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        toast.error((e as Error).message === "LOGIN_REQUIRED" ? "Please sign in to use HUMI" : "HUMI hit a snag. Try again.");
      } finally {
        setBusy(false);
        abortRef.current = null;
      }
    },
    [agent, refreshThreads, speakOut],
  );

  const send = useCallback(
    async (rawText: string, files: HumiAttachment[] = attachments) => {
      const text = rawText.trim();
      if (!text && files.length === 0) return;
      if (busy) return;

      const isEmergency = detectEmergency(text);
      if (isEmergency) setEmergency(true);

      // No thread yet → create one, hand the message over, and route to it.
      if (!threadId) {
        try {
          const t = await createThread(agent);
          await updateThread(t.id, { title: titleFrom(text || files[0]?.name || "New conversation") });
          setPendingSend({ text, attachments: files, agent });
          setInput("");
          setAttachments([]);
          await navigate({ to: "/humi/$threadId", params: { threadId: t.id } });
        } catch {
          toast.error("Could not start a conversation");
        }
        return;
      }

      const optimistic: UiMessage = {
        id: `tmp-${Date.now()}`,
        role: "user",
        content: text,
        attachments: files,
        actions: [],
      };
      const history = [...messages, optimistic];
      setMessages(history);
      setInput("");
      setAttachments([]);

      try {
        await saveMessage({ threadId, role: "user", content: text, attachments: files });
        if (messages.length === 0) {
          await updateThread(threadId, {
            title: titleFrom(text || files[0]?.name || "New conversation"),
            emergency: isEmergency,
          });
          void refreshThreads();
        } else if (isEmergency) {
          await updateThread(threadId, { emergency: true });
        }
      } catch {
        toast.error("Message could not be saved");
      }

      await runStream(threadId, history, isEmergency);
    },
    [agent, attachments, busy, messages, navigate, refreshThreads, runStream, threadId],
  );

  // Deliver a message handed over from the landing composer.
  useEffect(() => {
    if (!threadId || loadingThread) return;
    const p = takePendingSend();
    if (!p) return;
    setAgent(p.agent as HumiAgentId);
    void send(p.text, p.attachments);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, loadingThread]);

  const onFiles = async (list: FileList | null) => {
    if (!list?.length) return;
    try {
      const next = await Promise.all(Array.from(list).slice(0, 5).map(fileToAttachment));
      setAttachments((prev) => [...prev, ...next].slice(0, 5));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }
    const w = window as unknown as { SpeechRecognition?: new () => never; webkitSpeechRecognition?: new () => never };
    const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!Ctor) {
      toast.error("Voice input is not supported in this browser");
      return;
    }
    const rec = new Ctor() as unknown as {
      lang: string; interimResults: boolean; continuous: boolean;
      start: () => void; stop: () => void;
      onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
      onend: () => void; onerror: () => void;
    };
    rec.lang = navigator.language || "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i]![0]!.transcript;
      setInput(txt);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const runAction = async (a: HumiAction) => {
    const p = (a.payload ?? {}) as Record<string, string>;
    switch (a.kind) {
      case "create_request":
      case "emergency_request": {
        sessionStorage.setItem(
          "humi:prefill:request",
          JSON.stringify({
            title: p.title ?? "",
            description: p.description ?? "",
            category: p.category ?? "other",
            urgency: a.kind === "emergency_request" ? "emergency" : (p.urgency ?? "normal"),
          }),
        );
        await navigate({ to: "/requests/new" });
        break;
      }
      case "find_helpers":
      case "find_ngos": {
        sessionStorage.setItem("humi:prefill:search", p.q ?? "");
        await navigate({ to: "/search" });
        break;
      }
      case "open_feed":
        await navigate({ to: "/feed" });
        break;
      case "open_messages":
        await navigate({ to: "/messages" });
        break;
      case "open_leaderboard":
        await navigate({ to: "/leaderboard" });
        break;
      case "prompt":
      default:
        void send(p.text ?? a.label);
    }
  };

  const onNew = () => void navigate({ to: "/humi" });
  const onDelete = async (id: string) => {
    try {
      await deleteThread(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (id === threadId) await navigate({ to: "/humi" });
    } catch {
      toast.error("Could not delete conversation");
    }
  };

  const empty = messages.length === 0 && !streaming;

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      {/* Desktop thread rail */}
      <aside className="hidden lg:block">
        <div className="sticky top-6 h-[calc(100vh-6rem)] rounded-3xl border border-border bg-card/80 p-3 backdrop-blur-xl">
          <HumiSidebar threads={threads} activeId={threadId} onNew={onNew} onDelete={onDelete} />
        </div>
      </aside>

      <section
        className={cn(
          "relative flex min-h-[calc(100vh-7rem)] flex-col overflow-hidden rounded-3xl border bg-card/70 backdrop-blur-xl",
          emergency ? "border-destructive/50" : "border-border",
        )}
      >
        <HumiAurora emergency={emergency} />

        {/* Header */}
        <header className="relative z-10 flex items-center gap-3 border-b border-border/70 px-4 py-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-xl lg:hidden">
                <PanelLeft className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-4">
              <HumiSidebar threads={threads} activeId={threadId} onNew={onNew} onDelete={onDelete} />
            </SheetContent>
          </Sheet>

          <HumiOrb size={34} active={busy} emergency={emergency} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-sm font-semibold">HUMI</h1>
              <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                {activeAgent.name}
              </span>
              {emergency && (
                <span className="flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-semibold text-destructive">
                  <ShieldAlert className="h-3 w-3" /> Emergency
                </span>
              )}
            </div>
            <p className="truncate text-[11px] text-muted-foreground">{activeAgent.blurb}</p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            aria-label={speak ? "Turn voice replies off" : "Turn voice replies on"}
            onClick={() => {
              setSpeak((v) => !v);
              if (speak) window.speechSynthesis?.cancel();
            }}
            className="rounded-xl"
          >
            {speak ? <Volume2 className="h-4 w-4 text-primary" /> : <VolumeX className="h-4 w-4" />}
          </Button>
        </header>

        {/* Agent switcher */}
        <div className="relative z-10 flex gap-1.5 overflow-x-auto border-b border-border/60 px-3 py-2">
          {HUMI_AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAgent(a.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                agent === a.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              <span className="mr-1 opacity-70">{a.emoji}</span>
              {a.name}
            </button>
          ))}
        </div>

        {/* Emergency banner */}
        <AnimatePresence>
          {emergency && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="relative z-10 overflow-hidden border-b border-destructive/30 bg-destructive/10"
            >
              <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
                <ShieldAlert className="h-4 w-4 text-destructive" />
                <p className="text-xs font-medium text-destructive">
                  Emergency mode — if life is at risk, call 112 now.
                </p>
                <div className="ml-auto flex gap-1.5">
                  <a href="tel:112">
                    <Button size="sm" variant="destructive" className="h-7 rounded-lg text-xs">
                      Call 112
                    </Button>
                  </a>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 rounded-lg text-xs"
                    onClick={() => runAction({ kind: "emergency_request", label: "SOS request" })}
                  >
                    Broadcast SOS
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => setEmergency(false)}>
                    Dismiss
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transcript */}
        <div ref={scrollRef} className="relative z-10 flex-1 space-y-5 overflow-y-auto px-4 py-6">
          {empty && (
            <div className="mx-auto flex max-w-lg flex-col items-center py-10 text-center">
              <HumiOrb size={76} active />
              <h2 className="mt-5 text-xl font-semibold tracking-tight">How can I help you today?</h2>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Ask anything, drop a file, or start something real on HumanLink.
              </p>
              <div className="mt-6 grid w-full gap-2 sm:grid-cols-2">
                {STARTERS.map((s) => (
                  <button
                    key={s.label}
                    type="button"
                    onClick={() => void send(s.text)}
                    className="flex items-center gap-2.5 rounded-2xl border border-border bg-background/70 px-3.5 py-3 text-left text-sm transition-colors hover:border-primary/40 hover:bg-primary/5"
                  >
                    <s.icon className="h-4 w-4 shrink-0 text-primary" />
                    <span className="font-medium">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn("flex gap-3", m.role === "user" ? "justify-end" : "justify-start")}
            >
              {m.role === "assistant" && <HumiOrb size={26} className="mt-1 shrink-0" />}
              <div className={cn("min-w-0", m.role === "user" ? "max-w-[85%]" : "max-w-[92%] flex-1")}>
                {m.attachments.length > 0 && (
                  <div className="mb-2 flex flex-wrap justify-end gap-2">
                    {m.attachments.map((a, i) =>
                      a.mime.startsWith("image/") ? (
                        <img key={i} src={a.dataUrl} alt={a.name} className="h-24 rounded-xl border border-border object-cover" />
                      ) : (
                        <span key={i} className="rounded-lg border border-border bg-muted px-2 py-1 text-xs">
                          {a.name}
                        </span>
                      ),
                    )}
                  </div>
                )}
                {m.role === "user" ? (
                  <div className="whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-[15px] leading-6 text-primary-foreground">
                    {m.content}
                  </div>
                ) : (
                  <>
                    <HumiMarkdown>{m.content}</HumiMarkdown>
                    {m.actions.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {m.actions.map((a, i) => {
                          const Icon = ACTION_ICON[a.kind] ?? ArrowRight;
                          const danger = a.kind === "emergency_request";
                          return (
                            <button
                              key={i}
                              type="button"
                              onClick={() => void runAction(a)}
                              className={cn(
                                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                                danger
                                  ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
                                  : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10",
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {a.label}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}

          {streaming && (
            <div className="flex gap-3">
              <HumiOrb size={26} active className="mt-1 shrink-0" />
              <div className="min-w-0 flex-1">
                <HumiMarkdown>{streaming}</HumiMarkdown>
              </div>
            </div>
          )}

          {busy && !streaming && (
            <div className="flex items-center gap-3">
              <HumiOrb size={26} active className="shrink-0" />
              <motion.span
                className="text-sm text-muted-foreground"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.4, repeat: Infinity }}
              >
                HUMI is thinking…
              </motion.span>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="relative z-10 border-t border-border/70 bg-background/50 p-3 backdrop-blur">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span key={i} className="flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2 py-1 text-xs">
                  {a.name}
                  <button type="button" aria-label="Remove attachment" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end gap-2 rounded-2xl border border-border bg-card px-2 py-2 focus-within:border-primary/50">
            <input
              ref={fileRef}
              type="file"
              multiple
              hidden
              accept="image/*,.pdf,.txt,.md,.csv,.doc,.docx"
              onChange={(e) => void onFiles(e.target.files)}
            />
            <Button variant="ghost" size="icon" aria-label="Attach files" className="rounded-xl" onClick={() => fileRef.current?.click()}>
              <Paperclip className="h-4 w-4" />
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send(input);
                }
              }}
              placeholder={listening ? "Listening…" : "Ask HUMI anything…  (⌘K)"}
              rows={1}
              className="max-h-40 min-h-[42px] flex-1 resize-none border-0 bg-transparent px-1 py-2.5 text-[15px] shadow-none focus-visible:ring-0"
            />
            <Button
              variant="ghost"
              size="icon"
              aria-label={listening ? "Stop listening" : "Speak"}
              onClick={toggleMic}
              className={cn("rounded-xl", listening && "text-destructive")}
            >
              {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            {busy ? (
              <Button size="icon" variant="secondary" aria-label="Stop" className="rounded-xl" onClick={() => abortRef.current?.abort()}>
                <Square className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                aria-label="Send"
                className="rounded-xl"
                disabled={!input.trim() && attachments.length === 0}
                onClick={() => void send(input)}
              >
                {loadingThread ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            )}
          </div>
          <p className="mt-1.5 px-1 text-[10.5px] text-muted-foreground">
            HUMI can make mistakes. Health and legal answers are information, not professional advice.
          </p>
        </div>
      </section>
    </div>
  );
}

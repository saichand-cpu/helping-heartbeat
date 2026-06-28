import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, Send, Paperclip, Camera, Loader2, Trash2, Image as ImageIcon } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type Attachment = { name: string; mime: string; dataUrl: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  attachments?: Attachment[];
};

const STORAGE_KEY = "humi:chat:v1";
const MAX_FILE_BYTES = 6 * 1024 * 1024; // 6MB per file

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

async function fileToAttachment(file: File): Promise<Attachment> {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is over 6MB`);
  }
  const dataUrl: string = await new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
  return { name: file.name, mime: file.type || "application/octet-stream", dataUrl };
}

export function HumiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setMessages(JSON.parse(raw));
    } catch {/* ignore */}
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))); } catch {/* ignore */}
  }, [messages]);

  useEffect(() => {
    if (open) scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open, streaming]);

  async function pickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    for (const f of files.slice(0, 4)) {
      try {
        const att = await fileToAttachment(f);
        setAttachments((prev) => [...prev, att]);
      } catch (err) {
        toast.error((err as Error).message);
      }
    }
  }

  async function send() {
    const text = input.trim();
    if (!text && attachments.length === 0) return;
    if (streaming) return;

    const userMsg: Msg = { id: uid(), role: "user", content: text, attachments: attachments.length ? attachments : undefined };
    const assistantId = uid();
    const next = [...messages, userMsg];
    setMessages([...next, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setAttachments([]);
    setStreaming(true);

    const ctrl = new AbortController();
    abortRef.current = ctrl;
    try {
      const res = await fetch("/api/humi-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content, attachments: m.attachments })),
        }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        const err = await res.text().catch(() => "");
        throw new Error(err || `HUMI is unavailable (${res.status})`);
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: acc } : m)));
      }
      if (!acc) {
        setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: "_HUMI had nothing to say. Try again?_" } : m)));
      }
    } catch (err) {
      const message = (err as Error).message || "HUMI is unavailable.";
      setMessages((prev) => prev.map((m) => (m.id === assistantId ? { ...m, content: `⚠️ ${message}` } : m)));
      if (!ctrl.signal.aborted) toast.error(message);
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  function clearChat() {
    setMessages([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {/* ignore */}
  }

  return (
    <>
      {/* Floating launcher */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open HUMI assistant"
        className="fixed bottom-44 right-4 lg:bottom-24 lg:right-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-indigo-500 text-white shadow-pop hover:shadow-glow grid place-items-center transition-transform hover:scale-105 active:scale-95"
      >
        <Sparkles className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
            className="fixed z-50 inset-x-3 bottom-3 lg:inset-auto lg:right-6 lg:bottom-6 lg:w-[420px] lg:h-[640px] max-h-[85vh] flex flex-col rounded-3xl border border-border bg-background/95 backdrop-blur-xl shadow-pop overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-fuchsia-500/10 via-violet-500/10 to-indigo-500/10">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-fuchsia-500 to-indigo-500 grid place-items-center text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold leading-tight">HUMI</div>
                <div className="text-xs text-muted-foreground leading-tight">Your kindness co-pilot</div>
              </div>
              <Button variant="ghost" size="icon" onClick={clearChat} aria-label="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} aria-label="Close HUMI">
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground space-y-3 mt-6">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-500 grid place-items-center text-white">
                    <Sparkles className="h-7 w-7" />
                  </div>
                  <p className="font-medium text-foreground">Hi, I'm HUMI ✨</p>
                  <p>Drop a resume, a medical report, a photo, or just ask:</p>
                  <div className="grid gap-2 text-left">
                    {[
                      "Help me write a kind request for groceries this week",
                      "Summarize this medical report for me",
                      "What can I offer to help others with my skills?",
                    ].map((s) => (
                      <button
                        key={s}
                        onClick={() => setInput(s)}
                        className="text-xs rounded-xl border border-border px-3 py-2 hover:bg-muted text-foreground/90"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((m) => (
                <MessageBubble key={m.id} msg={m} />
              ))}
              {streaming && messages[messages.length - 1]?.role === "assistant" && messages[messages.length - 1]?.content === "" && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> HUMI is thinking…
                </div>
              )}
            </div>

            {/* Attachments preview */}
            {attachments.length > 0 && (
              <div className="px-3 pt-2 pb-1 flex gap-2 flex-wrap border-t border-border">
                {attachments.map((a, i) => (
                  <div key={i} className="relative h-14 w-14 rounded-lg overflow-hidden border border-border bg-muted grid place-items-center">
                    {a.mime.startsWith("image/") ? (
                      <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[9px] px-1 text-center break-all">{a.name.slice(0, 18)}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] grid place-items-center"
                      aria-label="Remove attachment"
                    >×</button>
                  </div>
                ))}
              </div>
            )}

            {/* Composer */}
            <div className="border-t border-border p-3 flex items-end gap-2">
              <input ref={fileRef} type="file" multiple hidden accept="image/*,application/pdf,.txt,.md,.docx" onChange={pickFiles} />
              <input ref={cameraRef} type="file" hidden accept="image/*" capture="environment" onChange={pickFiles} />
              <Button type="button" variant="ghost" size="icon" onClick={() => fileRef.current?.click()} aria-label="Attach file">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button type="button" variant="ghost" size="icon" onClick={() => cameraRef.current?.click()} aria-label="Use camera">
                <Camera className="h-4 w-4" />
              </Button>
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask HUMI anything…"
                rows={1}
                className="flex-1 min-h-[40px] max-h-32 resize-none"
              />
              {streaming ? (
                <Button type="button" size="icon" variant="secondary" onClick={stop} aria-label="Stop">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </Button>
              ) : (
                <Button
                  type="button"
                  size="icon"
                  onClick={send}
                  disabled={!input.trim() && attachments.length === 0}
                  className="bg-gradient-to-br from-fuchsia-500 to-indigo-500 text-white border-0"
                  aria-label="Send"
                >
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "" : "w-full"}`}>
        {msg.attachments && msg.attachments.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {msg.attachments.map((a, i) => (
              <div key={i} className="h-20 w-20 rounded-lg overflow-hidden border border-border bg-muted grid place-items-center text-[10px]">
                {a.mime.startsWith("image/") ? (
                  <img src={a.dataUrl} alt={a.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="p-1 text-center"><ImageIcon className="h-4 w-4 mx-auto mb-1" />{a.name.slice(0, 14)}</div>
                )}
              </div>
            ))}
          </div>
        )}
        {isUser ? (
          <div className="rounded-2xl px-3 py-2 text-sm bg-primary text-primary-foreground whitespace-pre-wrap">
            {msg.content}
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed [&_p]:my-2 [&_ul]:my-2 [&_h1]:text-base [&_h2]:text-base [&_h3]:text-sm">
            <ReactMarkdown>{msg.content || "…"}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

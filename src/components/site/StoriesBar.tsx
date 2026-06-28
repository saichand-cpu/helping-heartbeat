import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, ChevronLeft, ChevronRight, Loader2, Trash2, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { resolveMediaUrl, uploadFeedMedia } from "@/lib/upload";
import { displayIdentity } from "@/lib/identity";

type StoryRow = {
  id: string;
  author_id: string;
  media_url: string;
  media_type: string;
  caption: string | null;
  created_at: string;
  expires_at: string;
};

type Author = { id: string; full_name: string; avatar_url: string | null; incognito?: boolean | null; premium_tier?: string | null };

type Bundle = {
  author_id: string;
  author?: Author;
  stories: (StoryRow & { resolved?: string | null })[];
  hasNew: boolean;
};

export function StoriesBar({ me }: { me: string | null }) {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewer, setViewer] = useState<{ bundleIdx: number; storyIdx: number } | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data: rowsRaw } = await (supabase as any)
      .from("stories")
      .select("*")
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: true });
    const rows: StoryRow[] = (rowsRaw ?? []) as StoryRow[];
    const ids = Array.from(new Set(rows.map((r) => r.author_id)));
    const { data: authors } = ids.length
      ? await supabase.from("profiles").select("id, full_name, avatar_url, incognito, premium_tier").in("id", ids)
      : { data: [] as any[] };
    const amap = new Map((authors ?? []).map((a: any) => [a.id, a]));
    const byAuthor = new Map<string, Bundle>();
    for (const r of rows) {
      const b = byAuthor.get(r.author_id) ?? { author_id: r.author_id, author: amap.get(r.author_id), stories: [], hasNew: true };
      b.stories.push(r);
      byAuthor.set(r.author_id, b);
    }
    // Resolve signed URLs in parallel
    const all = Array.from(byAuthor.values());
    await Promise.all(all.flatMap((b) => b.stories.map(async (s) => { s.resolved = await resolveMediaUrl(s.media_url); })));
    // Move "me" first
    all.sort((a, b) => (a.author_id === me ? -1 : b.author_id === me ? 1 : 0));
    setBundles(all);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [me]);

  const openBundle = (i: number) => setViewer({ bundleIdx: i, storyIdx: 0 });
  const closeViewer = () => setViewer(null);
  const next = () => {
    if (!viewer) return;
    const b = bundles[viewer.bundleIdx];
    if (viewer.storyIdx + 1 < b.stories.length) setViewer({ ...viewer, storyIdx: viewer.storyIdx + 1 });
    else if (viewer.bundleIdx + 1 < bundles.length) setViewer({ bundleIdx: viewer.bundleIdx + 1, storyIdx: 0 });
    else closeViewer();
  };
  const prev = () => {
    if (!viewer) return;
    if (viewer.storyIdx > 0) setViewer({ ...viewer, storyIdx: viewer.storyIdx - 1 });
    else if (viewer.bundleIdx > 0) {
      const b = bundles[viewer.bundleIdx - 1];
      setViewer({ bundleIdx: viewer.bundleIdx - 1, storyIdx: b.stories.length - 1 });
    }
  };

  const myBundleIdx = bundles.findIndex((b) => b.author_id === me);

  return (
    <div className="glass rounded-3xl p-3 shadow-soft">
      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
        {/* Add-story tile */}
        <button onClick={() => setComposerOpen(true)} className="shrink-0 flex flex-col items-center gap-1.5 group">
          <div className="relative h-16 w-16 rounded-full bg-muted/60 flex items-center justify-center border-2 border-dashed border-primary/50 group-hover:border-primary transition">
            <Plus className="h-5 w-5 text-primary" />
          </div>
          <span className="text-[11px] text-muted-foreground">Your story</span>
        </button>
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shrink-0 h-16 w-16 rounded-full bg-muted/50 animate-pulse" />
            ))
          : bundles.map((b, i) => {
              const id = displayIdentity({ ...b.author, id: b.author_id }, me);
              return (
                <button key={b.author_id} onClick={() => openBundle(i)} className="shrink-0 flex flex-col items-center gap-1.5">
                  <div className="rounded-full p-[2px] bg-gradient-to-tr from-fuchsia-500 via-amber-500 to-rose-500">
                    <div className="h-16 w-16 rounded-full overflow-hidden bg-card flex items-center justify-center text-sm font-bold">
                      {id.isIncognito ? <EyeOff className="h-5 w-5" /> :
                        id.avatar_url ? <img src={id.avatar_url} className="h-full w-full object-cover" alt="" /> :
                        <span>{id.initial}</span>}
                    </div>
                  </div>
                  <span className="text-[11px] text-muted-foreground truncate max-w-[68px]">
                    {b.author_id === me ? "You" : id.name.split(" ")[0]}
                  </span>
                </button>
              );
            })}
      </div>

      <StoryComposer
        open={composerOpen}
        onOpenChange={setComposerOpen}
        onPosted={async () => { setComposerOpen(false); await load(); if (myBundleIdx >= 0) openBundle(0); }}
        me={me}
      />

      <AnimatePresence>
        {viewer && (
          <StoryViewer
            bundle={bundles[viewer.bundleIdx]}
            storyIdx={viewer.storyIdx}
            onNext={next}
            onPrev={prev}
            onClose={closeViewer}
            me={me}
            onDeleted={async (storyId) => {
              await load();
              setViewer(null);
              toast.success("Story removed");
              void storyId;
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StoryComposer({ open, onOpenChange, onPosted, me }: {
  open: boolean; onOpenChange: (v: boolean) => void; onPosted: () => void; me: string | null;
}) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [stagedPath, setStagedPath] = useState<string | null>(null);
  const [stagedKind, setStagedKind] = useState<"image" | "video">("image");

  useEffect(() => {
    if (!open) { setCaption(""); setPreviewUrl(null); setStagedPath(null); }
  }, [open]);

  const pick = async (file: File | null) => {
    if (!file || !me) return;
    setBusy(true);
    try {
      const m = await uploadFeedMedia(file);
      setStagedPath(m.path);
      setStagedKind(m.kind);
      setPreviewUrl(m.signedUrl);
    } catch (e: any) { toast.error(e?.message ?? "Upload failed"); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!stagedPath || !me) return;
    setBusy(true);
    const { error } = await supabase.from("stories").insert({
      author_id: me,
      media_url: `feed-media:${stagedPath}`,
      media_type: stagedKind,
      caption: caption.trim() || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Story shared · 24h");
    onPosted();
  };

  if (!open) return null;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={() => onOpenChange(false)}
    >
      <motion.div
        initial={{ y: 20, scale: 0.96 }} animate={{ y: 0, scale: 1 }} exit={{ y: 20, scale: 0.96 }}
        className="bg-card rounded-3xl border border-border w-full max-w-md p-5 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">New story</h3>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground"><X className="h-4 w-4" /></button>
        </div>
        {previewUrl ? (
          <div className="rounded-2xl overflow-hidden bg-black aspect-[9/16] max-h-[60vh] flex items-center justify-center">
            {stagedKind === "video"
              ? <video src={previewUrl} controls className="max-h-full max-w-full" />
              : <img src={previewUrl} alt="" className="max-h-full max-w-full object-contain" />}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Pick a photo or video to share for 24 hours.
          </div>
        )}
        <Input placeholder="Caption (optional)" value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={140} />
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy} onClick={() => galleryRef.current?.click()}>Gallery</Button>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => cameraRef.current?.click()}>Camera</Button>
          <div className="flex-1" />
          <Button onClick={publish} disabled={!stagedPath || busy}
            className="bg-gradient-brand text-primary-foreground border-0">
            {busy ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : null} Share
          </Button>
        </div>
        <input ref={galleryRef} type="file" accept="image/*,video/*" className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)} />
      </motion.div>
    </motion.div>
  );
}

function StoryViewer({ bundle, storyIdx, onNext, onPrev, onClose, me, onDeleted }: {
  bundle: Bundle; storyIdx: number; onNext: () => void; onPrev: () => void; onClose: () => void;
  me: string | null; onDeleted: (id: string) => void;
}) {
  const story = bundle.stories[storyIdx];
  const id = useMemo(() => displayIdentity({ ...bundle.author, id: bundle.author_id }, me), [bundle, me]);
  const isOwner = me === bundle.author_id;
  const DURATION = story?.media_type === "video" ? 8000 : 5000;

  // Auto-advance
  useEffect(() => {
    if (!story) return;
    const t = setTimeout(onNext, DURATION);
    return () => clearTimeout(t);
  }, [story?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!story) return null;

  const del = async () => {
    if (!confirm("Delete this story?")) return;
    const { error } = await supabase.from("stories").delete().eq("id", story.id);
    if (error) return toast.error(error.message);
    onDeleted(story.id);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black flex items-center justify-center"
    >
      {/* Progress bars */}
      <div className="absolute top-3 left-3 right-3 flex gap-1 z-10">
        {bundle.stories.map((_, i) => (
          <div key={i} className="flex-1 h-1 bg-white/25 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-white"
              initial={{ width: i < storyIdx ? "100%" : "0%" }}
              animate={{ width: i === storyIdx ? "100%" : i < storyIdx ? "100%" : "0%" }}
              transition={{ duration: i === storyIdx ? DURATION / 1000 : 0, ease: "linear" }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="absolute top-7 left-3 right-3 flex items-center gap-2 z-10 text-white">
        <div className="h-8 w-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-xs font-bold">
          {id.isIncognito ? <EyeOff className="h-3.5 w-3.5" /> :
            id.avatar_url ? <img src={id.avatar_url} className="h-full w-full object-cover" alt="" /> : id.initial}
        </div>
        <div className="text-sm font-medium">{id.name}</div>
        <div className="text-xs opacity-70">{new Date(story.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="flex-1" />
        {isOwner && (
          <button onClick={del} className="opacity-80 hover:opacity-100"><Trash2 className="h-4 w-4" /></button>
        )}
        <button onClick={onClose}><X className="h-5 w-5" /></button>
      </div>

      {/* Media */}
      <div className="relative w-full h-full max-w-md mx-auto flex items-center justify-center">
        {story.media_type === "video" ? (
          <video src={story.resolved ?? ""} autoPlay playsInline className="max-h-full max-w-full" />
        ) : (
          <img src={story.resolved ?? ""} alt="" className="max-h-full max-w-full object-contain" />
        )}
        {story.caption && (
          <div className="absolute bottom-10 left-4 right-4 text-white text-sm bg-black/40 backdrop-blur rounded-2xl px-3 py-2">
            {story.caption}
          </div>
        )}
        {/* Tap zones */}
        <button onClick={onPrev} className="absolute left-0 top-0 bottom-0 w-1/3" aria-label="Previous">
          <ChevronLeft className="absolute left-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
        </button>
        <button onClick={onNext} className="absolute right-0 top-0 bottom-0 w-1/3" aria-label="Next">
          <ChevronRight className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 text-white/40" />
        </button>
      </div>
    </motion.div>
  );
}

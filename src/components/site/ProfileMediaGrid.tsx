import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Loader2, X, Play, ImagePlus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
import { uploadFeedMedia, resolveMediaUrl } from "@/lib/upload";

type PostRow = {
  id: string;
  body: string;
  image_url: string | null;
  created_at: string;
  author_id: string;
};

type GridItem = PostRow & { resolved: string | null; kind: "image" | "video" };

function detectKind(url: string): "image" | "video" {
  const u = url.toLowerCase();
  if (u.match(/\.(mp4|webm|mov|m4v)(\?|$)/)) return "video";
  return "image";
}

export function ProfileMediaGrid({
  userId,
  isOwner,
  onCountChange,
}: {
  userId: string;
  isOwner: boolean;
  onCountChange?: (n: number) => void;
}) {
  const [items, setItems] = useState<GridItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<GridItem | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);

  const hydrate = async (rows: PostRow[]): Promise<GridItem[]> => {
    return Promise.all(
      rows.map(async (r) => {
        const resolved = r.image_url ? await resolveMediaUrl(r.image_url) : null;
        return { ...r, resolved, kind: resolved ? detectKind(resolved) : "image" };
      })
    );
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("posts")
      .select("id, body, image_url, created_at, author_id")
      .eq("author_id", userId)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(60);
    const hydrated = await hydrate((data as PostRow[]) ?? []);
    setItems(hydrated);
    onCountChange?.(hydrated.length);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const onCreated = (row: PostRow) => {
    hydrate([row]).then(([g]) => {
      setItems((prev) => {
        const next = [g, ...prev.filter((x) => x.id !== g.id)];
        onCountChange?.(next.length);
        return next;
      });
    });
  };

  const deletePost = async (id: string) => {
    const prev = items;
    const next = items.filter((x) => x.id !== id);
    setItems(next);
    onCountChange?.(next.length);
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      setItems(prev);
      onCountChange?.(prev.length);
      toast.error(error.message);
    } else {
      setOpen(false);
    }
  };

  return (
    <div className="rounded-3xl bg-card border border-border p-4 md:p-5 shadow-pop">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-white tracking-wide">Media</h2>
        {isOwner && (
          <Button
            onClick={() => setUploadOpen(true)}
            size="sm"
            className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1" /> New post
          </Button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-3 gap-1 md:gap-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-md bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="py-14 text-center text-sm text-muted-foreground">
          {isOwner ? "You haven't posted any photos or videos yet." : "No posts to show yet."}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-1 md:gap-1.5">
          {items.map((it) => (
            <button
              key={it.id}
              onClick={() => { setSelected(it); setOpen(true); }}
              className="relative aspect-square overflow-hidden rounded-md bg-muted/50 group focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {it.resolved ? (
                it.kind === "video" ? (
                  <>
                    <video src={it.resolved} className="h-full w-full object-cover" muted playsInline />
                    <div className="absolute top-1.5 right-1.5 rounded-full bg-black/60 p-1">
                      <Play className="h-3 w-3 text-white fill-white" />
                    </div>
                  </>
                ) : (
                  <img src={it.resolved} alt="" className="h-full w-full object-cover" loading="lazy" />
                )
              ) : (
                <div className="grid place-items-center h-full text-muted-foreground text-xs">no media</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition" />
            </button>
          ))}
        </div>
      )}

      <Lightbox
        open={open}
        item={selected}
        canDelete={!!(selected && isOwner)}
        onDelete={() => selected && deletePost(selected.id)}
        onClose={() => setOpen(false)}
      />

      {isOwner && (
        <NewPostDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onCreated={onCreated}
        />
      )}
    </div>
  );
}

function Lightbox({
  open, item, onClose, canDelete, onDelete,
}: {
  open: boolean; item: GridItem | null; onClose: () => void;
  canDelete: boolean; onDelete: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl bg-card border border-border p-0 overflow-hidden">
        {item?.resolved && (
          <div className="bg-black">
            {item.kind === "video" ? (
              <video src={item.resolved} controls autoPlay className="w-full max-h-[70vh] bg-black" />
            ) : (
              <img src={item.resolved} alt="" className="w-full max-h-[70vh] object-contain bg-black" />
            )}
          </div>
        )}
        <div className="p-4 space-y-2 text-white">
          {item?.body && <p className="text-sm whitespace-pre-wrap break-words">{item.body}</p>}
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {item ? new Date(item.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : ""}
            </span>
            {canDelete && (
              <Button size="sm" variant="ghost" onClick={onDelete} className="text-red-400 hover:text-red-300 hover:bg-red-500/10">
                <X className="h-4 w-4 mr-1" /> Delete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function NewPostDialog({
  open, onOpenChange, onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (row: PostRow) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!file) { setPreviewUrl(null); return; }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const reset = () => {
    setFile(null); setCaption(""); setSubmitting(false);
  };

  const submit = async () => {
    if (!file) return toast.error("Pick a photo or video first");
    setSubmitting(true);
    try {
      const media = await uploadFeedMedia(file);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) throw new Error("Sign in required");
      const { data, error } = await supabase
        .from("posts")
        .insert({
          author_id: u.user.id,
          body: caption.trim(),
          image_url: `feed-media:${media.path}`,
        } as never)
        .select("id, body, image_url, created_at, author_id")
        .single();
      if (error || !data) throw error ?? new Error("Failed to save post");
      onCreated(data as PostRow);
      toast.success("Posted");
      onOpenChange(false);
      reset();
    } catch (e: any) {
      toast.error(e?.message ?? "Upload failed");
      setSubmitting(false);
    }
  };

  const kind: "image" | "video" = file?.type.startsWith("video/") ? "video" : "image";

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-lg bg-card border border-border">
        <h3 className="text-lg font-bold">New post</h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        {previewUrl ? (
          <div className="rounded-xl overflow-hidden bg-muted/50 border border-border">
            {kind === "video" ? (
              <video src={previewUrl} controls className="max-h-72 w-full" />
            ) : (
              <img src={previewUrl} alt="" className="max-h-72 w-full object-cover" />
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl border border-dashed border-border py-12 grid place-items-center text-muted-foreground hover:text-foreground  transition"
          >
            <ImagePlus className="h-8 w-8 mb-2" />
            <span className="text-sm">Choose photo or video</span>
          </button>
        )}
        {file && (
          <Button variant="ghost" size="sm" onClick={() => setFile(null)} className="w-fit text-muted-foreground hover:text-foreground">
            <X className="h-3.5 w-3.5 mr-1" /> Change file
          </Button>
        )}
        <Textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption…"
          rows={3}
          maxLength={500}
          className=""
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || !file}
            className="bg-primary hover:bg-primary/90 text-primary-foreground border-0 shadow-sm"
          >
            {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

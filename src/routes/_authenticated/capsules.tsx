import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock, Unlock, Sparkles, Plus, Heart, Camera, Loader2, Trash2 } from "lucide-react";
import { uploadFeedMedia, resolveMediaUrl } from "@/lib/upload";

export const Route = createFileRoute("/_authenticated/capsules")({
  component: CapsulesPage,
});

type Capsule = {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  goal_karma: number;
  collected_karma: number;
  unlocked_at: string | null;
  media: { type: "image" | "text"; url?: string; text?: string }[] | null;
  created_at: string;
};

function CapsulesPage() {
  const [items, setItems] = useState<Capsule[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", goal: 100 });

  const load = async () => {
    const { data } = await supabase.from("time_capsules").select("*").order("created_at", { ascending: false });
    setItems((data ?? []) as Capsule[]);
  };
  useEffect(() => { load(); }, []);

  useEffect(() => {
    const ch = supabase
      .channel("capsules-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "time_capsules" }, (payload) => {
        const r = payload.new as Capsule;
        setItems((prev) => (prev ?? []).find((x) => x.id === r.id) ? prev : [r, ...(prev ?? [])]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "time_capsules" }, (payload) => {
        const r = payload.new as Capsule;
        setItems((prev) => (prev ?? []).map((x) => x.id === r.id ? r : x));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "time_capsules" }, (payload) => {
        const r = payload.old as Capsule;
        setItems((prev) => (prev ?? []).filter((x) => x.id !== r.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const create = async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (!form.title.trim()) return toast.error("Add a title");
    const { error } = await supabase.from("time_capsules").insert({
      owner_id: u.user.id,
      title: form.title.trim(),
      description: form.description.trim(),
      goal_karma: Math.max(1, form.goal),
    });
    if (error) return toast.error(error.message);
    setForm({ title: "", description: "", goal: 100 });
    setCreating(false);
    toast.success("Capsule created");
    load();
  };

  const contribute = async (c: Capsule, amount: number) => {
    const { error } = await supabase.rpc("contribute_to_capsule", { _capsule_id: c.id, _amount: amount });
    if (error) return toast.error(error.message);
    toast.success(`+${amount} karma added`);
    load();
  };

  return (
    <div className="space-y-6 pb-24 lg:pb-6 max-w-4xl mx-auto w-full">
      <header className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4 text-primary" /> Impact time-capsules
          </div>
          <h1 className="text-3xl font-bold mt-1">Goals that unlock together</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pool community karma toward a milestone. The capsule unlocks automatically.
          </p>
        </div>
        <Button onClick={() => setCreating((v) => !v)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="h-4 w-4 mr-1" /> New capsule
        </Button>
      </header>

      {creating && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-card border border-border p-5 shadow-soft space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="500 meals for shelters by December" />
          </div>
          <div>
            <Label className="text-xs">Description</Label>
            <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Karma goal</Label>
            <Input type="number" min={1} value={form.goal} onChange={(e) => setForm({ ...form, goal: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
            <Button onClick={create} className="bg-primary text-primary-foreground hover:bg-primary/90">Create</Button>
          </div>
        </motion.div>
      )}

      {items === null ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-card border border-border p-12 text-center shadow-soft">
          <Lock className="h-10 w-10 mx-auto text-muted-foreground" />
          <p className="mt-3 text-muted-foreground">No capsules yet. Create the first community goal.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {items.map((c) => {
            const pct = Math.min(100, Math.round((c.collected_karma / c.goal_karma) * 100));
            const unlocked = !!c.unlocked_at;
            return (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`relative rounded-3xl border p-5 shadow-soft overflow-hidden ${
                  unlocked ? "border-amber-400/60 bg-gradient-to-br from-amber-500/10 via-card to-primary/10" : "border-border bg-card"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{c.title}</h3>
                    {c.description && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{c.description}</p>}
                  </div>
                  {unlocked ? (
                    <Unlock className="h-5 w-5 text-amber-500 shrink-0" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                  )}
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{c.collected_karma} / {c.goal_karma} karma</span>
                    <span>{pct}%</span>
                  </div>
                  <Progress value={pct} />
                </div>
                {unlocked ? (
                  <div className="mt-4 space-y-3">
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-400/20 to-primary/20 text-sm border border-amber-400/40">
                      <div className="font-semibold mb-1">🎉 Unlocked!</div>
                      Unlocked on {new Date(c.unlocked_at!).toLocaleDateString()} — thank you, community.
                    </div>
                    <ProofGallery capsule={c} />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {[5, 10, 25].map((n) => (
                      <Button key={n} size="sm" variant="outline" onClick={() => contribute(c, n)}>
                        <Heart className="h-3.5 w-3.5 mr-1 text-red-500" /> +{n}
                      </Button>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

type Proof = { id: string; capsule_id: string; owner_id: string; image_url: string; caption: string | null; created_at: string };

function ProofGallery({ capsule }: { capsule: Capsule }) {
  const [me, setMe] = useState<string | null>(null);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [signed, setSigned] = useState<Record<string, string>>({});
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMe(data.user?.id ?? null));
  }, []);

  const load = async () => {
    const { data } = await supabase.from("capsule_proofs" as never).select("*").eq("capsule_id", capsule.id).order("created_at", { ascending: false });
    const rows = ((data ?? []) as unknown) as Proof[];
    setProofs(rows);
    const map: Record<string, string> = {};
    await Promise.all(rows.map(async (p) => {
      const url = await resolveMediaUrl(p.image_url);
      if (url) map[p.id] = url;
    }));
    setSigned(map);
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [capsule.id]);

  const isOwner = me === capsule.owner_id;

  const onFile = async (file: File) => {
    setUploading(true);
    try {
      const up = await uploadFeedMedia(file);
      const { error } = await supabase.from("capsule_proofs" as never).insert({
        capsule_id: capsule.id,
        owner_id: me,
        image_url: `feed-media:${up.path}`,
        caption: caption.trim() || null,
      } as never);
      if (error) throw error;
      setCaption("");
      toast.success("Proof of impact uploaded");
      load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = async (id: string) => {
    await supabase.from("capsule_proofs" as never).delete().eq("id", id);
    setProofs((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Proof of Impact</div>
      {proofs.length > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          {proofs.map((p) => (
            <div key={p.id} className="relative rounded-xl overflow-hidden border border-amber-400/30 bg-card group">
              {signed[p.id] ? (
                <img src={signed[p.id]} alt={p.caption ?? "proof"} className="w-full h-32 object-cover" />
              ) : <div className="w-full h-32 bg-muted animate-pulse" />}
              {p.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-2 py-1 truncate">{p.caption}</div>}
              {isOwner && (
                <button onClick={() => remove(p.id)} className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/60 text-white grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">No proof shared yet.</p>
      )}
      {isOwner && (
        <div className="rounded-2xl border border-dashed border-amber-400/50 p-3 space-y-2 bg-amber-500/[0.03]">
          <Input
            placeholder="Caption (optional)"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="h-8 text-xs"
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.currentTarget.value = ""; }}
          />
          <Button size="sm" disabled={uploading} onClick={() => fileRef.current?.click()} className="bg-primary text-primary-foreground hover:bg-primary/90 w-full">
            {uploading ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Camera className="h-3.5 w-3.5 mr-1" />}
            Upload proof image
          </Button>
        </div>
      )}
    </div>
  );
}

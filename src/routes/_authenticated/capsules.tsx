import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock, Unlock, Sparkles, Plus, Heart } from "lucide-react";

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
        <Button onClick={() => setCreating((v) => !v)} className="bg-gradient-brand text-primary-foreground border-0">
          <Plus className="h-4 w-4 mr-1" /> New capsule
        </Button>
      </header>

      {creating && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="glass rounded-3xl p-5 shadow-soft space-y-3">
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
            <Button onClick={create} className="bg-gradient-brand text-primary-foreground border-0">Create</Button>
          </div>
        </motion.div>
      )}

      {items === null ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-3xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center shadow-soft">
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
                  <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-amber-400/20 to-primary/20 text-sm">
                    <div className="font-semibold mb-1">🎉 Unlocked!</div>
                    Unlocked on {new Date(c.unlocked_at!).toLocaleDateString()} — thank you, community.
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

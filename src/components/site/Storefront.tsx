import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Store, Plus, ExternalLink, Trash2, Lock, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";

export type StorefrontItem = {
  id: string;
  owner_id: string;
  title: string;
  description: string | null;
  price_cents: number;
  currency: string;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
  is_active: boolean;
};

const fmt = (cents: number, currency: string) => {
  const v = (cents / 100).toLocaleString();
  if (currency === "INR") return `₹${v}`;
  if (currency === "USD") return `$${v}`;
  return `${v} ${currency}`;
};

export function Storefront({
  ownerId,
  canManage,
  unlocked,
}: {
  ownerId: string;
  /** Is the viewer the owner? */
  canManage: boolean;
  /** Does the owner have a Plus/Pro tier (gates the manage UI)? */
  unlocked: boolean;
}) {
  const [items, setItems] = useState<StorefrontItem[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    price: "",
    currency: "INR",
    image_url: "",
    link_url: "",
  });

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("storefront_items")
      .select("*")
      .eq("owner_id", ownerId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!cancelled) setItems((data ?? []) as StorefrontItem[]);
      });
    return () => {
      cancelled = true;
    };
  }, [ownerId]);

  const add = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from("storefront_items")
      .insert({
        owner_id: ownerId,
        title: draft.title.trim(),
        description: draft.description.trim() || null,
        price_cents: Math.round(parseFloat(draft.price || "0") * 100),
        currency: draft.currency,
        image_url: draft.image_url.trim() || null,
        link_url: draft.link_url.trim() || null,
      })
      .select()
      .single();
    setSaving(false);
    if (error) return toast.error(error.message);
    setItems((prev) => [(data as StorefrontItem), ...(prev ?? [])]);
    setDraft({ title: "", description: "", price: "", currency: "INR", image_url: "", link_url: "" });
    setAdding(false);
    toast.success("Added to your storefront");
  };

  const remove = async (id: string) => {
    setItems((prev) => (prev ?? []).filter((i) => i.id !== id));
    await supabase.from("storefront_items").delete().eq("id", id);
  };

  if (items === null) return <Skeleton className="h-40 rounded-3xl" />;

  if (items.length === 0 && !canManage) return null;

  return (
    <section className="rounded-3xl bg-card border border-border p-6 md:p-8 shadow-soft space-y-4">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
            <Store className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold leading-tight">Storefront</h2>
            <p className="text-xs text-muted-foreground">Products, services, links to support this helper.</p>
          </div>
        </div>
        {canManage && unlocked && (
          <Button size="sm" variant="outline" onClick={() => setAdding((v) => !v)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {adding ? "Cancel" : "Add"}
          </Button>
        )}
      </header>

      {canManage && !unlocked && (
        <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4 flex items-start gap-3">
          <Lock className="h-4 w-4 text-primary mt-0.5 shrink-0" />
          <div className="text-sm flex-1">
            <div className="font-medium">Storefronts are a Plus / Pro perk</div>
            <p className="text-muted-foreground text-xs mt-0.5">
              Upgrade to showcase products or services on your profile.
            </p>
            <Link to="/pricing" className="inline-block mt-2">
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm">
                See plans
              </Button>
            </Link>
          </div>
        </div>
      )}

      <AnimatePresence>
        {adding && unlocked && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border p-4 space-y-3 bg-card/50">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Title *</Label>
                  <Input
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    placeholder="e.g. 1:1 mentoring session"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="col-span-2">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={draft.price}
                      onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Curr.</Label>
                    <select
                      value={draft.currency}
                      onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
                      className="w-full h-10 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="INR">INR</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs">Description</Label>
                <Textarea
                  rows={2}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Short description"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Image URL</Label>
                  <Input
                    value={draft.image_url}
                    onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
                <div>
                  <Label className="text-xs">Link URL</Label>
                  <Input
                    value={draft.link_url}
                    onChange={(e) => setDraft({ ...draft, link_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </div>
              <Button
                size="sm"
                onClick={add}
                disabled={!draft.title.trim() || saving}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save item"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">
          {canManage ? "Nothing here yet. Add your first offering above." : "No items yet."}
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {items.map((it) => (
            <motion.div
              key={it.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="group relative rounded-2xl border border-border bg-card overflow-hidden hover:shadow-pop transition"
            >
              {it.image_url && (
                <img src={it.image_url} alt="" className="w-full aspect-video object-cover" />
              )}
              <div className="p-3 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium text-sm leading-tight">{it.title}</div>
                  <div className="text-sm font-bold text-primary shrink-0">
                    {it.price_cents > 0 ? fmt(it.price_cents, it.currency) : "Free"}
                  </div>
                </div>
                {it.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{it.description}</p>
                )}
                <div className="flex items-center justify-between pt-1">
                  {it.link_url ? (
                    <a
                      href={it.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-primary inline-flex items-center gap-1 hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span />
                  )}
                  {canManage && (
                    <button
                      onClick={() => remove(it.id)}
                      className="opacity-0 group-hover:opacity-100 transition text-muted-foreground hover:text-destructive"
                      aria-label="Delete item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </section>
  );
}

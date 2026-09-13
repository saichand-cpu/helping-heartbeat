import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { BriefcaseBusiness, MapPin, Phone, Globe, Instagram, Rocket, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business-promote")({ component: BusinessPromotePage });

type Sub = { tier: string; status: string; expires_at: string };

function BusinessPromotePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [business, setBusiness] = useState({ name: "", category: "", description: "", location: "", phone: "", website: "", instagram: "", image_url: "" });

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);
    const { data } = await supabase.from("subscriptions").select("tier, status, expires_at").eq("user_id", auth.user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setSub((data as Sub | null) ?? null);
  };
  useEffect(() => { void load(); }, []);

  const active = !!sub && sub.status === "active" && new Date(sub.expires_at) > new Date() && ["business", "pro"].includes(sub.tier);

  const publish = async () => {
    if (!userId) return;
    if (!active) { setCheckout(true); return; }
    if (!business.name.trim() || !business.description.trim()) { toast.error("Add your business name and promotion details"); return; }
    setSaving(true);
    const details = [business.location && `📍 ${business.location}`, business.phone && `☎ ${business.phone}`, business.website && `🌐 ${business.website}`, business.instagram && `Instagram: ${business.instagram}`].filter(Boolean).join(" · ");
    const { error } = await supabase.from("advertisements").insert({ title: business.name.trim(), description: `${business.description.trim()}${details ? `\n\n${details}` : ""}`, destination_url: business.website || "#", image_url: business.image_url || null, active: true, user_id: userId });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Business promotion is live");
    setBusiness({ name: "", category: "", description: "", location: "", phone: "", website: "", instagram: "", image_url: "" });
  };

  return <div className="mx-auto max-w-4xl space-y-6 pb-24">
    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
    <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6 md:p-8">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
      <Badge className="mb-3 rounded-full">HumanLink Business</Badge>
      <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Promote your business like social media.</h1>
      <p className="mt-2 max-w-2xl text-muted-foreground">Create your business profile, publish promotional content and reach people on HumanLink with one simple monthly plan.</p>
      <div className="mt-5 flex flex-wrap gap-3 text-sm"><span className="rounded-full bg-card border px-3 py-2">₹500 / month</span><span className="rounded-full bg-card border px-3 py-2">Promotion access</span><span className="rounded-full bg-card border px-3 py-2">Business details</span></div>
    </section>

    {!active && <section className="rounded-3xl border border-primary/20 bg-card p-6 shadow-soft"><div className="flex flex-col md:flex-row md:items-center justify-between gap-5"><div><div className="flex items-center gap-2 font-semibold"><Rocket className="h-5 w-5 text-primary" /> Start promoting</div><p className="mt-1 text-sm text-muted-foreground">Subscribe to HumanLink Business for ₹500/month to publish promotions.</p></div><Button onClick={() => setCheckout(true)} className="rounded-xl">Subscribe ₹500 / month</Button></div></section>}

    <section className="rounded-3xl border bg-card p-6 shadow-soft space-y-5">
      <div><h2 className="text-xl font-semibold">Business details</h2><p className="text-sm text-muted-foreground">These details appear with your promotion.</p></div>
      <div className="grid md:grid-cols-2 gap-4">
        <Input placeholder="Business name *" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
        <Input placeholder="Category (Cafe, Gym, Salon, etc.)" value={business.category} onChange={(e) => setBusiness({ ...business, category: e.target.value })} />
        <Input placeholder="Location / city" value={business.location} onChange={(e) => setBusiness({ ...business, location: e.target.value })} />
        <Input placeholder="Phone number" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
        <Input placeholder="Website URL" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} />
        <Input placeholder="Instagram username" value={business.instagram} onChange={(e) => setBusiness({ ...business, instagram: e.target.value })} />
        <Input className="md:col-span-2" placeholder="Promotion image URL (optional)" value={business.image_url} onChange={(e) => setBusiness({ ...business, image_url: e.target.value })} />
        <Textarea className="md:col-span-2" rows={5} placeholder="Promotion message — offer, launch, product, service, event, vacancy, etc. *" value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} />
      </div>
      <div className="rounded-2xl bg-muted/50 p-4 text-sm"><div className="font-medium flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Monthly promotion access</div><p className="text-xs text-muted-foreground mt-1">Your subscription is required before a promotional advertisement can be published.</p></div>
      <Button onClick={publish} disabled={saving} className="w-full rounded-xl h-11">{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}{active ? "Start Promotion" : "Subscribe & Start Promotion · ₹500/month"}</Button>
    </section>

    <section className="grid sm:grid-cols-2 gap-3">
      {[{ icon: BriefcaseBusiness, title: "Business profile", text: "Show what you do and how customers can reach you." }, { icon: Rocket, title: "Promotion feed", text: "Publish offers and announcements into HumanLink's promotional inventory." }, { icon: MapPin, title: "Local discovery", text: "Include your city or service area in every promotion." }, { icon: Instagram, title: "Social presence", text: "Add your Instagram and website to turn views into visits." }].map((x) => <div key={x.title} className="rounded-2xl border bg-card p-5"><x.icon className="h-5 w-5 text-primary" /><div className="mt-3 font-semibold">{x.title}</div><p className="mt-1 text-sm text-muted-foreground">{x.text}</p></div>)}
    </section>

    <RazorpayCheckoutModal open={checkout} defaultTier="business" onOpenChange={setCheckout} onSuccess={load} />
  </div>;
}

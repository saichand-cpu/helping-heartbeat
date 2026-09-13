import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, MapPin, Phone, Globe, Instagram, Rocket, CheckCircle2, Loader2, ArrowLeft, Eye, MousePointerClick, Users, Target, Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { RazorpayCheckoutModal } from "@/components/site/RazorpayCheckoutModal";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/business-promote")({ component: BusinessPromotePage });

type Sub = { tier: string; status: string; expires_at: string };
type Campaign = {
  id: string; title: string; description: string; destination_url: string; image_url: string | null;
  category: string | null; location: string | null; audience: string | null;
  starts_at: string | null; ends_at: string | null; campaign_status: string;
  views_count: number; reach_count: number; clicks_count: number; leads_count: number; created_at: string;
};

const EMPTY = { name: "", category: "", description: "", location: "", phone: "", website: "", instagram: "", image_url: "", audience: "Everyone", duration: "30" };

function BusinessPromotePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [sub, setSub] = useState<Sub | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [checkout, setCheckout] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [business, setBusiness] = useState(EMPTY);

  const load = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;
    setUserId(auth.user.id);
    const { data } = await supabase.from("subscriptions").select("tier, status, expires_at").eq("user_id", auth.user.id).eq("status", "active").order("created_at", { ascending: false }).limit(1).maybeSingle();
    setSub((data as Sub | null) ?? null);
    const ads = supabase.from("advertisements") as any;
    setLoadingCampaigns(true);
    const { data: rows, error } = await ads.select("*").eq("user_id", auth.user.id).order("created_at", { ascending: false });
    if (!error) setCampaigns((rows ?? []) as Campaign[]);
    setLoadingCampaigns(false);
  };

  useEffect(() => { void load(); }, []);

  const active = !!sub && sub.status === "active" && new Date(sub.expires_at) > new Date() && ["business", "pro"].includes(sub.tier);
  const totals = useMemo(() => campaigns.reduce((a, c) => ({ views: a.views + (c.views_count ?? 0), reach: a.reach + (c.reach_count ?? 0), clicks: a.clicks + (c.clicks_count ?? 0), leads: a.leads + (c.leads_count ?? 0) }), { views: 0, reach: 0, clicks: 0, leads: 0 }), [campaigns]);

  const publish = async () => {
    if (!userId) return;
    if (!active) { setCheckout(true); return; }
    if (!business.name.trim() || !business.description.trim()) { toast.error("Add your business name and promotion details"); return; }
    setSaving(true);
    const now = new Date();
    const ends = new Date(now.getTime() + Number(business.duration) * 24 * 60 * 60 * 1000);
    const details = [business.location && `📍 ${business.location}`, business.phone && `☎ ${business.phone}`, business.website && `🌐 ${business.website}`, business.instagram && `Instagram: ${business.instagram}`].filter(Boolean).join(" · ");
    const ads = supabase.from("advertisements") as any;
    const { data, error } = await ads.insert({
      title: business.name.trim(),
      description: `${business.description.trim()}${details ? `\n\n${details}` : ""}`,
      destination_url: business.website || "#", image_url: business.image_url || null, active: true, user_id: userId,
      category: business.category || null, location: business.location || null, audience: business.audience || "Everyone",
      starts_at: now.toISOString(), ends_at: ends.toISOString(), campaign_status: "active",
      views_count: 0, reach_count: 0, clicks_count: 0, leads_count: 0,
    }).select("*").single();
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    setCampaigns((prev) => [data as Campaign, ...prev]);
    setBusiness(EMPTY);
    toast.success("Promotion is live for your selected duration");
  };

  return <div className="mx-auto max-w-6xl space-y-6 pb-24">
    <Link to="/dashboard" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
    <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-accent/30 p-6 md:p-9">
      <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-end md:justify-between"><div>
        <Badge className="mb-3 rounded-full">HumanLink Business</Badge>
        <h1 className="text-3xl font-bold tracking-tight md:text-5xl">Promote your business like social media.</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">Create campaigns, reach the right audience and turn HumanLink discovery into customers, enquiries and visits.</p>
        <div className="mt-5 flex flex-wrap gap-2 text-sm"><span className="rounded-full border bg-card px-3 py-2 font-medium">₹500 / month</span><span className="rounded-full border bg-card px-3 py-2">Business profile</span><span className="rounded-full border bg-card px-3 py-2">Promotion feed</span><span className="rounded-full border bg-card px-3 py-2">Campaign insights</span></div>
      </div>{!active && <Button onClick={() => setCheckout(true)} size="lg" className="rounded-xl"><Rocket className="mr-2 h-4 w-4" /> Unlock Business · ₹500/month</Button>}</div>
    </section>

    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">{[[Eye, "Views", totals.views], [Users, "Reach", totals.reach], [MousePointerClick, "Clicks", totals.clicks], [Megaphone, "Leads", totals.leads]].map(([Icon, label, value]) => <div key={label as string} className="rounded-2xl border bg-card p-4 shadow-soft"><Icon className="h-5 w-5 text-primary" /><div className="mt-3 text-2xl font-bold">{value as number}</div><div className="text-xs text-muted-foreground">{label as string}</div></div>)}</section>

    <div className="grid gap-6 lg:grid-cols-[1.15fr_.85fr]">
      <section className="rounded-3xl border bg-card p-5 shadow-soft md:p-6">
        <div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Create promotion</h2><p className="text-sm text-muted-foreground">Build a social-style campaign in minutes.</p></div><Badge variant={active ? "default" : "secondary"}>{active ? "Business active" : "Subscription required"}</Badge></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input placeholder="Business name *" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} />
          <Input placeholder="Category (Cafe, Gym, Salon...)" value={business.category} onChange={(e) => setBusiness({ ...business, category: e.target.value })} />
          <Input placeholder="Location / city" value={business.location} onChange={(e) => setBusiness({ ...business, location: e.target.value })} />
          <Input placeholder="Phone number" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} />
          <Input placeholder="Website URL" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} />
          <Input placeholder="Instagram username" value={business.instagram} onChange={(e) => setBusiness({ ...business, instagram: e.target.value })} />
          <Input className="md:col-span-2" placeholder="Promotion image URL (optional)" value={business.image_url} onChange={(e) => setBusiness({ ...business, image_url: e.target.value })} />
          <Textarea className="md:col-span-2" rows={5} placeholder="Caption / promotion — offer, launch, product, service, event, vacancy... *" value={business.description} onChange={(e) => setBusiness({ ...business, description: e.target.value })} />
          <div className="space-y-2"><label className="text-sm font-medium">Audience</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={business.audience} onChange={(e) => setBusiness({ ...business, audience: e.target.value })}><option>Everyone</option><option>Students</option><option>Job seekers</option><option>Professionals</option><option>Business owners</option><option>Families</option><option>Local community</option></select></div>
          <div className="space-y-2"><label className="text-sm font-medium">Campaign duration</label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={business.duration} onChange={(e) => setBusiness({ ...business, duration: e.target.value })}><option value="7">7 days</option><option value="15">15 days</option><option value="30">30 days</option></select></div>
        </div>
        <div className="mt-5 rounded-2xl bg-muted/50 p-4 text-sm"><div className="flex items-center gap-2 font-medium"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Paid commercial publishing</div><p className="mt-1 text-xs text-muted-foreground">Your ₹500/month Business subscription unlocks commercial promotions. Campaigns automatically carry a start/end date.</p></div>
        <Button onClick={publish} disabled={saving} className="mt-5 h-11 w-full rounded-xl">{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}{active ? "Start Promotion" : "Subscribe & Start Promotion · ₹500/month"}</Button>
      </section>

      <section className="rounded-3xl border bg-card p-5 shadow-soft md:p-6"><div className="mb-4 flex items-center gap-2"><Target className="h-5 w-5 text-primary" /><h2 className="text-xl font-semibold">Live preview</h2></div><div className="overflow-hidden rounded-2xl border bg-background shadow-sm">
        <div className="flex items-center gap-3 p-4"><div className="grid h-10 w-10 place-items-center rounded-full bg-primary/10"><BriefcaseBusiness className="h-5 w-5 text-primary" /></div><div className="min-w-0"><div className="truncate font-semibold">{business.name || "Your Business"}</div><div className="text-xs text-muted-foreground">Sponsored · {business.category || "Business"}</div></div></div>
        {business.image_url ? <img src={business.image_url} alt="Promotion preview" className="aspect-[4/3] w-full object-cover" /> : <div className="grid aspect-[4/3] place-items-center bg-muted/50 text-sm text-muted-foreground">Add an image URL to preview your creative</div>}
        <div className="space-y-3 p-4"><p className="whitespace-pre-wrap text-sm">{business.description || "Your promotional caption will appear here."}</p><div className="flex flex-wrap gap-2 text-xs text-muted-foreground">{business.location && <span className="rounded-full bg-muted px-2 py-1"><MapPin className="mr-1 inline h-3 w-3" />{business.location}</span>}{business.phone && <span className="rounded-full bg-muted px-2 py-1"><Phone className="mr-1 inline h-3 w-3" />{business.phone}</span>}{business.instagram && <span className="rounded-full bg-muted px-2 py-1"><Instagram className="mr-1 inline h-3 w-3" />{business.instagram}</span>}</div><Button variant="outline" className="w-full rounded-xl" disabled>Learn more</Button></div>
      </div></section>
    </div>

    <section className="rounded-3xl border bg-card p-5 shadow-soft md:p-6"><div className="mb-5 flex items-center justify-between"><div><h2 className="text-xl font-semibold">Your campaigns</h2><p className="text-sm text-muted-foreground">Track every promotion from one place.</p></div><Badge variant="outline">{campaigns.length} campaign{campaigns.length === 1 ? "" : "s"}</Badge></div>
      {loadingCampaigns ? <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns...</div> : campaigns.length === 0 ? <div className="rounded-2xl border border-dashed p-8 text-center"><Megaphone className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">No campaigns yet</p><p className="mt-1 text-sm text-muted-foreground">Create your first promotion above and it will appear in the HumanLink feed.</p></div> : <div className="grid gap-4 md:grid-cols-2">{campaigns.map((c) => <article key={c.id} className="overflow-hidden rounded-2xl border bg-background"><div className="flex items-center justify-between gap-3 p-4"><div className="min-w-0"><div className="truncate font-semibold">{c.title}</div><div className="mt-1 text-xs text-muted-foreground">{c.category || "Business"}{c.location ? ` · ${c.location}` : ""}</div></div><Badge variant={c.campaign_status === "active" ? "default" : "secondary"}>{c.campaign_status}</Badge></div>{c.image_url && <img src={c.image_url} alt={c.title} className="aspect-video w-full object-cover" />}<div className="grid grid-cols-4 border-t"><div className="p-3 text-center"><div className="font-semibold">{c.views_count ?? 0}</div><div className="text-[10px] text-muted-foreground">Views</div></div><div className="border-l p-3 text-center"><div className="font-semibold">{c.reach_count ?? 0}</div><div className="text-[10px] text-muted-foreground">Reach</div></div><div className="border-l p-3 text-center"><div className="font-semibold">{c.clicks_count ?? 0}</div><div className="text-[10px] text-muted-foreground">Clicks</div></div><div className="border-l p-3 text-center"><div className="font-semibold">{c.leads_count ?? 0}</div><div className="text-[10px] text-muted-foreground">Leads</div></div></div><div className="border-t px-4 py-3 text-xs text-muted-foreground">{c.audience || "Everyone"} · {c.ends_at ? `Ends ${new Date(c.ends_at).toLocaleDateString()}` : "No end date"}</div></article>)}</div>}
    </section>

    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[{ icon: BriefcaseBusiness, title: "Business profile", text: "Show what you do and how customers can reach you." }, { icon: Rocket, title: "Promotion feed", text: "Publish offers and announcements into HumanLink's promotional inventory." }, { icon: MapPin, title: "Local discovery", text: "Target your city or service area." }, { icon: Globe, title: "Social presence", text: "Connect your website and Instagram to turn discovery into action." }].map((x) => <div key={x.title} className="rounded-2xl border bg-card p-5"><x.icon className="h-5 w-5 text-primary" /><div className="mt-3 font-semibold">{x.title}</div><p className="mt-1 text-sm text-muted-foreground">{x.text}</p></div>)}</section>
    <RazorpayCheckoutModal open={checkout} defaultTier="business" onOpenChange={setCheckout} onSuccess={load} />
  </div>;
}

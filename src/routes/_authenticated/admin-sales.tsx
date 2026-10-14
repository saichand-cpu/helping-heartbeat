import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Lock, RefreshCw, Plus, Package, Megaphone, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin-sales")({ component: AdminSalesPage });
type Row = Record<string, any>;

function AdminSalesPage() {
  const { isAdmin, loading } = useIsAdmin();
  if (loading) return <Skeleton className="h-48 w-full" />;
  if (!isAdmin) return <div className="mx-auto mt-12 max-w-lg rounded-3xl border p-12 text-center"><Lock className="mx-auto h-8 w-8 text-destructive"/><h1 className="mt-4 text-2xl font-bold">Admins only</h1><p className="mt-2 text-muted-foreground">Commercial records are restricted to authorised admins.</p><Link to="/dashboard"><Button className="mt-5" variant="outline">Back to dashboard</Button></Link></div>;
  return <SalesContent />;
}

function SalesContent() {
  const [packages, setPackages] = useState<Row[]>([]);
  const [leads, setLeads] = useState<Row[]>([]);
  const [campaigns, setCampaigns] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("business");
  const [price, setPrice] = useState("2999");
  const [period, setPeriod] = useState("monthly");
  const [description, setDescription] = useState("");
  const [leadName, setLeadName] = useState("");
  const [leadType, setLeadType] = useState("business");
  const [city, setCity] = useState("");
  const [setupError, setSetupError] = useState("");

  const load = useCallback(async () => {
    setBusy(true);
    const [p, l, c] = await Promise.all([
      supabase.from("hl_packages" as never).select("*").order("created_at", { ascending: false }),
      supabase.from("hl_sales_leads" as never).select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("hl_promotion_campaigns" as never).select("*").order("created_at", { ascending: false }).limit(100),
    ]);
    const errors = [p.error, l.error, c.error].filter(Boolean);
    if (errors.length) {
      setSetupError(errors.map(e => e?.message).join("; "));
      toast.error("Commercial data unavailable. Check migration and admin RLS.");
    } else {
      setSetupError("");
      setPackages((p.data ?? []) as unknown as Row[]);
      setLeads((l.data ?? []) as unknown as Row[]);
      setCampaigns((c.data ?? []) as unknown as Row[]);
    }
    setBusy(false);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const savePackage = async () => {
    if (!name.trim() || !Number.isFinite(Number(price)) || Number(price) < 0) { toast.error("Enter a package name and valid price."); return; }
    setSaving(true);
    const { error } = await supabase.from("hl_packages" as never).insert({ name: name.trim(), audience, description: description.trim(), price_inr: Math.round(Number(price)), billing_period: period, features: [], is_active: true } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Package created"); setName(""); setDescription(""); await load();
  };
  const saveLead = async () => {
    if (!leadName.trim()) { toast.error("Enter a business or organisation name."); return; }
    setSaving(true);
    const { error } = await supabase.from("hl_sales_leads" as never).insert({ organisation_name: leadName.trim(), account_type: leadType, city: city.trim() || null, source: "manual", stage: "new", lead_score: 0, contact_permission: false, contact_channel: "none" } as never);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Lead added; outreach permission remains off."); setLeadName(""); setCity(""); await load();
  };
  const money = (n: number) => "₹" + Number(n || 0).toLocaleString("en-IN");
  const metric = (label: string, value: number, Icon: any) => <div className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between text-sm text-muted-foreground"><span>{label}</span><Icon className="h-4 w-4"/></div><p className="mt-3 text-3xl font-bold">{busy ? "—" : value}</p></div>;

  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-sm text-muted-foreground">HumanLink Admin</p><h1 className="text-3xl font-bold tracking-tight">Sales & Promotions</h1><p className="mt-1 text-muted-foreground">Manage packages, sales leads and campaign reporting.</p></div><Button variant="outline" onClick={() => void load()} disabled={busy}><RefreshCw className="mr-2 h-4 w-4"/>Refresh</Button></header>
    {setupError && <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-4 text-sm">Commercial tables aren't accessible yet. Apply the reviewed Supabase migration and confirm administrator permissions. Details: {setupError}</div>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{metric("Active packages", packages.filter(p=>p.is_active).length, Package)}{metric("Leads", leads.length, Users)}{metric("Won leads", leads.filter(l=>l.stage==="won").length, Users)}{metric("Live campaigns", campaigns.filter(c=>c.status==="live").length, Megaphone)}</div>
    <div className="grid gap-6 xl:grid-cols-2">
      <section className="rounded-2xl border bg-card p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Package className="h-5 w-5"/>Create package</h2><p className="mt-1 text-sm text-muted-foreground">Set INR price and billing period.</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2"><div className="space-y-2 sm:col-span-2"><Label>Package name</Label><Input value={name} onChange={e=>setName(e.target.value)} placeholder="Business Growth"/></div><div className="space-y-2"><Label>Audience</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={audience} onChange={e=>setAudience(e.target.value)}><option value="business">Business</option><option value="ngo">NGO</option><option value="creator">Creator</option><option value="community">Community</option></select></div><div className="space-y-2"><Label>Price (₹)</Label><Input type="number" min="0" value={price} onChange={e=>setPrice(e.target.value)}/></div><div className="space-y-2 sm:col-span-2"><Label>Billing period</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={period} onChange={e=>setPeriod(e.target.value)}><option value="one_time">One time</option><option value="monthly">Monthly</option><option value="quarterly">Quarterly</option><option value="yearly">Yearly</option></select></div><div className="space-y-2 sm:col-span-2"><Label>Description</Label><Textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="What's included?"/></div></div>
        <Button className="mt-4" onClick={()=>void savePackage()} disabled={saving||busy}><Plus className="mr-2 h-4 w-4"/>Create package</Button>
        <div className="mt-5 space-y-2">{packages.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3"><div><p className="font-medium">{p.name}</p><p className="text-sm text-muted-foreground">{p.audience} · {p.billing_period}</p></div><div className="flex items-center gap-2"><span className="font-semibold">{money(p.price_inr)}</span><Badge variant={p.is_active?"default":"secondary"}>{p.is_active?"Active":"Inactive"}</Badge></div></div>)}</div>
      </section>
      <section className="rounded-2xl border bg-card p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Users className="h-5 w-5"/>Add sales lead</h2><p className="mt-1 text-sm text-muted-foreground">No unsolicited outreach; contact permission defaults to off.</p>
        <div className="mt-4 space-y-4"><div className="space-y-2"><Label>Organisation / business</Label><Input value={leadName} onChange={e=>setLeadName(e.target.value)} placeholder="Organisation name"/></div><div className="space-y-2"><Label>Account type</Label><select className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={leadType} onChange={e=>setLeadType(e.target.value)}><option value="business">Business</option><option value="ngo">NGO</option><option value="creator">Creator</option><option value="community">Community</option><option value="other">Other</option></select></div><div className="space-y-2"><Label>City</Label><Input value={city} onChange={e=>setCity(e.target.value)} placeholder="Hyderabad"/></div></div><Button className="mt-4" onClick={()=>void saveLead()} disabled={saving||busy}><Plus className="mr-2 h-4 w-4"/>Add lead</Button>
        <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="py-2 pr-3">Organisation</th><th className="py-2 pr-3">Stage</th><th className="py-2">Score</th></tr></thead><tbody>{leads.map(l=><tr key={l.id} className="border-b last:border-0"><td className="py-3 pr-3"><p className="font-medium">{l.organisation_name}</p><p className="text-xs text-muted-foreground">{l.city||l.account_type}</p></td><td className="py-3 pr-3"><Badge variant="secondary">{l.stage}</Badge></td><td className="py-3">{l.lead_score}</td></tr>)}</tbody></table>{!busy&&leads.length===0&&<p className="py-5 text-sm text-muted-foreground">No leads yet.</p>}</div>
      </section>
    </div>
    <section className="rounded-2xl border bg-card p-5"><h2 className="flex items-center gap-2 text-xl font-semibold"><Megaphone className="h-5 w-5"/>Promotion performance</h2><div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="border-b text-muted-foreground"><th className="py-2 pr-3">Campaign</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Impressions</th><th className="py-2 pr-3">Clicks</th><th className="py-2 pr-3">Enquiries</th><th className="py-2">Conversions</th></tr></thead><tbody>{campaigns.map(c=><tr key={c.id} className="border-b last:border-0"><td className="py-3 pr-3 font-medium">{c.title}</td><td className="py-3 pr-3"><Badge variant={c.status==="live"?"default":"secondary"}>{c.status}</Badge></td><td className="py-3 pr-3">{Number(c.impressions||0).toLocaleString("en-IN")}</td><td className="py-3 pr-3">{Number(c.clicks||0).toLocaleString("en-IN")}</td><td className="py-3 pr-3">{Number(c.enquiries||0).toLocaleString("en-IN")}</td><td className="py-3">{Number(c.conversions||0).toLocaleString("en-IN")}</td></tr>)}</tbody></table>{!busy&&campaigns.length===0&&<p className="py-5 text-sm text-muted-foreground">No campaigns yet.</p>}</div></section>
  </div>;
}

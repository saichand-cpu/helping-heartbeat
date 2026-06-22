import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-role";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Users, HeartHandshake, CreditCard, Banknote, Plus, Trash2, Save, Lock,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPage,
});

type Plan = {
  id: string;
  name: string;
  price_cents: number;
  currency: string;
  interval: string;
  features: string[];
  is_active: boolean;
  sort_order: number;
};

type PaymentSettings = {
  id: string;
  bank_name: string | null;
  account_holder: string | null;
  account_number: string | null;
  ifsc_code: string | null;
  upi_id: string | null;
  qr_image_url: string | null;
  instructions: string | null;
};

function AdminPage() {
  const { isAdmin, loading } = useIsAdmin();

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="glass rounded-3xl p-12 text-center shadow-soft max-w-lg mx-auto mt-12">
        <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h1 className="mt-6 text-2xl font-bold">Access Denied</h1>
        <p className="mt-2 text-muted-foreground">
          You do not have permission to access this page.
        </p>
        <Link to="/dashboard" className="inline-block mt-6">
          <Button variant="outline">Back to dashboard</Button>
        </Link>
      </div>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            <h1 className="text-3xl font-bold">Admin</h1>
            <Badge className="bg-gradient-brand text-primary-foreground border-0">Owner</Badge>
          </div>
          <p className="text-muted-foreground text-sm">Manage users, content, plans, and payment details.</p>
        </div>
      </header>

      <StatsRow />

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList className="glass">
          <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" /> Users</TabsTrigger>
          <TabsTrigger value="requests"><HeartHandshake className="h-4 w-4 mr-1" /> Requests</TabsTrigger>
          <TabsTrigger value="plans"><CreditCard className="h-4 w-4 mr-1" /> Plans</TabsTrigger>
          <TabsTrigger value="payment"><Banknote className="h-4 w-4 mr-1" /> Payment</TabsTrigger>
        </TabsList>
        <TabsContent value="users"><UsersPanel /></TabsContent>
        <TabsContent value="requests"><RequestsPanel /></TabsContent>
        <TabsContent value="plans"><PlansPanel /></TabsContent>
        <TabsContent value="payment"><PaymentPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsRow() {
  const [stats, setStats] = useState({ users: 0, requests: 0, completed: 0, pending: 0 });
  useEffect(() => {
    (async () => {
      const [u, r, c, p] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("help_requests").select("*", { count: "exact", head: true }),
        supabase.from("help_requests").select("*", { count: "exact", head: true }).eq("status", "completed"),
        supabase.from("help_requests").select("*", { count: "exact", head: true }).eq("status", "open"),
      ]);
      setStats({
        users: u.count ?? 0,
        requests: r.count ?? 0,
        completed: c.count ?? 0,
        pending: p.count ?? 0,
      });
    })();
  }, []);
  const items = [
    { label: "Total users", value: stats.users },
    { label: "Total requests", value: stats.requests },
    { label: "Completed", value: stats.completed },
    { label: "Open", value: stats.pending },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {items.map((i) => (
        <div key={i.label} className="glass rounded-2xl p-5 shadow-soft">
          <div className="text-xs text-muted-foreground uppercase tracking-wide">{i.label}</div>
          <div className="mt-1 text-3xl font-bold">{i.value}</div>
        </div>
      ))}
    </div>
  );
}

function UsersPanel() {
  const [users, setUsers] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, karma_points, created_at, user_roles(role)")
      .order("created_at", { ascending: false })
      .limit(100);
    setUsers(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const filtered = users.filter((u) =>
    !q || (u.full_name ?? "").toLowerCase().includes(q.toLowerCase())
  );

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", "admin");
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role: "admin" });
    }
    toast.success(isAdmin ? "Admin removed" : "Promoted to admin");
    load();
  };

  return (
    <div className="glass rounded-2xl p-5 shadow-soft space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Search users..." value={q} onChange={(e) => setQ(e.target.value)} className="max-w-sm" />
        <div className="ml-auto text-sm text-muted-foreground">{filtered.length} users</div>
      </div>
      {loading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <div className="divide-y divide-border">
          {filtered.map((u) => {
            const isAdmin = (u.user_roles ?? []).some((r: any) => r.role === "admin");
            return (
              <div key={u.id} className="flex items-center gap-3 py-3">
                <div className="h-10 w-10 rounded-full bg-gradient-brand flex items-center justify-center text-primary-foreground text-sm font-bold">
                  {(u.full_name ?? "?").charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{u.full_name ?? "Unnamed"}</div>
                  <div className="text-xs text-muted-foreground">Karma {u.karma_points ?? 0}</div>
                </div>
                {isAdmin && <Badge variant="secondary">Admin</Badge>}
                <Button size="sm" variant="outline" onClick={() => toggleAdmin(u.id, isAdmin)}>
                  {isAdmin ? "Demote" : "Promote"}
                </Button>
              </div>
            );
          })}
          {filtered.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No users found.</div>}
        </div>
      )}
    </div>
  );
}

function RequestsPanel() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("help_requests")
      .select("id, title, category, urgency, status, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    setItems(data ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const setStatus = async (id: string, status: "completed" | "open" | "accepted" | "cancelled") => {
    await supabase.from("help_requests").update({ status }).eq("id", id);
    toast.success(`Marked ${status}`);
    load();
  };
  const remove = async (id: string) => {
    if (!confirm("Delete this request?")) return;
    await supabase.from("help_requests").delete().eq("id", id);
    toast.success("Deleted");
    load();
  };

  if (loading) return <Skeleton className="h-40 w-full" />;
  return (
    <div className="glass rounded-2xl p-5 shadow-soft divide-y divide-border">
      {items.map((r) => (
        <div key={r.id} className="flex items-center gap-3 py-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{r.title}</div>
            <div className="text-xs text-muted-foreground">{r.category} · {r.urgency}</div>
          </div>
          <Badge variant={r.status === "completed" ? "default" : "secondary"}>{r.status}</Badge>
          <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "completed")}>Complete</Button>
          <Button size="sm" variant="ghost" onClick={() => remove(r.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      {items.length === 0 && <div className="text-sm text-muted-foreground py-6 text-center">No requests.</div>}
    </div>
  );
}

function PlansPanel() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("premium_plans").select("*").order("sort_order");
    setPlans((data ?? []) as Plan[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const update = (id: string, patch: Partial<Plan>) =>
    setPlans((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const save = async (p: Plan) => {
    const { error } = await supabase.from("premium_plans").update({
      name: p.name,
      price_cents: p.price_cents,
      currency: p.currency,
      interval: p.interval,
      features: p.features,
      is_active: p.is_active,
      sort_order: p.sort_order,
    }).eq("id", p.id);
    if (error) toast.error(error.message);
    else toast.success("Plan saved");
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    await supabase.from("premium_plans").delete().eq("id", id);
    load();
  };

  const add = async () => {
    const { error } = await supabase.from("premium_plans").insert({
      name: "New plan",
      price_cents: 0,
      currency: "INR",
      interval: "month",
      features: [],
      sort_order: plans.length + 1,
    });
    if (error) toast.error(error.message);
    else load();
  };

  if (loading) return <Skeleton className="h-60 w-full" />;
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={add} className="bg-gradient-brand text-primary-foreground border-0">
          <Plus className="h-4 w-4 mr-1" /> Add plan
        </Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.id} className="glass rounded-2xl p-5 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <Input value={p.name} onChange={(e) => update(p.id, { name: e.target.value })} className="font-semibold" />
              <Switch checked={p.is_active} onCheckedChange={(v) => update(p.id, { is_active: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Price (paise/cents)</Label>
                <Input type="number" value={p.price_cents} onChange={(e) => update(p.id, { price_cents: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Currency</Label>
                <Input value={p.currency} onChange={(e) => update(p.id, { currency: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Interval</Label>
                <Input value={p.interval} onChange={(e) => update(p.id, { interval: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Sort</Label>
                <Input type="number" value={p.sort_order} onChange={(e) => update(p.id, { sort_order: Number(e.target.value) })} />
              </div>
            </div>
            <div>
              <Label className="text-xs">Features (one per line)</Label>
              <Textarea
                rows={4}
                value={(p.features ?? []).join("\n")}
                onChange={(e) => update(p.id, { features: e.target.value.split("\n").filter(Boolean) })}
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => save(p)} className="bg-gradient-brand text-primary-foreground border-0 flex-1">
                <Save className="h-4 w-4 mr-1" /> Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(p.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PaymentPanel() {
  const [s, setS] = useState<PaymentSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("payment_settings").select("*").limit(1).maybeSingle();
      setS(data as PaymentSettings);
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    if (!s) return;
    const { error } = await supabase.from("payment_settings").update({
      bank_name: s.bank_name,
      account_holder: s.account_holder,
      account_number: s.account_number,
      ifsc_code: s.ifsc_code,
      upi_id: s.upi_id,
      qr_image_url: s.qr_image_url,
      instructions: s.instructions,
    }).eq("id", s.id);
    if (error) toast.error(error.message);
    else toast.success("Payment settings saved — changes are live");
  };

  if (loading || !s) return <Skeleton className="h-60 w-full" />;

  const field = (k: keyof PaymentSettings, label: string, type = "text") => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Input type={type} value={(s[k] as string) ?? ""} onChange={(e) => setS({ ...s, [k]: e.target.value })} />
    </div>
  );

  return (
    <div className="glass rounded-2xl p-6 shadow-soft space-y-4 max-w-3xl">
      <div className="grid md:grid-cols-2 gap-3">
        {field("bank_name", "Bank name")}
        {field("account_holder", "Account holder")}
        {field("account_number", "Account number")}
        {field("ifsc_code", "IFSC code")}
        {field("upi_id", "UPI ID")}
        {field("qr_image_url", "QR image URL")}
      </div>
      <div>
        <Label className="text-xs">Payment instructions</Label>
        <Textarea rows={4} value={s.instructions ?? ""} onChange={(e) => setS({ ...s, instructions: e.target.value })} />
      </div>
      <Button onClick={save} className="bg-gradient-brand text-primary-foreground border-0">
        <Save className="h-4 w-4 mr-1" /> Save settings
      </Button>
    </div>
  );
}

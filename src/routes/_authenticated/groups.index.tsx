import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Plus, Search, ShieldCheck, Siren, Users, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { GROUP_CATEGORIES, GROUP_TYPES, categoryEmoji, categoryLabel, fetchMemberCounts, joinGroup, type Group } from "@/lib/groups";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/groups/")({
  head: () => ({
    meta: [
      { title: "Groups — HumanLink Communities" },
      { name: "description", content: "Join HumanLink communities for volunteering, NGOs, emergencies and neighbourhood help." },
      { property: "og:title", content: "Groups — HumanLink Communities" },
      { property: "og:description", content: "Join HumanLink communities for volunteering, NGOs, emergencies and neighbourhood help." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GroupsPage,
});

function GroupsPage() {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [groups, setGroups] = useState<Group[]>([]);
  const [memberships, setMemberships] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: gs }, { data: ms }] = await Promise.all([
      supabase.from("groups").select("*").order("created_at", { ascending: false }).limit(200),
      me ? supabase.from("group_members").select("group_id, status").eq("user_id", me) : Promise.resolve({ data: [] as never[] }),
    ]);
    const list = (gs ?? []) as unknown as Group[];
    setGroups(list);
    setMemberships(Object.fromEntries(((ms ?? []) as { group_id: string; status: string }[]).map((m) => [m.group_id, m.status])));
    setCounts(await fetchMemberCounts(list.map((g) => g.id)));
    setLoading(false);
  };

  useEffect(() => { void load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [me]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return groups.filter((g) => {
      if (tab === "mine" && !memberships[g.id]) return false;
      if (cat !== "all" && g.category !== cat) return false;
      if (!term) return true;
      return [g.name, g.description, g.location].filter(Boolean).some((v) => v!.toLowerCase().includes(term));
    });
  }, [groups, memberships, tab, cat, q]);

  const join = async (g: Group) => {
    if (!me) return;
    try {
      const status = await joinGroup(g, me);
      setMemberships((m) => ({ ...m, [g.id]: status }));
      setCounts((c) => ({ ...c, [g.id]: (c[g.id] ?? 0) + (status === "active" ? 1 : 0) }));
      toast.success(status === "pending" ? "Request sent to the admins" : `Joined ${g.name}`);
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Groups</h1>
          <p className="text-sm text-muted-foreground">Communities that help each other — volunteers, NGOs, neighbourhoods.</p>
        </div>
        <CreateGroupDialog me={me} onCreated={load} />
      </div>

      <div className="rounded-2xl border border-border bg-card p-3 shadow-soft space-y-3">
        <div className="flex flex-wrap gap-2">
          {(["discover", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "discover" ? "Discover" : "My groups"}
            </button>
          ))}
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search groups" className="pl-9 rounded-xl" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="sm:w-56 rounded-xl"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {GROUP_CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          No groups here yet. Create the first one.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((g, i) => {
            const status = memberships[g.id];
            return (
              <motion.div
                key={g.id}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden flex flex-col"
              >
                <div className="h-20 bg-primary/10" style={g.cover_url ? { backgroundImage: `url(${g.cover_url})`, backgroundSize: "cover" } : undefined} />
                <div className="p-4 -mt-8 flex-1 flex flex-col">
                  <div className="h-12 w-12 rounded-2xl bg-card border border-border flex items-center justify-center text-xl shadow-sm">
                    {categoryEmoji(g.category)}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5">
                    <Link to="/groups/$groupId" params={{ groupId: g.id }} className="font-semibold hover:underline truncate">
                      {g.name}
                    </Link>
                    {g.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
                    {g.group_type === "emergency" && <Siren className="h-4 w-4 text-destructive" />}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{g.description || categoryLabel(g.category)}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground">
                    <span className="inline-flex items-center gap-1"><Users className="h-3 w-3" /> {counts[g.id] ?? 0}</span>
                    {g.location && <span className="inline-flex items-center gap-1 truncate"><MapPin className="h-3 w-3" /> {g.location}</span>}
                    <span className="capitalize">{g.privacy}</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border flex gap-2">
                    {status === "active" ? (
                      <Link to="/groups/$groupId" params={{ groupId: g.id }} className="flex-1">
                        <Button size="sm" variant="secondary" className="w-full rounded-xl">Open</Button>
                      </Link>
                    ) : status === "pending" ? (
                      <Button size="sm" variant="secondary" disabled className="flex-1 rounded-xl">Requested</Button>
                    ) : (
                      <Button size="sm" onClick={() => void join(g)} className="flex-1 rounded-xl">
                        {g.privacy === "private" ? "Request to join" : "Join"}
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CreateGroupDialog({ me, onCreated }: { me: string | null; onCreated: () => void | Promise<void> }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("local_community");
  const [privacy, setPrivacy] = useState("public");
  const [groupType, setGroupType] = useState("standard");
  const [location, setLocation] = useState("");
  const [rules, setRules] = useState("Be kind and respectful\nNo spam or fundraising scams\nProtect people's privacy");

  const create = async () => {
    if (!me || !name.trim()) return;
    setBusy(true);
    const { data, error } = await supabase
      .from("groups")
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        category,
        privacy,
        group_type: groupType,
        location: location.trim() || null,
        rules: rules.split("\n").map((r) => r.trim()).filter(Boolean),
        created_by: me,
      })
      .select("id")
      .single();
    if (error || !data) { setBusy(false); return toast.error(error?.message ?? "Could not create group"); }
    await supabase.from("group_members").insert({ group_id: data.id, user_id: me, role: "owner", status: "active" });
    setBusy(false);
    setOpen(false);
    await onCreated();
    toast.success("Group created");
    void navigate({ to: "/groups/$groupId", params: { groupId: data.id } });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl"><Plus className="h-4 w-4 mr-1.5" /> Create group</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create a community</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Group name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hyderabad Volunteers" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="What is this group for?" className="rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GROUP_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.emoji} {c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Privacy</Label>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private (approval)</SelectItem>
                  <SelectItem value="invite">Invite only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Group type</Label>
            <Select value={groupType} onValueChange={setGroupType}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {GROUP_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Location (optional)</Label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or area" className="rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Label>Rules (one per line)</Label>
            <Textarea value={rules} onChange={(e) => setRules(e.target.value)} rows={3} className="rounded-xl" />
          </div>
        </div>
        <DialogFooter>
          <Button disabled={!name.trim() || busy} onClick={() => void create()} className="rounded-xl">
            {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Create group
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

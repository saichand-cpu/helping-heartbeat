import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus, MapPin, Clock, AlertTriangle, Search, Heart, MessageCircle, Phone, PhoneCall,
  GraduationCap, Stethoscope, Utensils, Car, Laptop, Users, Baby, Briefcase, Gift, Siren, Sparkles,
  Trash2, ShieldAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { LeafletMap, useGeocodedPins } from "@/components/site/LeafletMap";
import { pinKindFor } from "@/lib/org-types";
import { useIsAdmin } from "@/hooks/use-role";

export const Route = createFileRoute("/_authenticated/requests/")({
  component: RequestsBrowse,
});

type Request = {
  id: string;
  title: string;
  description: string;
  category: string;
  urgency: string;
  location: string | null;
  status: string;
  created_at: string;
  requester_id: string;
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  education: GraduationCap, medical: Stethoscope, food: Utensils, transport: Car,
  technology: Laptop, elder_care: Users, child_care: Baby, jobs: Briefcase,
  donations: Gift, emergency: Siren, other: Heart,
};

const URGENCY_STYLE: Record<string, string> = {
  low: "bg-muted text-muted-foreground",
  normal: "bg-accent text-accent-foreground",
  high: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  emergency: "bg-destructive/15 text-destructive",
};

function RequestsBrowse() {
  const [items, setItems] = useState<Request[]>([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [seg, setSeg] = useState<"all" | "ngo" | "business" | "personal">("all");
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [phones, setPhones] = useState<Record<string, string | null>>({});
  const [orgs, setOrgs] = useState<Record<string, { account_type: string | null; org_type: string | null }>>({});
  const [confirmDel, setConfirmDel] = useState<{ id: string; title: string; admin: boolean } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { isAdmin } = useIsAdmin();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const startCall = (r: Request) => {
    if (r?.requester_id === meId) return;
    console.info("[HumanLink messaging] (1) Message button clicked", { selectedUserId: r.requester_id, source: "Requests call" });
    navigate({ to: "/messages", search: { userId: r.requester_id, call: "voice" } as never });
  };

  const confirmDelete = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    const { error } = await supabase.from("help_requests").delete().eq("id", confirmDel.id);
    setDeleting(false);
    if (error) return toast.error(error.message);
    toast.success(confirmDel.admin ? "Request archived" : "Request removed");
    setItems((prev) => prev.filter((x) => x.id !== confirmDel.id));
    setConfirmDel(null);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("help_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50);
      if (cat !== "all") query = query.eq("category", cat as never);
      const { data } = await query;
      const list = (data as Request[] | null) ?? [];
      setItems(list);
      setLoading(false);
      const ids = Array.from(new Set(list.map((r) => r.requester_id)));
      if (ids.length) {
        const [{ data: profs }, { data: orgRows }] = await Promise.all([
          supabase.from("profile_contacts").select("user_id, phone").in("user_id", ids),
          supabase.from("profiles").select("id, account_type, org_type").in("id", ids),
        ]);
        const pmap: Record<string, string | null> = {};
        (profs ?? []).forEach((p: { user_id: string; phone: string | null }) => { pmap[p.user_id] = p?.phone ?? null; });
        setPhones(pmap);
        const omap: Record<string, { account_type: string | null; org_type: string | null }> = {};
        (orgRows ?? []).forEach((o: { id: string; account_type: string | null; org_type: string | null }) => {
          omap[o.id] = { account_type: o?.account_type ?? null, org_type: o?.org_type ?? null };
        });
        setOrgs(omap);
      }
    })();
  }, [cat]);


  // Realtime: new/updated requests
  useEffect(() => {
    const ch = supabase
      .channel("requests-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "help_requests" }, (payload) => {
        const r = payload.new as Request;
        if (r.status !== "open") return;
        if (cat !== "all" && r.category !== cat) return;
        setItems((prev) => prev.find((x) => x.id === r.id) ? prev : [r, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "help_requests" }, (payload) => {
        const r = payload.new as Request;
        setItems((prev) => {
          if (r.status !== "open") return prev.filter((x) => x.id !== r.id);
          const idx = prev.findIndex((x) => x.id === r.id);
          if (idx < 0) return prev;
          const copy = prev.slice();
          copy[idx] = r;
          return copy;
        });
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "help_requests" }, (payload) => {
        const r = payload.old as Request;
        setItems((prev) => prev.filter((x) => x.id !== r.id));
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [cat]);

  const filtered = items.filter((r) => {
    if (q && !(r.title.toLowerCase().includes(q.toLowerCase()) || r.description.toLowerCase().includes(q.toLowerCase()))) return false;
    if (seg !== "all") {
      const o = orgs[r.requester_id];
      const kind = pinKindFor(o?.account_type, o?.org_type);
      if (kind !== seg) return false;
    }
    return true;
  });

  const pins = useGeocodedPins(
    filtered.slice(0, 20).map((r) => {
      const o = orgs[r.requester_id];
      return { id: r.id, location: r?.location ?? null, label: r?.title, kind: pinKindFor(o?.account_type, o?.org_type) };
    }),
  );

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="glass rounded-3xl p-6 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Help <span className="text-gradient-brand">Requests</span></h1>
            <p className="text-sm text-muted-foreground mt-1">Find someone you can help today.</p>
          </div>
          <Link to="/requests/new">
            <Button className="bg-gradient-brand text-primary-foreground border-0 shadow-glow"><Plus className="h-4 w-4 mr-1" /> New request</Button>
          </Link>
        </div>
        <div className="mt-5 grid md:grid-cols-[1fr_220px] gap-3">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by title, skill, or keyword" className="pl-9 h-11" />
          </div>
          <Select value={cat} onValueChange={setCat}>
            <SelectTrigger className="h-11"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {Object.keys(CATEGORY_ICONS).map((c) => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {([
            { v: "all", label: "All causes", dot: "bg-white/40" },
            { v: "ngo", label: "♥ NGOs & Community", dot: "bg-emerald-500" },
            { v: "business", label: "★ Businesses", dot: "bg-amber-500" },
            { v: "personal", label: "• People", dot: "bg-blue-500" },
          ] as const).map(({ v, label, dot }) => {
            const active = seg === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setSeg(v)}
                className={
                  "text-xs font-semibold px-3 py-1.5 rounded-full border transition-all inline-flex items-center gap-1.5 " +
                  (active
                    ? "bg-gradient-brand text-primary-foreground border-transparent shadow-glow"
                    : "border-border bg-card hover:bg-accent text-muted-foreground")
                }
              >
                <span className={"h-2 w-2 rounded-full " + dot} />
                {label}
              </button>
            );
          })}
        </div>
      </div>


      {!loading && filtered.length > 0 && (
        <div className="glass rounded-3xl p-4 shadow-soft">
          <div className="flex items-center gap-2 mb-3 px-1">
            <MapPin className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold">Requests on the map</h2>
            <span className="text-xs text-muted-foreground">· {pins?.length ?? 0} located</span>
          </div>
          {pins?.length ? (
            <LeafletMap pins={pins} height={240} />
          ) : (
            <div className="h-[240px] rounded-2xl border border-amber-500/20 bg-black/60 grid place-items-center text-xs text-muted-foreground animate-pulse">
              Locating requests…
            </div>
          )}
        </div>
      )}


      {loading ? (
        <div className="grid md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-3xl border border-border bg-card p-6 h-44 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Sparkles className="h-8 w-8 mx-auto text-primary" />
          <h3 className="mt-3 text-xl font-semibold">No matching requests</h3>
          <p className="text-sm text-muted-foreground mt-1">Be the first to create one — your kindness inspires others.</p>
          <Link to="/requests/new"><Button className="mt-4 bg-gradient-brand text-primary-foreground border-0 shadow-glow">Create request</Button></Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((r, i) => {
            const Icon = CATEGORY_ICONS[r.category] ?? Heart;
            return (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => navigate({ to: "/requests/$requestId", params: { requestId: r.id } })}
                role="link"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); navigate({ to: "/requests/$requestId", params: { requestId: r.id } }); } }}
                className="group cursor-pointer rounded-3xl border border-border bg-card p-6 hover:shadow-pop hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-xl bg-accent grid place-items-center text-primary"><Icon className="h-5 w-5" /></div>
                  <div className="flex items-center gap-2">
                    <Badge className={URGENCY_STYLE[r.urgency] + " border-0"}>
                      {r.urgency === "emergency" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {r.urgency}
                    </Badge>
                    {(r.requester_id === meId || isAdmin) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); setConfirmDel({ id: r.id, title: r.title, admin: r.requester_id !== meId }); }}
                        aria-label={r.requester_id === meId ? "Remove request" : "Admin archive"}
                        title={r.requester_id === meId ? "Remove request" : "Admin archive"}
                        className={r.requester_id === meId
                          ? "h-8 w-8 rounded-lg text-red-500 hover:text-red-400 hover:bg-red-500/10"
                          : "h-8 w-8 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"}
                      >
                        {r.requester_id === meId ? <Trash2 className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
                <h3 className="mt-4 font-semibold text-lg leading-snug">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location || "Anywhere"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 rounded-2xl border border-amber-500/25 bg-black p-2" onClick={(e) => e.stopPropagation()}>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      console.info("[HumanLink messaging] (1) Message button clicked", { selectedUserId: r.requester_id, source: "Requests text" });
                      navigate({ to: "/messages", search: { userId: r.requester_id } as never });
                    }}
                    disabled={r.requester_id === meId}
                    size="sm"
                    className="bg-gradient-brand text-primary-foreground border-0 shadow-glow"
                  >
                    <MessageCircle className="h-4 w-4 mr-1" /> Text
                  </Button>
                  <Button
                    onClick={(e) => { e.stopPropagation(); startCall(r); }}
                    disabled={r.requester_id === meId}
                    size="sm"
                    variant="outline"
                    className="border-amber-400/70 text-amber-300 hover:bg-amber-500/10 shadow-[0_0_18px_-6px_rgba(251,191,36,0.7)]"
                  >
                    <PhoneCall className="h-4 w-4 mr-1" /> Call
                  </Button>
                  {phones?.[r.requester_id] ? (
                    <Button asChild size="sm" variant="outline" className="border-white/15 bg-black text-white hover:bg-white/5">
                      <a href={`tel:${phones?.[r.requester_id] ?? ""}`} onClick={(e) => e.stopPropagation()}>
                        <Phone className="h-4 w-4 mr-1" /> Phone
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled className="border-white/10 bg-black/60 text-muted-foreground">
                      <Phone className="h-4 w-4 mr-1" /> Phone
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDel?.admin ? "Archive this request?" : "Remove this request?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <span className="font-semibold text-foreground">"{confirmDel?.title}"</span>?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              {deleting ? "Removing…" : (confirmDel?.admin ? "Archive" : "Remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

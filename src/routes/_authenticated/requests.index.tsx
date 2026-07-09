import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus, MapPin, Clock, AlertTriangle, Search, Heart, Loader2, MessageCircle,
  GraduationCap, Stethoscope, Utensils, Car, Laptop, Users, Baby, Briefcase, Gift, Siren, Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { LeafletMap, useGeocodedPins } from "@/components/site/LeafletMap";

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
  const [loading, setLoading] = useState(true);
  const [meId, setMeId] = useState<string | null>(null);
  const [offering, setOffering] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMeId(data.user?.id ?? null));
  }, []);

  const offerHelp = async (r: Request) => {
    if (!meId) {
      toast.error("Please sign in to offer help");
      return;
    }
    if (r.requester_id === meId) {
      toast.info("This is your own request");
      return;
    }
    setOffering(r.id);
    try {
      const { error: offerErr } = await supabase
        .from("request_offers")
        .insert({ request_id: r.id, helper_id: meId, message: "I'd love to help with this." });
      if (offerErr && offerErr.code !== "23505") throw offerErr;
      toast.success("Offer sent — opening profile");
      navigate({ to: "/profile/$userId", params: { userId: r.requester_id } });
    } catch (e: any) {
      toast.error(e?.message ?? "Could not send offer");
    } finally {
      setOffering(null);
    }
  };


  useEffect(() => {
    (async () => {
      setLoading(true);
      let query = supabase.from("help_requests").select("*").eq("status", "open").order("created_at", { ascending: false }).limit(50);
      if (cat !== "all") query = query.eq("category", cat as never);
      const { data } = await query;
      setItems((data as Request[] | null) ?? []);
      setLoading(false);
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

  const filtered = items.filter((r) =>
    !q || r.title.toLowerCase().includes(q.toLowerCase()) || r.description.toLowerCase().includes(q.toLowerCase())
  );

  const pins = useGeocodedPins(
    filtered.slice(0, 20).map((r) => ({ id: r.id, location: r?.location ?? null, label: r?.title })),
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
      </div>

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
                className="group rounded-3xl border border-border bg-card p-6 hover:shadow-pop hover:-translate-y-0.5 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="h-11 w-11 rounded-xl bg-accent grid place-items-center text-primary"><Icon className="h-5 w-5" /></div>
                  <Badge className={URGENCY_STYLE[r.urgency] + " border-0"}>
                    {r.urgency === "emergency" && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {r.urgency}
                  </Badge>
                </div>
                <h3 className="mt-4 font-semibold text-lg leading-snug">{r.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {r.location || "Anywhere"}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(r.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground/80 italic">
                  Phone &amp; call are unlocked only after the requester accepts your offer.
                </p>
                <Button
                  onClick={() => offerHelp(r)}
                  disabled={offering === r.id}
                  className="w-full mt-3 bg-gradient-brand text-primary-foreground border-0 shadow-glow"
                  size="sm"
                >
                  {offering === r.id ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Sending…</>
                  ) : r.requester_id === meId ? (
                    "View your request"
                  ) : (
                    "Offer help"
                  )}
                </Button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

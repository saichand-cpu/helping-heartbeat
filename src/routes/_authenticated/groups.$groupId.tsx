import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2, Send, ShieldCheck, Users, ArrowLeft, MapPin, CalendarPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { categoryEmoji, categoryLabel, joinGroup, leaveGroup, type Group } from "@/lib/groups";
import { timeAgo } from "@/lib/social";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/groups/$groupId")({
  component: GroupDetail,
});

type Msg = { id: string; sender_id: string; content: string | null; created_at: string; deleted_at: string | null };

function GroupDetail() {
  const { groupId } = Route.useParams();
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [group, setGroup] = useState<Group | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [members, setMembers] = useState(0);
  const [tab, setTab] = useState<"chat" | "about">("chat");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const bottom = useRef<HTMLDivElement>(null);

  const loadMsgs = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("id, sender_id, content, created_at, deleted_at")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(200);
    const list = (data ?? []) as Msg[];
    setMsgs(list);
    const ids = Array.from(new Set(list.map((m) => m.sender_id)));
    if (ids.length) {
      const { data: ps } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      setNames(Object.fromEntries((ps ?? []).map((p) => [p.id, p.full_name])));
    }
  };

  useEffect(() => {
    let alive = true;
    void (async () => {
      setLoading(true);
      const [{ data: g }, { data: mem }, { count }] = await Promise.all([
        supabase.from("groups").select("*").eq("id", groupId).maybeSingle(),
        me ? supabase.from("group_members").select("status").eq("group_id", groupId).eq("user_id", me).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from("group_members").select("id", { count: "exact", head: true }).eq("group_id", groupId).eq("status", "active"),
      ]);
      if (!alive) return;
      setGroup((g ?? null) as unknown as Group | null);
      setStatus((mem as { status?: string } | null)?.status ?? null);
      setMembers(count ?? 0);
      if ((mem as { status?: string } | null)?.status === "active") await loadMsgs();
      setLoading(false);
    })();
    return () => { alive = false; };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [groupId, me]);

  useEffect(() => {
    if (status !== "active") return;
    const ch = supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_messages", filter: `group_id=eq.${groupId}` }, () => void loadMsgs())
      .subscribe();
    return () => { void supabase.removeChannel(ch); };
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [groupId, status]);

  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length]);

  const send = async () => {
    if (!text.trim() || !me) return;
    const body = text.trim();
    setText("");
    const { error } = await supabase.from("group_messages").insert({ group_id: groupId, sender_id: me, content: body });
    if (error) toast.error(error.message);
  };

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  if (!group) return <div className="py-20 text-center text-sm text-muted-foreground">This group is unavailable.</div>;

  return (
    <div className="space-y-4">
      <Link to="/groups" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All groups
      </Link>

      <div className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="h-24 bg-primary/10" style={group.cover_url ? { backgroundImage: `url(${group.cover_url})`, backgroundSize: "cover" } : undefined} />
        <div className="p-4 -mt-9">
          <div className="h-14 w-14 rounded-2xl bg-card border border-border flex items-center justify-center text-2xl shadow-sm">
            {categoryEmoji(group.category)}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">{group.name}</h1>
            {group.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
            <span className="text-xs rounded-full bg-secondary px-2 py-0.5 text-muted-foreground">{categoryLabel(group.category)}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {members} members</span>
            {group.location && <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {group.location}</span>}
            <span className="capitalize">{group.privacy}</span>
          </div>
          <div className="mt-3 flex gap-2">
            {status === "active" ? (
              <Button
                variant="secondary" size="sm" className="rounded-xl"
                onClick={async () => { if (!me) return; await leaveGroup(groupId, me); setStatus(null); toast.success("Left group"); }}
              >Leave</Button>
            ) : status === "pending" ? (
              <Button size="sm" variant="secondary" disabled className="rounded-xl">Request pending</Button>
            ) : (
              <Button
                size="sm" className="rounded-xl"
                onClick={async () => { if (!me) return; const s = await joinGroup(group, me); setStatus(s); toast.success(s === "pending" ? "Request sent" : "Joined"); }}
              >{group.privacy === "private" ? "Request to join" : "Join group"}</Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["chat", "about"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >{t}</button>
        ))}
      </div>

      {tab === "about" ? (
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
          <h2 className="font-semibold text-sm">Group rules</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-disc pl-5">
            {(group.rules ?? []).length ? group.rules.map((r, i) => <li key={i}>{r}</li>) : <li>Be kind and helpful.</li>}
          </ul>
          <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5 pt-2 border-t border-border">
            <CalendarPlus className="h-3.5 w-3.5" /> Created {timeAgo(group.created_at)} ago
          </p>
        </div>
      ) : status !== "active" ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Join this group to see the conversation.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card shadow-soft flex flex-col h-[60vh]">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {msgs.length === 0 && <p className="text-center text-sm text-muted-foreground py-10">No messages yet — say hello 👋</p>}
            {msgs.filter((m) => !m.deleted_at).map((m) => {
              const mine = m.sender_id === me;
              return (
                <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {!mine && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{names[m.sender_id] ?? "Member"}</p>}
                    <p className="whitespace-pre-wrap break-words">{m.content}</p>
                    <p className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{timeAgo(m.created_at)}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottom} />
          </div>
          <div className="border-t border-border p-3 flex items-center gap-2">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(); } }}
              placeholder="Message the group…"
              className="rounded-xl"
            />
            <Button size="icon" className="rounded-xl shrink-0" disabled={!text.trim()} onClick={() => void send()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

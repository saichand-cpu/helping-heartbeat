import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

type Conversation = { other_id: string; last: string; time: string; full_name: string | null };

function MessagesPage() {
  const [items, setItems] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const me = u.user.id;
      const { data } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at")
        .or(`sender_id.eq.${me},receiver_id.eq.${me}`)
        .order("created_at", { ascending: false })
        .limit(100);

      const map = new Map<string, Conversation>();
      (data ?? []).forEach((m) => {
        const other = m.sender_id === me ? m.receiver_id : m.sender_id;
        if (!map.has(other)) map.set(other, { other_id: other, last: m.content, time: m.created_at, full_name: null });
      });

      const others = Array.from(map.keys());
      if (others.length) {
        const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", others);
        (profs ?? []).forEach((p) => {
          const c = map.get(p.id);
          if (c) c.full_name = p.full_name;
        });
      }
      setItems(Array.from(map.values()));
      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-6 pb-24 lg:pb-6">
      <div className="glass rounded-3xl p-6 shadow-soft">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-sm text-muted-foreground mt-1">Your conversations with helpers and seekers.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-2xl bg-card animate-pulse" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <MessageCircle className="h-8 w-8 mx-auto text-primary" />
          <h3 className="mt-3 text-xl font-semibold">No conversations yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Offer to help on a request to start a chat.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((c) => (
            <div key={c.other_id} className="glass rounded-2xl p-4 flex items-center gap-4 hover:shadow-pop transition-shadow cursor-pointer">
              <div className="h-12 w-12 rounded-full bg-gradient-brand grid place-items-center text-primary-foreground font-bold">
                {(c.full_name || "U").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold truncate">{c.full_name || "User"}</div>
                  <div className="text-xs text-muted-foreground">{new Date(c.time).toLocaleDateString()}</div>
                </div>
                <div className="text-sm text-muted-foreground truncate">{c.last}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

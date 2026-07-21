import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const CHANNEL = "presence:online";

/**
 * Tracks the currently authenticated user in a shared Supabase Realtime
 * presence channel and exposes the set of online user ids to consumers.
 */
export function usePresence(me: string | null | undefined) {
  const [online, setOnline] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!me) return;
    const ch = supabase.channel(CHANNEL, {
      config: { presence: { key: me } },
    });

    const sync = () => {
      const state = ch.presenceState();
      setOnline(new Set(Object.keys(state)));
    };

    ch.on("presence", { event: "sync" }, sync);
    ch.on("presence", { event: "join" }, sync);
    ch.on("presence", { event: "leave" }, sync);

    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await ch.track({ online_at: new Date().toISOString() });
      }
    });

    // Best-effort persistent "last seen" for offline fallback.
    const beat = () => {
      supabase
        .from("profiles")
        .update({ last_seen_at: new Date().toISOString() } as never)
        .eq("id", me)
        .then(() => {});
    };
    beat();
    const iv = window.setInterval(beat, 60_000);

    return () => {
      window.clearInterval(iv);
      supabase.removeChannel(ch);
    };
  }, [me]);

  return useMemo(
    () => ({
      online,
      isOnline: (id: string | null | undefined) => (id ? online.has(id) : false),
    }),
    [online],
  );
}

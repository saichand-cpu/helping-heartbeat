import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useFollow(targetId: string | undefined | null) {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [following, setFollowing] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!targetId) { setLoading(false); return; }
    const [followersRes, followingRes, mineRes] = await Promise.all([
      supabase.from("follows" as never).select("id", { count: "exact", head: true }).eq("followed_id", targetId),
      supabase.from("follows" as never).select("id", { count: "exact", head: true }).eq("follower_id", targetId),
      me
        ? supabase.from("follows" as never).select("id").eq("follower_id", me).eq("followed_id", targetId).maybeSingle()
        : Promise.resolve({ data: null } as never),
    ]);
    setFollowers(followersRes?.count ?? 0);
    setFollowingCount(followingRes?.count ?? 0);
    setFollowing(!!(mineRes as { data: unknown })?.data);
    setLoading(false);
  }, [targetId, me]);

  useEffect(() => { setLoading(true); load(); }, [load]);

  useEffect(() => {
    if (!targetId) return;
    const ch = supabase
      .channel(`follows:${targetId}:${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `followed_id=eq.${targetId}` },
        () => load())
      .on("postgres_changes",
        { event: "*", schema: "public", table: "follows", filter: `follower_id=eq.${targetId}` },
        () => load())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [targetId, load]);

  const toggle = async () => {
    if (!me || !targetId || me === targetId || busy) return;
    setBusy(true);
    if (following) {
      setFollowing(false); setFollowers((n) => Math.max(0, n - 1));
      await supabase.from("follows" as never).delete().eq("follower_id", me).eq("followed_id", targetId);
    } else {
      setFollowing(true); setFollowers((n) => n + 1);
      await supabase.from("follows" as never).insert({ follower_id: me, followed_id: targetId } as never);
    }
    setBusy(false);
  };

  return { following, followers, followingCount, loading, busy, toggle, isMe: me === targetId };
}

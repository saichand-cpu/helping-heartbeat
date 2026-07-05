import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export function useBookmark(postId: string | null | undefined) {
  const { user } = useAuth();
  const me = user?.id ?? null;
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!me || !postId) return;
    const { data } = await supabase
      .from("bookmarks" as never)
      .select("id")
      .eq("user_id", me)
      .eq("post_id", postId)
      .maybeSingle();
    setSaved(!!(data as { id?: string } | null)?.id);
  }, [me, postId]);

  useEffect(() => { load(); }, [load]);

  const toggle = async () => {
    if (!me || !postId || busy) return;
    setBusy(true);
    if (saved) {
      setSaved(false);
      await supabase.from("bookmarks" as never).delete().eq("user_id", me).eq("post_id", postId);
    } else {
      setSaved(true);
      await supabase.from("bookmarks" as never).insert({ user_id: me, post_id: postId } as never);
    }
    setBusy(false);
  };

  return { saved, busy, toggle, canBookmark: !!me };
}

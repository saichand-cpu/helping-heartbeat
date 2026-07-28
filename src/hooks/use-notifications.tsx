import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { toast } from "sonner";
import { notifySystem } from "./use-system-notifications";

export type Notification = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
};

type Prefs = {
  push_enabled: boolean;
  chat_notifications: boolean;
  request_updates: boolean;
  donation_updates: boolean;
  followers: boolean;
  likes: boolean;
  comments: boolean;
  mentions: boolean;
};

const DEFAULT_PREFS: Prefs = {
  push_enabled: true,
  chat_notifications: true,
  request_updates: true,
  donation_updates: true,
  followers: true,
  likes: true,
  comments: true,
  mentions: true,
};

/** Which prefs key gates each notification kind. */
function prefKeyFor(kind: string): keyof Prefs | null {
  switch (kind) {
    case "message":
      return "chat_notifications";
    case "follow":
      return "followers";
    case "like":
    case "post_like":
      return "likes";
    case "comment":
    case "post_comment":
      return "comments";
    case "offer":
    case "offer_status":
    case "request_completed":
    case "karma":
    case "nearby_request":
    case "sos":
    case "review":
      return "request_updates";
    default:
      return null;
  }
}

/** Global realtime notifications for the signed-in user. */
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const prefsRef = useRef<Prefs>(DEFAULT_PREFS);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: notifs }, { data: prefs }] = await Promise.all([
      supabase
        .from("notifications" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(40),
      supabase
        .from("notification_prefs" as any)
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    setItems(((notifs ?? []) as unknown) as Notification[]);
    if (prefs) prefsRef.current = { ...DEFAULT_PREFS, ...(prefs as any) };
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }
    load();

    const ch = supabase
      .channel(`notifications:${user.id}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => (prev.find((x) => x.id === n.id) ? prev : [n, ...prev]));
          const key = prefKeyFor(n.kind);
          const allowed = !key || prefsRef.current[key];
          if (!allowed) return;
          toast(n.title, { description: n.body ?? undefined });
          if (prefsRef.current.push_enabled) {
            notifySystem(n.title, { body: n.body ?? undefined, tag: `notif:${n.id}` });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.new as Notification;
          setItems((prev) => prev.map((x) => (x.id === n.id ? n : x)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const n = payload.old as Notification;
          setItems((prev) => prev.filter((x) => x.id !== n.id));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notification_prefs", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const p = (payload.new ?? payload.old) as any;
          if (p) prefsRef.current = { ...DEFAULT_PREFS, ...p };
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, load]);

  const unread = items.filter((n) => !n.read).length;

  const markAllRead = async () => {
    if (!user || unread === 0) return;
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    await supabase.from("notifications" as any).update({ read: true }).eq("user_id", user.id).eq("read", false);
  };

  const markRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    await supabase.from("notifications" as any).update({ read: true }).eq("id", id);
  };

  return { items, unread, loading, markAllRead, markRead, reload: load };
}

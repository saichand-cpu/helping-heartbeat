import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { sendMobilePush } from "@/lib/server/mobile-push";

export const Route = createFileRoute("/api/send-user-notification")({
  server: { handlers: {
    POST: async ({ request }) => {
      const auth = request.headers.get("authorization") ?? "";
      const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
      const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
      const key = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
      if (!token || !url || !key) return Response.json({ error: "Authentication required." }, { status: 401 });
      const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data } = await client.auth.getUser(token);
      if (!data.user) return Response.json({ error: "Invalid authentication token." }, { status: 401 });
      let b: { userIds?: string[]; title?: string; body?: string; link?: string };
      try { b = await request.json(); } catch { return Response.json({ error: "Invalid JSON." }, { status: 400 }); }
      const userIds = Array.isArray(b.userIds) ? [...new Set(b.userIds)].filter(x => typeof x === "string" && x.length < 100) : [];
      if (!userIds.length || !b.title?.trim() || !b.body?.trim()) return Response.json({ error: "userIds, title and body are required." }, { status: 400 });
      // Only allow a caller to target themselves unless an internal server call is added later.
      if (userIds.some(id => id !== data.user.id)) return Response.json({ error: "You can only send a notification to your own account from this endpoint." }, { status: 403 });
      const result = await sendMobilePush(userIds, b.title.trim().slice(0,120), b.body.trim().slice(0,2000), b.link?.trim() || "/");
      return Response.json({ ok: true, ...result });
    },
  }},
});

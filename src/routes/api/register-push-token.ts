import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Body = {
  token?: string;
  platform?: string;
  appVersion?: string;
};

function getClients() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

  if (!url || !publishableKey || !serviceRoleKey) return null;

  return {
    auth: createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
    admin: createClient(url, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export const Route = createFileRoute("/api/register-push-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clients = getClients();
        if (!clients) {
          return Response.json({ error: "Push registration is not configured." }, { status: 503 });
        }

        const authHeader = request.headers.get("authorization") ?? "";
        const accessToken = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!accessToken) {
          return Response.json({ error: "Authentication required." }, { status: 401 });
        }

        const { data, error: userError } = await clients.auth.auth.getUser(accessToken);
        if (userError || !data.user) {
          return Response.json({ error: "Invalid authentication token." }, { status: 401 });
        }

        let body: Body;
        try {
          body = (await request.json()) as Body;
        } catch {
          return Response.json({ error: "Invalid JSON." }, { status: 400 });
        }

        const token = body.token?.trim() ?? "";
        const platform = body.platform?.trim().toLowerCase() || "android";
        if (!token || token.length > 4096) {
          return Response.json({ error: "A valid FCM token is required." }, { status: 400 });
        }

        const { error } = await clients.admin.from("mobile_push_tokens").upsert(
          {
            user_id: data.user.id,
            token,
            platform,
            app_version: body.appVersion?.trim().slice(0, 40) || null,
            last_seen_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "token" },
        );

        if (error) {
          console.error("[register-push-token] upsert failed", error);
          return Response.json({ error: "Unable to register this device." }, { status: 500 });
        }

        return Response.json({ ok: true });
      },
    },
  },
});

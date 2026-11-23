import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

type Body = {
  token?: string;
  platform?: string;
  appVersion?: string;
};

function userClient(accessToken: string) {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY;

  if (!url || !publishableKey) return null;

  // Device tokens belong to the signed-in user. Keep this operation under
  // Supabase RLS instead of requiring a service-role key.
  return createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}

export const Route = createFileRoute("/api/register-push-token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authHeader = request.headers.get("authorization") ?? "";
        const accessToken = authHeader.startsWith("Bearer ")
          ? authHeader.slice(7).trim()
          : "";
        if (!accessToken) {
          return Response.json({ error: "Authentication required." }, { status: 401 });
        }

        const client = userClient(accessToken);
        if (!client) {
          return Response.json({ error: "Push registration is not configured." }, { status: 503 });
        }

        const { data, error: userError } = await client.auth.getUser(accessToken);
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

        const { error } = await client.from("mobile_push_tokens").upsert(
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

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";
import { createSign } from "node:crypto";

const TOPIC = "humanlink-all-users";

type ServiceAccount = {
  project_id: string;
  client_email: string;
  private_key: string;
};

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function base64Url(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function getServiceAccount(): ServiceAccount | null {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) return null;
    return parsed;
  } catch {
    return null;
  }
}

async function getGoogleAccessToken(serviceAccount: ServiceAccount) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60_000) return cachedAccessToken.token;

  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  }));
  const unsigned = `${header}.${payload}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key);
  const assertion = `${unsigned}.${base64Url(signature)}`;

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!response.ok) throw new Error(`Google OAuth failed (${response.status})`);
  const data = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error("Google OAuth did not return an access token");
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: Date.now() + Math.max(60, (data.expires_in ?? 3600) - 60) * 1000,
  };
  return data.access_token;
}

async function requireAdmin(request: Request) {
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!token) return null;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const publishableKey = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !publishableKey || !serviceRoleKey) return null;

  const authClient = createClient(supabaseUrl, publishableKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: userData } = await authClient.auth.getUser(token);
  if (!userData.user) return null;

  const adminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: role } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userData.user.id)
    .eq("role", "admin")
    .maybeSingle();
  return role ? userData.user : null;
}

export const Route = createFileRoute("/api/admin-send-notification")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const user = await requireAdmin(request);
        if (!user) return Response.json({ error: "Admin access required" }, { status: 403 });

        let body: { title?: string; message?: string; url?: string };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid JSON" }, { status: 400 });
        }

        const title = body.title?.trim() ?? "";
        const message = body.message?.trim() ?? "";
        const url = body.url?.trim() ?? "/";
        if (!title || !message) return Response.json({ error: "Title and message are required" }, { status: 400 });
        if (title.length > 120 || message.length > 2000) return Response.json({ error: "Notification is too long" }, { status: 400 });

        const serviceAccount = getServiceAccount();
        if (!serviceAccount) {
          return Response.json({ error: "Firebase push is not configured. Add FIREBASE_SERVICE_ACCOUNT_JSON to the server environment." }, { status: 503 });
        }

        try {
          const accessToken = await getGoogleAccessToken(serviceAccount);
          const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              message: {
                topic: TOPIC,
                notification: { title, body: message },
                data: { url, source: "humanlink-admin" },
                android: { priority: "high", notification: { channel_id: "humanlink-default" } },
              },
            }),
          });
          if (!response.ok) {
            const detail = await response.text().catch(() => "");
            console.error("[admin-send-notification] FCM error", response.status, detail.slice(0, 1000));
            return Response.json({ error: "Firebase rejected the notification. Check Firebase project credentials and FCM API configuration." }, { status: 502 });
          }

          const result = (await response.json()) as { name?: string };
          console.info("[admin-send-notification] sent", { admin: user.id, topic: TOPIC, messageId: result.name });
          return Response.json({ ok: true, topic: TOPIC, messageId: result.name ?? null });
        } catch (error) {
          console.error("[admin-send-notification] failed", error);
          return Response.json({ error: "Unable to send the notification right now." }, { status: 502 });
        }
      },
    },
  },
});

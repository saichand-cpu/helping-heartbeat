import { createClient } from "@supabase/supabase-js";
import { createSign } from "node:crypto";

type ServiceAccount = { project_id: string; client_email: string; private_key: string };
let cachedAccessToken: { token: string; expiresAt: number } | null = null;

function b64(input: string | Buffer) {
  return Buffer.from(input).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function serviceAccount(): ServiceAccount | null {
  try {
    const x = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "") as ServiceAccount;
    return x.project_id && x.client_email && x.private_key ? x : null;
  } catch { return null; }
}

async function accessToken(sa: ServiceAccount) {
  if (cachedAccessToken && cachedAccessToken.expiresAt > Date.now() + 60000) return cachedAccessToken.token;
  const now = Math.floor(Date.now() / 1000);
  const header = b64(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = b64(JSON.stringify({
    iss: sa.client_email, scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600,
  }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${payload}`);
  const assertion = `${header}.${payload}.${b64(signer.sign(sa.private_key))}`;
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }),
  });
  if (!r.ok) throw new Error(`Google OAuth failed (${r.status})`);
  const d = await r.json() as { access_token?: string; expires_in?: number };
  if (!d.access_token) throw new Error("No Firebase access token");
  cachedAccessToken = { token: d.access_token, expiresAt: Date.now() + Math.max(60, (d.expires_in ?? 3600) - 60) * 1000 };
  return d.access_token;
}

export async function sendMobilePush(userIds: string[], title: string, body: string, url = "/") {
  const sa = serviceAccount();
  if (!sa || !userIds.length) return { sent: 0, configured: Boolean(sa) };

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) return { sent: 0, configured: false };

  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: rows } = await admin.from("mobile_push_tokens").select("token").in("user_id", userIds);
  const tokens = [...new Set((rows ?? []).map((x) => x.token).filter(Boolean))];
  if (!tokens.length) return { sent: 0, configured: true };

  const bearer = await accessToken(sa);
  let sent = 0;
  for (const token of tokens) {
    const r = await fetch(`https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`, {
      method: "POST",
      headers: { Authorization: `Bearer ${bearer}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { url, source: "humanlink" },
          android: { priority: "high", notification: { channel_id: "humanlink-default" } },
        },
      }),
    });
    if (r.ok) sent++;
    else if (r.status === 404 || r.status === 400) {
      await admin.from("mobile_push_tokens").delete().eq("token", token);
    }
  }
  return { sent, configured: true };
}

import { supabase } from "@/integrations/supabase/client";

const REFRESH_WINDOW_SECONDS = 60;

async function getAccessToken(forceRefresh: boolean): Promise<string | null> {
  if (forceRefresh) {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) return null;
    return data.session?.access_token ?? null;
  }

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const expiresAt = data.session.expires_at ?? 0;
  const expiresSoon = expiresAt <= Math.floor(Date.now() / 1000) + REFRESH_WINDOW_SECONDS;
  if (!expiresSoon) return data.session.access_token;

  const refreshed = await supabase.auth.refreshSession();
  if (refreshed.error) return null;
  return refreshed.data.session?.access_token ?? null;
}

/** Makes an authenticated request and retries once with a refreshed session on 401. */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const request = async (forceRefresh: boolean) => {
    const token = await getAccessToken(forceRefresh);
    if (!token) return null;

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, credentials: "include", headers });
  };

  const first = await request(false);
  if (!first) throw new Error("LOGIN_REQUIRED");
  if (first.status !== 401) return first;

  const retried = await request(true);
  return retried ?? first;
}
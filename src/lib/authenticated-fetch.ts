import { getFreshAccessToken } from "@/lib/supabase-session";

/**
 * Makes an authenticated request using the CURRENT Supabase session
 * (never a cached token) and retries exactly once with a refreshed
 * session when the server answers 401.
 */
export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const request = async (forceRefresh: boolean) => {
    const token = await getFreshAccessToken(forceRefresh);
    if (!token) return null;

    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    return fetch(input, { ...init, credentials: "include", headers });
  };

  const first = await request(false);
  if (!first) throw new Error("LOGIN_REQUIRED");
  if (first.status !== 401) return first;

  // Exactly one retry with a forcibly refreshed token.
  const retried = await request(true);
  if (!retried) throw new Error("LOGIN_REQUIRED");
  return retried;
}

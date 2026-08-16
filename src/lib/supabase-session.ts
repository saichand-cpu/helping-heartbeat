import { supabase } from "@/integrations/supabase/client";

/**
 * Single source of truth for the current Supabase access token.
 *
 * Every authenticated request (server functions via `functionMiddleware`,
 * raw fetches via `authenticatedFetch`) must get its token from here so that:
 *  - tokens are never cached in React state or module globals,
 *  - a token that is expired (or about to expire) is refreshed before use,
 *  - concurrent callers share ONE refresh (refresh-token rotation makes
 *    parallel `refreshSession()` calls fail and can drop the session).
 */

const REFRESH_WINDOW_SECONDS = 120;

let inflightRefresh: Promise<string | null> | null = null;

/** Deduplicated session refresh — all concurrent callers await the same call. */
function refreshOnce(): Promise<string | null> {
  if (!inflightRefresh) {
    inflightRefresh = supabase.auth
      .refreshSession()
      .then(({ data, error }) => (error ? null : (data.session?.access_token ?? null)))
      .catch(() => null)
      .finally(() => {
        inflightRefresh = null;
      });
  }
  return inflightRefresh;
}

/**
 * Returns a currently valid access token, refreshing when needed.
 * Returns null when there is no usable session (caller must ask for sign-in).
 */
export async function getFreshAccessToken(force = false): Promise<string | null> {
  if (force) return refreshOnce();

  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const expiresAt = data.session.expires_at ?? 0;
  const expiresSoon = expiresAt <= Math.floor(Date.now() / 1000) + REFRESH_WINDOW_SECONDS;
  if (!expiresSoon) return data.session.access_token;

  // Expired or near-expiry: refresh before the request goes out.
  return (await refreshOnce()) ?? null;
}

/** True when an error (or response text) represents an authentication failure. */
export function isAuthError(err: unknown): boolean {
  const msg =
    typeof err === "string" ? err : err instanceof Error ? err.message : String(err ?? "");
  return /unauthorized|session expired|jwt|not authenticated|login required|401/i.test(msg);
}

export const SESSION_EXPIRED_MESSAGE = "Your session has expired. Please sign in again.";

/**
 * Called when a request still fails auth AFTER one forced refresh:
 * the session is genuinely dead, so clear it and send the user to sign in.
 * Never loops — it does not retry the request again.
 */
export async function endExpiredSession() {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore — the session is already unusable
  }
  if (typeof window !== "undefined") {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.assign(`/auth?redirect=${next}`);
  }
}

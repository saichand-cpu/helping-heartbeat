import { createMiddleware } from "@tanstack/react-start";
import { getFreshAccessToken, isAuthError, SESSION_EXPIRED_MESSAGE } from "@/lib/supabase-session";

/**
 * Global client-side middleware for every server function RPC.
 *
 * Replaces the generated `attachSupabaseAuth`, which read
 * `supabase.auth.getSession()` and attached whatever token was in storage —
 * including an expired one when the tab had been idle, producing
 * "Unauthorized: Session expired" on Razorpay and other protected calls.
 *
 * Here the token always comes from the shared session source (refreshed when
 * stale) and a 401/unauthorized failure triggers exactly ONE retry with a
 * force-refreshed token.
 */
export const attachFreshSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const token = await getFreshAccessToken();

    try {
      return await next({
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (error) {
      if (!isAuthError(error)) throw error;

      const refreshed = await getFreshAccessToken(true);
      if (!refreshed) throw new Error(SESSION_EXPIRED_MESSAGE);

      try {
        return await next({ headers: { Authorization: `Bearer ${refreshed}` } });
      } catch (retryError) {
        if (isAuthError(retryError)) throw new Error(SESSION_EXPIRED_MESSAGE);
        throw retryError;
      }
    }
  },
);

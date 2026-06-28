import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";
import { useIsAdmin } from "./use-role";

export type Tier = "free" | "basic" | "plus" | "pro";

const RANK: Record<Tier, number> = { free: 0, basic: 1, plus: 2, pro: 3 };

/**
 * God-mode aware premium status.
 * Admins automatically get effective tier = "pro", verified badge,
 * unlimited ad credits, max karma multiplier, and bypass all paywalls.
 */
export function usePremium() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useIsAdmin();
  const [tier, setTier] = useState<Tier>("free");
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setTier("free");
      setVerified(false);
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("premium_tier, verified")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setTier(((data?.premium_tier as Tier) ?? "free"));
        setVerified(!!data?.verified);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [user, authLoading]);

  const effectiveTier: Tier = isAdmin ? "pro" : tier;
  const effectiveVerified = isAdmin || verified;

  const hasTier = (min: Tier) => RANK[effectiveTier] >= RANK[min];

  return {
    tier: effectiveTier,
    rawTier: tier,
    verified: effectiveVerified,
    isAdmin: !!isAdmin,
    /** Admin god-mode is active — bypass all paywalls / limits. */
    godMode: !!isAdmin,
    /** Karma multiplier — admins get max (2x), pro 1.5x, plus 1.25x, else 1x. */
    karmaMultiplier: isAdmin ? 2 : effectiveTier === "pro" ? 1.5 : effectiveTier === "plus" ? 1.25 : 1,
    /** Ad credits remaining for the period — Infinity for admin. */
    adCreditsUnlimited: !!isAdmin,
    hasTier,
    /** Paywall guard: returns true to allow access, false to block & show modal. */
    canAccess: (min: Tier) => isAdmin || hasTier(min),
    loading: loading || authLoading || roleLoading,
  };
}

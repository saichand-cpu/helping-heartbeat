// Shared identity-masking helper.
// When a profile has `incognito` enabled, the rest of the app sees them as
// "Anonymous Helper" with a neutral avatar — except the viewer themselves,
// who always sees their real identity.

export type IdentityInput = {
  id?: string | null;
  full_name?: string | null;
  avatar_url?: string | null;
  incognito?: boolean | null;
  premium_tier?: string | null;
} | null | undefined;

export type DisplayIdentity = {
  name: string;
  avatar_url: string | null;
  initial: string;
  isIncognito: boolean;
  /** Hide premium / verified badges on incognito profiles to prevent triangulation. */
  premium_tier: string | null;
};

export function displayIdentity(profile: IdentityInput, viewerId?: string | null): DisplayIdentity {
  const isOwn = !!profile?.id && !!viewerId && profile.id === viewerId;
  if (profile?.incognito && !isOwn) {
    return {
      name: "Anonymous Helper",
      avatar_url: null,
      initial: "?",
      isIncognito: true,
      premium_tier: null,
    };
  }
  const name = profile?.full_name?.trim() || "User";
  return {
    name,
    avatar_url: profile?.avatar_url ?? null,
    initial: name.charAt(0).toUpperCase(),
    isIncognito: false,
    premium_tier: profile?.premium_tier ?? null,
  };
}

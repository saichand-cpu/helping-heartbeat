// Central segmentation constants for organization/account types.
// Keep this file client-safe (no server imports).

export type AccountType = "individual" | "business";

export type OrgType = "ngo" | "services" | "education" | "community" | "other";

export const ORG_TYPES: {
  value: OrgType;
  label: string;
  short: string;
  examples: string;
  color: string; // Tailwind color hint
  hex: string;   // hex used for map pins & borders
  pinKind: "ngo" | "business" | "personal";
}[] = [
  {
    value: "ngo",
    label: "NGO / Social Welfare",
    short: "Verified NGO",
    examples: "Food banks, shelters, disaster relief",
    color: "emerald",
    hex: "#10b981",
    pinKind: "ngo",
  },
  {
    value: "services",
    label: "Local Services / Trades",
    short: "Verified Service",
    examples: "Plumbers, electricians, handymen",
    color: "amber",
    hex: "#f59e0b",
    pinKind: "business",
  },
  {
    value: "education",
    label: "Education & Coaching",
    short: "Verified Educator",
    examples: "Academic tutors, music teachers",
    color: "amber",
    hex: "#f59e0b",
    pinKind: "business",
  },
  {
    value: "community",
    label: "Community / Cultural Group",
    short: "Community Group",
    examples: "Neighborhood associations, sports clubs",
    color: "emerald",
    hex: "#22c55e",
    pinKind: "ngo",
  },
  {
    value: "other",
    label: "Other Business",
    short: "Verified Business",
    examples: "Anything else",
    color: "amber",
    hex: "#f59e0b",
    pinKind: "business",
  },
];

export function getOrgMeta(v?: string | null) {
  if (!v) return null;
  return ORG_TYPES.find((o) => o.value === v) ?? null;
}

export function isNgo(orgType?: string | null) {
  const m = getOrgMeta(orgType);
  return !!m && (m.pinKind === "ngo");
}

export function pinKindFor(accountType?: string | null, orgType?: string | null): "ngo" | "business" | "personal" {
  if (accountType !== "business") return "personal";
  return getOrgMeta(orgType)?.pinKind ?? "business";
}

export const PIN_HEX: Record<"ngo" | "business" | "personal", string> = {
  ngo: "#10b981",       // emerald / green heart
  business: "#f59e0b",  // gold star
  personal: "#3b82f6",  // royal blue
};

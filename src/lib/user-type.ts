// Personal vs Business user-type helpers layered on top of the existing
// account_type column so the rest of the app can speak the new vocabulary.

import type { AccountType } from "./org-types";

export type UserType = "personal" | "business";

/** Map the DB `account_type` value onto the user-facing personal/business split. */
export function deriveUserType(accountType?: string | null): UserType {
  return accountType === "business" ? "business" : "personal";
}

/** Reverse map for saving back to `account_type`. */
export function accountTypeFrom(userType: UserType): AccountType {
  return userType === "business" ? "business" : "individual";
}

export const USER_TYPE_COPY: Record<UserType, { label: string; blurb: string }> = {
  personal: {
    label: "Personal Account",
    blurb: "Connect with neighbors, request help, and browse local posts.",
  },
  business: {
    label: "Business Account",
    blurb: "Showcase professional services, build a portfolio, and attract local clients.",
  },
};

export const SEGMENT_OPTIONS: {
  value: "all" | UserType;
  label: string;
  dot: string;
}[] = [
  { value: "all", label: "All", dot: "bg-white/60" },
  { value: "personal", label: "Personal Needs", dot: "bg-blue-500" },
  { value: "business", label: "Verified Businesses", dot: "bg-amber-500" },
];

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Policy versions are mirrored in the database (`policy_versions`) so that
 * acceptance records stay historically accurate. These constants are the
 * versions the *current* UI copy corresponds to.
 */
export const POLICY_VERSIONS = {
  terms: "1.0",
  privacy: "1.0",
  community: "1.0",
  refund: "1.0",
} as const;

export type PolicyType = keyof typeof POLICY_VERSIONS;

export type SupportConfig = {
  support_email: string | null;
  grievance_email: string | null;
  grievance_officer_name: string | null;
  legal_email: string | null;
  business_name: string | null;
  business_address: string | null;
  business_phone: string | null;
  refund_window_days: number;
  notes: string | null;
  updated_at: string;
};

export type PolicyVersionRow = {
  id: string;
  policy_type: string;
  version: string;
  effective_date: string;
  summary: string | null;
  active: boolean;
};

/** Placeholder shown when the operator has not configured real details yet. */
export const PLACEHOLDER = "Not configured yet";

export function displayValue(v: string | null | undefined) {
  return v && v.trim().length > 0 ? v.trim() : PLACEHOLDER;
}

/** Reads the single support-configuration row plus published policy versions. */
export function useLegalConfig() {
  const [config, setConfig] = useState<SupportConfig | null>(null);
  const [versions, setVersions] = useState<PolicyVersionRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: cfg }, { data: vers }] = await Promise.all([
        supabase.from("support_config").select("*").limit(1).maybeSingle(),
        supabase.from("policy_versions").select("*").eq("active", true),
      ]);
      if (cancelled) return;
      setConfig((cfg as SupportConfig) ?? null);
      setVersions((vers as PolicyVersionRow[]) ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const versionOf = (type: PolicyType) =>
    versions.find((v) => v.policy_type === type)?.version ?? POLICY_VERSIONS[type];
  const effectiveOf = (type: PolicyType) =>
    versions.find((v) => v.policy_type === type)?.effective_date ?? null;

  return { config, versions, versionOf, effectiveOf, loading };
}

/** Records that a user accepted a policy version. Never overwrites history. */
export async function recordLegalAcceptance(
  userId: string,
  types: PolicyType[],
  context = "signup",
) {
  const rows = types.map((t) => ({
    user_id: userId,
    policy_type: t,
    policy_version: POLICY_VERSIONS[t],
    context,
  }));
  return supabase.from("legal_acceptances").insert(rows);
}

export const REPORT_CATEGORIES = [
  { value: "harassment", label: "Harassment" },
  { value: "threat", label: "Threat or safety concern" },
  { value: "scam", label: "Scam / Fraud" },
  { value: "impersonation", label: "Fake account / Impersonation" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "spam", label: "Spam" },
  { value: "illegal", label: "Illegal activity" },
  { value: "privacy", label: "Privacy violation" },
  { value: "abuse", label: "Abuse" },
  { value: "other", label: "Other" },
] as const;

export const GRIEVANCE_CATEGORIES = [
  { value: "safety", label: "Safety complaint" },
  { value: "harassment", label: "Harassment complaint" },
  { value: "account", label: "Account complaint" },
  { value: "privacy", label: "Privacy complaint" },
  { value: "content", label: "Content complaint" },
  { value: "payment", label: "Payment complaint" },
  { value: "platform", label: "Platform complaint" },
  { value: "other", label: "Other grievance" },
] as const;

export const REPORT_STATUSES = [
  "open",
  "under_review",
  "action_taken",
  "resolved",
  "rejected",
] as const;

export const GRIEVANCE_STATUSES = [
  "open",
  "under_review",
  "in_progress",
  "resolved",
  "closed",
] as const;

export const MODERATION_ACTIONS = [
  "warning",
  "content_removal",
  "content_restriction",
  "temporary_restriction",
  "temporary_suspension",
  "permanent_suspension",
  "no_action",
  "escalated",
] as const;

export function prettyStatus(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type ReportContentType =
  | "profile"
  | "request"
  | "review"
  | "comment"
  | "post"
  | "message"
  | "story";

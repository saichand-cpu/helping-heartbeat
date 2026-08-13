// HumanLink Groups: shared types, categories and data helpers.
import { supabase } from "@/integrations/supabase/client";

export type GroupCategory =
  | "local_community" | "volunteers" | "ngos" | "education" | "medical" | "blood_donation"
  | "food_support" | "emergency" | "animal_welfare" | "environment" | "mental_wellness"
  | "jobs_skills" | "students" | "neighborhood" | "events" | "other";

export const GROUP_CATEGORIES: { value: GroupCategory; label: string; emoji: string }[] = [
  { value: "local_community", label: "Local Community", emoji: "🏘️" },
  { value: "volunteers", label: "Volunteers", emoji: "🤝" },
  { value: "ngos", label: "NGOs", emoji: "🏛️" },
  { value: "education", label: "Education", emoji: "📚" },
  { value: "medical", label: "Medical Help", emoji: "🩺" },
  { value: "blood_donation", label: "Blood Donation", emoji: "🩸" },
  { value: "food_support", label: "Food Support", emoji: "🍲" },
  { value: "emergency", label: "Emergency", emoji: "🚨" },
  { value: "animal_welfare", label: "Animal Welfare", emoji: "🐾" },
  { value: "environment", label: "Environment", emoji: "🌱" },
  { value: "mental_wellness", label: "Mental Wellness", emoji: "🧠" },
  { value: "jobs_skills", label: "Jobs & Skills", emoji: "💼" },
  { value: "students", label: "Students", emoji: "🎓" },
  { value: "neighborhood", label: "Neighborhood", emoji: "📍" },
  { value: "events", label: "Events", emoji: "📅" },
  { value: "other", label: "Other", emoji: "✨" },
];

export function categoryLabel(value: string | null | undefined) {
  return GROUP_CATEGORIES.find((c) => c.value === value)?.label ?? "Community";
}
export function categoryEmoji(value: string | null | undefined) {
  return GROUP_CATEGORIES.find((c) => c.value === value)?.emoji ?? "✨";
}

export const GROUP_TYPES = [
  { value: "standard", label: "Standard community", hint: "A regular HumanLink community" },
  { value: "verified", label: "Verified community", hint: "For NGOs, organisations and trusted leaders" },
  { value: "emergency", label: "Emergency response", hint: "Urgent humanitarian coordination" },
] as const;

export type Group = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  category: string;
  avatar_url: string | null;
  cover_url: string | null;
  privacy: string;
  group_type: string;
  location: string | null;
  radius_km: number | null;
  rules: string[];
  invite_code: string | null;
  member_posting: boolean;
  member_media: boolean;
  verified: boolean;
  created_by: string;
  created_at: string;
};

export type GroupMember = {
  id: string;
  group_id: string;
  user_id: string;
  role: string;
  status: string;
  muted: boolean;
  notif_level: string;
  created_at: string;
};

export async function fetchMemberCounts(groupIds: string[]): Promise<Record<string, number>> {
  if (!groupIds.length) return {};
  const { data } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds)
    .eq("status", "active");
  const counts: Record<string, number> = {};
  for (const r of data ?? []) counts[r.group_id] = (counts[r.group_id] ?? 0) + 1;
  return counts;
}

export async function joinGroup(group: Group, userId: string) {
  const status = group.privacy === "private" ? "pending" : "active";
  const { error } = await supabase
    .from("group_members")
    .insert({ group_id: group.id, user_id: userId, role: "member", status });
  if (error) throw error;
  return status;
}

export async function leaveGroup(groupId: string, userId: string) {
  const { error } = await supabase.from("group_members").delete().eq("group_id", groupId).eq("user_id", userId);
  if (error) throw error;
}

export function inviteUrl(group: Pick<Group, "id" | "invite_code">) {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/groups/${group.id}${group.invite_code ? `?invite=${group.invite_code}` : ""}`;
}

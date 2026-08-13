// Shared social-feed domain helpers: post types, media handling, hashtags.
import { supabase } from "@/integrations/supabase/client";

export type MediaItem = { path: string; kind: "image" | "video" };

export type PostType =
  | "normal"
  | "help_request"
  | "offer_help"
  | "success_story"
  | "photo"
  | "video"
  | "ngo_announcement"
  | "community_update"
  | "poll"
  | "event"
  | "emergency";

export const POST_TYPES: { value: PostType; label: string; hint: string }[] = [
  { value: "normal", label: "Update", hint: "Share what's on your mind" },
  { value: "help_request", label: "Help request", hint: "Ask the community for help" },
  { value: "offer_help", label: "Offer help", hint: "Offer your time or skills" },
  { value: "success_story", label: "Success story", hint: "Celebrate real-world impact" },
  { value: "community_update", label: "Community update", hint: "News for your community" },
  { value: "ngo_announcement", label: "NGO announcement", hint: "Official organisation news" },
  { value: "poll", label: "Poll", hint: "Ask a question with options" },
  { value: "event", label: "Event", hint: "Invite people to something" },
  { value: "emergency", label: "Emergency", hint: "Urgent, time-critical help" },
];

export const POST_TYPE_META: Record<string, { label: string; tone: string }> = {
  help_request: { label: "Help request", tone: "bg-primary/10 text-primary border-primary/25" },
  offer_help: { label: "Offering help", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  success_story: { label: "Success story", tone: "bg-amber-500/10 text-amber-600 border-amber-500/25" },
  ngo_announcement: { label: "NGO announcement", tone: "bg-emerald-500/10 text-emerald-600 border-emerald-500/25" },
  community_update: { label: "Community update", tone: "bg-sky-500/10 text-sky-600 border-sky-500/25" },
  poll: { label: "Poll", tone: "bg-violet-500/10 text-violet-600 border-violet-500/25" },
  event: { label: "Event", tone: "bg-indigo-500/10 text-indigo-600 border-indigo-500/25" },
  emergency: { label: "Emergency", tone: "bg-destructive/10 text-destructive border-destructive/25" },
};

export const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", hint: "Anyone on HumanLink" },
  { value: "followers", label: "Followers", hint: "Only people who follow you" },
  { value: "group", label: "Group members", hint: "Only members of the group" },
  { value: "private", label: "Only me", hint: "Visible to you alone" },
] as const;

export type Poll = { question?: string; options: string[] };

export type FeedAuthor = {
  id?: string;
  full_name: string;
  avatar_url: string | null;
  premium_tier: string | null;
  incognito?: boolean | null;
  verified?: boolean | null;
  karma_points?: number | null;
  account_type?: string | null;
  org_type?: string | null;
};

export type FeedPost = {
  id: string;
  author_id: string;
  body: string;
  image_url: string | null;
  media: MediaItem[];
  post_type: string;
  visibility: string;
  location: string | null;
  hashtags: string[];
  poll: Poll | null;
  event_at: string | null;
  group_id: string | null;
  is_announcement: boolean;
  resolved: boolean;
  pinned: boolean;
  created_at: string;
  author?: FeedAuthor;
  group?: { id: string; name: string; avatar_url: string | null; verified: boolean } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

export function extractHashtags(text: string): string[] {
  const found = text.match(/#[\p{L}\p{N}_]{2,40}/gu) ?? [];
  return Array.from(new Set(found.map((h) => h.slice(1).toLowerCase())));
}

export function normalizeMedia(row: { media?: unknown; image_url?: string | null }): MediaItem[] {
  const raw = Array.isArray(row.media) ? (row.media as MediaItem[]) : [];
  if (raw.length) return raw.filter((m) => m && typeof m.path === "string");
  if (row.image_url) {
    const stored = row.image_url;
    const path = stored.startsWith("feed-media:") ? stored.slice("feed-media:".length) : stored;
    const kind: "image" | "video" = /\.(mp4|webm|mov)(\?|$)/i.test(stored) ? "video" : "image";
    return [{ path: stored.startsWith("feed-media:") ? path : stored, kind }];
  }
  return [];
}

/** Convert a stored media item into a displayable URL (signed when private). */
export async function mediaUrl(item: MediaItem): Promise<string | null> {
  if (/^https?:\/\//.test(item.path)) return item.path;
  const { data } = await supabase.storage.from("feed-media").createSignedUrl(item.path, 60 * 60 * 24);
  return data?.signedUrl ?? null;
}

export function timeAgo(iso: string): string {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString();
}

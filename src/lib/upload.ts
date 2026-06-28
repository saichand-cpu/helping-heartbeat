// Helpers for uploading media to the private `feed-media` bucket and
// resolving short-lived signed URLs for display.
import { supabase } from "@/integrations/supabase/client";

export type UploadedMedia = {
  path: string; // storage path: `${uid}/...`
  signedUrl: string;
  kind: "image" | "video";
};

const MAX_BYTES = 15 * 1024 * 1024; // 15 MB

export async function uploadFeedMedia(file: File): Promise<UploadedMedia> {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user?.id;
  if (!uid) throw new Error("Sign in required");
  if (file.size > MAX_BYTES) throw new Error("File too large (max 15 MB)");
  const kind: "image" | "video" = file.type.startsWith("video/") ? "video" : "image";
  const ext = (file.name.split(".").pop() || (kind === "video" ? "mp4" : "jpg")).toLowerCase();
  const path = `${uid}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from("feed-media")
    .upload(path, file, { contentType: file.type || undefined, upsert: false });
  if (error) throw error;
  const signedUrl = await signFeedMedia(path);
  return { path, signedUrl, kind };
}

export async function signFeedMedia(path: string, expiresInSec = 60 * 60 * 24 * 7): Promise<string> {
  const { data, error } = await supabase.storage.from("feed-media").createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) throw error ?? new Error("Could not sign URL");
  return data.signedUrl;
}

/**
 * Given any value stored in posts.image_url or stories.media_url, return a
 * displayable URL. We accept both raw http(s) URLs (legacy) and bucket paths
 * (`feed-media:<path>`), so the feed handles both cleanly.
 */
export async function resolveMediaUrl(stored: string | null | undefined): Promise<string | null> {
  if (!stored) return null;
  if (stored.startsWith("feed-media:")) {
    try { return await signFeedMedia(stored.slice("feed-media:".length)); } catch { return null; }
  }
  return stored;
}

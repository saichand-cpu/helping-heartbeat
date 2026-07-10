import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

// Public server-side geocoder. Shared cache in `geocode_cache` means every
// unique query hits Nominatim at most once across the entire user base.
// Applies exponential backoff on 429/5xx and refuses to loop.

const NOMINATIM = "https://nominatim.openstreetmap.org/search";
const MAX_INPUT = 200;
const MAX_ATTEMPTS = 3;

function normalize(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ").slice(0, MAX_INPUT);
}

function parseCoords(raw: string): { lat: number; lng: number } | null {
  const cleaned = raw.replace(/lat[:=]|lng[:=]|lon[:=]|[()°]/gi, " ");
  const m = cleaned.match(/(-?\d{1,3}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lng = parseFloat(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function fetchWithBackoff(url: string): Promise<Response | null> {
  let delay = 400;
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          "Accept-Language": "en",
          // Nominatim usage policy requires an identifying UA.
          "User-Agent": "HumanLinkGeocoder/1.0 (contact: support@humanlink.app)",
        },
      });
      if (res.ok) return res;
      // Back off on rate limit or server error, fail-fast on 4xx.
      if (res.status !== 429 && res.status < 500) return res;
    } catch {
      // network hiccup — retry
    }
    await new Promise((r) => setTimeout(r, delay));
    delay *= 2;
  }
  return null;
}

async function providerLookup(q: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}?format=json&limit=1&q=${encodeURIComponent(q)}`;
  const res = await fetchWithBackoff(url);
  if (!res || !res.ok) return null;
  try {
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    const hit = Array.isArray(arr) && arr[0];
    if (!hit) return null;
    const lat = parseFloat(hit.lat);
    const lng = parseFloat(hit.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

export const geocodeAddress = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => {
    const data = raw as { query?: unknown };
    const q = typeof data?.query === "string" ? data.query : "";
    if (!q.trim()) throw new Error("query required");
    return { query: q };
  })
  .handler(async ({ data }) => {
    const key = normalize(data.query);
    if (!key) return { lat: null, lng: null, hit: false, cached: false };

    // Explicit coords — no provider call, no cache write.
    const coords = parseCoords(key);
    if (coords) return { ...coords, hit: true, cached: false };

    const supabase = createClient<Database>(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_PUBLISHABLE_KEY!,
      { auth: { storage: undefined, persistSession: false, autoRefreshToken: false } },
    );

    // 1. Read shared cache.
    const { data: cached } = await supabase
      .from("geocode_cache")
      .select("lat, lng, hit")
      .eq("query", key)
      .maybeSingle();

    if (cached) {
      // Touch last_used_at asynchronously; ignore failure.
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      supabaseAdmin
        .from("geocode_cache")
        .update({ last_used_at: new Date().toISOString() })
        .eq("query", key)
        .then(() => {}, () => {});
      return {
        lat: cached.hit ? cached.lat : null,
        lng: cached.hit ? cached.lng : null,
        hit: !!cached.hit,
        cached: true,
      };
    }

    // 2. Cache miss — call provider (with backoff), then persist result.
    let result = await providerLookup(key);
    if (!result) {
      const parts = key.split(",").map((s) => s.trim()).filter(Boolean);
      const fallback = parts.length > 1 ? parts[parts.length - 1] : null;
      if (fallback && fallback !== key) {
        await new Promise((r) => setTimeout(r, 250));
        result = await providerLookup(fallback);
      }
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("geocode_cache").upsert({
      query: key,
      lat: result?.lat ?? null,
      lng: result?.lng ?? null,
      hit: !!result,
      last_used_at: new Date().toISOString(),
    });

    return {
      lat: result?.lat ?? null,
      lng: result?.lng ?? null,
      hit: !!result,
      cached: false,
    };
  });

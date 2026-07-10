import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icons under Vite bundling.
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export type MapPin = { id: string; lat: number; lng: number; label?: string };

type Props = {
  pins: MapPin[];
  className?: string;
  height?: number;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
};

export function LeafletMap({ pins, className, height = 260, center, zoom, interactive = true }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  const initialCenter = useMemo<[number, number]>(() => {
    if (center) return center;
    if (pins?.[0]) return [pins[0].lat, pins[0].lng];
    return [20.5937, 78.9629]; // India center fallback
  }, [center, pins]);

  useEffect(() => {
    if (!ref.current || mapRef.current) return;
    const map = L.map(ref.current, {
      center: initialCenter,
      zoom: zoom ?? (pins?.length ? 5 : 4),
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      doubleClickZoom: interactive,
      touchZoom: interactive,
      attributionControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const markers: L.Marker[] = [];
    (pins ?? []).forEach((p) => {
      if (typeof p?.lat !== "number" || typeof p?.lng !== "number") return;
      if (Number.isNaN(p.lat) || Number.isNaN(p.lng)) return;
      const m = L.marker([p.lat, p.lng], { icon: DefaultIcon }).addTo(map);
      if (p.label) m.bindPopup(p.label);
      markers.push(m);
    });
    if (pins?.length === 1) {
      map.setView([pins[0].lat, pins[0].lng], zoom ?? 12);
    } else if (pins?.length > 1) {
      const group = L.featureGroup(markers);
      map.fitBounds(group.getBounds().pad(0.25));
    }
    return () => {
      markers.forEach((m) => m.remove());
    };
  }, [pins, zoom]);

  return (
    <div
      ref={ref}
      className={"rounded-2xl overflow-hidden border border-amber-500/30 bg-black " + (className ?? "")}
      style={{ height }}
    />
  );
}

// ---------- Geocoding ----------
// Two-layer cache: in-memory (Map) for the session + localStorage for persistence.
// Supports raw coordinate strings ("12.97, 77.59"), "lat:..,lng:.." forms, and free-text place names.
// Falls back gracefully on network / rate-limit errors and negatively caches misses to avoid retry storms.

const GEOCODE_KEY = "hl:geocode:v2";
const CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const NEG_TTL_MS = 1000 * 60 * 60 * 24;         // 1 day for misses

type GeoHit = { lat: number; lng: number } | null;
type GeoEntry = { v: GeoHit; t: number };
type GeoCache = Record<string, GeoEntry>;

const memCache = new Map<string, GeoHit>();
const inflight = new Map<string, Promise<GeoHit>>();

function readCache(): GeoCache {
  try { return JSON.parse(localStorage.getItem(GEOCODE_KEY) || "{}") as GeoCache; } catch { return {}; }
}
function writeCache(c: GeoCache) {
  try { localStorage.setItem(GEOCODE_KEY, JSON.stringify(c)); } catch { /* quota / private mode */ }
}

function normalizeKey(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

// Detect explicit coordinate strings. Accepts:
//   "12.9716, 77.5946"    "12.9716 77.5946"    "lat:12.97,lng:77.59"    "(12.97,77.59)"
function parseCoords(raw: string): GeoHit {
  if (!raw) return null;
  const cleaned = raw.replace(/lat[:=]|lng[:=]|lon[:=]|[()°]/gi, " ");
  const match = cleaned.match(/(-?\d{1,3}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)/);
  if (!match) return null;
  const lat = parseFloat(match[1]);
  const lng = parseFloat(match[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

async function nominatimLookup(q: string, signal?: AbortSignal): Promise<GeoHit> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
      { headers: { "Accept-Language": "en" }, signal },
    );
    if (!res.ok) return null;
    const arr = await res.json();
    const hit = Array.isArray(arr) && arr[0] ? { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) } : null;
    if (hit && Number.isFinite(hit.lat) && Number.isFinite(hit.lng)) return hit;
    return null;
  } catch {
    return null;
  }
}

export async function geocodeLocation(q: string): Promise<GeoHit> {
  const key = normalizeKey(q ?? "");
  if (!key) return null;

  // 1. Explicit coordinates — no network needed.
  const coords = parseCoords(key);
  if (coords) return coords;

  // 2. In-memory cache.
  if (memCache.has(key)) return memCache.get(key) ?? null;

  // 3. Persistent cache with TTL (distinct hit vs. miss expiry).
  const cache = readCache();
  const entry = cache?.[key];
  if (entry && typeof entry.t === "number") {
    const ttl = entry.v ? CACHE_TTL_MS : NEG_TTL_MS;
    if (Date.now() - entry.t < ttl) {
      memCache.set(key, entry.v);
      return entry.v;
    }
  }

  // 4. Deduplicate concurrent lookups for the same key.
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async (): Promise<GeoHit> => {
    // Primary lookup, then a coarser fallback using the first comma-separated segment
    // (helps "Some Society, Koramangala, Bengaluru" → "Bengaluru" when the full string 404s).
    let hit = await nominatimLookup(key);
    if (!hit) {
      const parts = key.split(",").map((s) => s.trim()).filter(Boolean);
      const fallback = parts.length > 1 ? parts[parts.length - 1] : null;
      if (fallback && fallback !== key) {
        await new Promise((r) => setTimeout(r, 300)); // respect Nominatim policy
        hit = await nominatimLookup(fallback);
      }
    }
    const next = readCache();
    next[key] = { v: hit, t: Date.now() };
    writeCache(next);
    memCache.set(key, hit);
    return hit;
  })().finally(() => { inflight.delete(key); });

  inflight.set(key, p);
  return p;
}

export function useGeocodedPins(locations: { id: string; location: string | null; label?: string }[]) {
  const [pins, setPins] = useState<MapPin[]>([]);
  const sig = useMemo(
    () => (locations ?? []).map((l) => `${l?.id}|${l?.location ?? ""}|${l?.label ?? ""}`).join("~"),
    [locations],
  );
  useEffect(() => {
    let alive = true;
    (async () => {
      const results: MapPin[] = [];
      for (const l of locations ?? []) {
        if (!l?.location) continue;
        const geo = await geocodeLocation(l.location);
        if (!alive) return;
        if (geo) {
          results.push({ id: l.id, lat: geo.lat, lng: geo.lng, label: l.label ?? l.location });
          // Stream partial results so pins appear as they resolve.
          setPins(results.slice());
        }
        // Gentle rate-limit for uncached lookups only (cached hits resolve synchronously-ish).
        await new Promise((r) => setTimeout(r, 120));
      }
      if (alive) setPins(results);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return pins;
}

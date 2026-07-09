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

// Geocode a free-text location via Nominatim, with localStorage caching.
const GEOCODE_KEY = "hl:geocode:v1";
type GeoCache = Record<string, { lat: number; lng: number } | null>;

function readCache(): GeoCache {
  try { return JSON.parse(localStorage.getItem(GEOCODE_KEY) || "{}"); } catch { return {}; }
}
function writeCache(c: GeoCache) {
  try { localStorage.setItem(GEOCODE_KEY, JSON.stringify(c)); } catch { /* noop */ }
}

export async function geocodeLocation(q: string): Promise<{ lat: number; lng: number } | null> {
  const key = q?.trim().toLowerCase();
  if (!key) return null;
  const cache = readCache();
  if (key in cache) return cache[key];
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(key)}`,
      { headers: { "Accept-Language": "en" } },
    );
    const arr = await res.json();
    const hit = Array.isArray(arr) && arr[0] ? { lat: parseFloat(arr[0].lat), lng: parseFloat(arr[0].lon) } : null;
    cache[key] = hit;
    writeCache(cache);
    return hit;
  } catch {
    return null;
  }
}

export function useGeocodedPins(locations: { id: string; location: string | null; label?: string }[]) {
  const [pins, setPins] = useState<MapPin[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const results: MapPin[] = [];
      for (const l of locations ?? []) {
        if (!l?.location) continue;
        const geo = await geocodeLocation(l.location);
        if (!alive) return;
        if (geo) results.push({ id: l.id, lat: geo.lat, lng: geo.lng, label: l.label ?? l.location });
        // gentle rate-limit for Nominatim policy
        await new Promise((r) => setTimeout(r, 250));
      }
      if (alive) setPins(results);
    })();
    return () => { alive = false; };
  }, [JSON.stringify(locations)]);
  return pins;
}

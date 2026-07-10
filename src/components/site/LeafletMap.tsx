import { useMemo, useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { geocodeAddress } from "@/lib/geocode.functions";

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
    return [20.5937, 78.9629];
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
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
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
    return () => { markers.forEach((m) => m.remove()); };
  }, [pins, zoom]);

  return (
    <div
      ref={ref}
      className={"rounded-2xl overflow-hidden border border-amber-500/30 bg-black " + (className ?? "")}
      style={{ height }}
    />
  );
}

// ---------- Geocoding: server-fn backed, shared DB cache ----------
// Client keeps a small in-memory cache to avoid duplicate RPCs during a session;
// the server fn owns the durable shared cache + provider backoff.

type GeoHit = { lat: number; lng: number } | null;
const memCache = new Map<string, GeoHit>();
const inflight = new Map<string, Promise<GeoHit>>();

function normalizeKey(q: string) {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function geocodeLocation(q: string): Promise<GeoHit> {
  const key = normalizeKey(q ?? "");
  if (!key) return null;
  if (memCache.has(key)) return memCache.get(key) ?? null;
  const existing = inflight.get(key);
  if (existing) return existing;

  const p = (async (): Promise<GeoHit> => {
    try {
      const res = await geocodeAddress({ data: { query: key } });
      const hit: GeoHit = res?.hit && typeof res.lat === "number" && typeof res.lng === "number"
        ? { lat: res.lat, lng: res.lng }
        : null;
      memCache.set(key, hit);
      return hit;
    } catch {
      return null;
    }
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
          setPins(results.slice());
        }
      }
      if (alive) setPins(results);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return pins;
}

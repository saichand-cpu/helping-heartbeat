import { useEffect, useMemo, useState } from "react";
import { geocodeAddress } from "@/lib/geocode.functions";

export type PinKind = "ngo" | "business" | "personal";
export type MapPin = { id: string; lat: number; lng: number; label?: string; kind?: PinKind };

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

export function useGeocodedPins(locations: { id: string; location: string | null; label?: string; kind?: PinKind }[]) {
  const [pins, setPins] = useState<MapPin[]>([]);
  const sig = useMemo(
    () => (locations ?? []).map((l) => `${l?.id}|${l?.location ?? ""}|${l?.label ?? ""}|${l?.kind ?? ""}`).join("~"),
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
          results.push({ id: l.id, lat: geo.lat, lng: geo.lng, label: l.label ?? l.location, kind: l.kind });
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

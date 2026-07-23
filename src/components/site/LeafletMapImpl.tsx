import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { PIN_HEX } from "@/lib/org-types";
import type { MapPin, PinKind } from "./LeafletMap.hooks";

const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function coloredPin(kind: PinKind) {
  const hex = PIN_HEX[kind] ?? PIN_HEX.personal;
  const glyph = kind === "ngo" ? "♥" : kind === "business" ? "★" : "•";
  const html = `
    <div style="position:relative;width:30px;height:40px;">
      <div style="
        position:absolute;inset:0;
        background:${hex};
        clip-path:path('M15 0 C6 0 0 7 0 15 C0 26 15 40 15 40 C15 40 30 26 30 15 C30 7 24 0 15 0 Z');
        box-shadow:0 4px 12px ${hex}66, 0 0 0 2px #fff;
      "></div>
      <div style="
        position:absolute;top:6px;left:0;right:0;text-align:center;
        color:#fff;font-weight:900;font-size:14px;line-height:1;
        text-shadow:0 1px 2px rgba(0,0,0,0.5);
      ">${glyph}</div>
    </div>`;
  return L.divIcon({ html, className: "", iconSize: [30, 40], iconAnchor: [15, 40], popupAnchor: [0, -34] });
}

type Props = {
  pins: MapPin[];
  className?: string;
  height?: number;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
};

export default function LeafletMapImpl({ pins, className, height = 260, center, zoom, interactive = true }: Props) {
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
      const icon = p.kind ? coloredPin(p.kind) : DefaultIcon;
      const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
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

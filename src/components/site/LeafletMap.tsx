import { lazy, Suspense } from "react";
import { ClientOnly } from "@tanstack/react-router";
import type { MapPin } from "./LeafletMap.hooks";

export type { MapPin, PinKind } from "./LeafletMap.hooks";
export { geocodeLocation, useGeocodedPins } from "./LeafletMap.hooks";

const LeafletMapImpl = lazy(() => import("./LeafletMapImpl"));

type Props = {
  pins: MapPin[];
  className?: string;
  height?: number;
  center?: [number, number];
  zoom?: number;
  interactive?: boolean;
};

export function LeafletMap(props: Props) {
  const height = props.height ?? 260;
  const fallback = (
    <div
      className={"rounded-2xl overflow-hidden border border-border bg-muted " + (props.className ?? "")}
      style={{ height }}
    />
  );
  return (
    <ClientOnly fallback={fallback}>
      <Suspense fallback={fallback}>
        <LeafletMapImpl {...props} />
      </Suspense>
    </ClientOnly>
  );
}

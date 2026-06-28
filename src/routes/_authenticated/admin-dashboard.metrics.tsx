import { createFileRoute, redirect } from "@tanstack/react-router";

// Alias for the nested admin metrics path. The full implementation lives
// at /_authenticated/admin-metrics; this redirect keeps the architecturally
// specified URL stable.
export const Route = createFileRoute("/_authenticated/admin-dashboard/metrics")({
  beforeLoad: () => {
    throw redirect({ to: "/admin-metrics" });
  },
});

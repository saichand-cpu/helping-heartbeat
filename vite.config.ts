// @lovable.dev/vite-tanstack-config provides the TanStack Start/Vite integration.
// Keep Nitro enabled for Vercel so the server output is emitted for Vercel Functions.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const isVercel = !!process.env.VERCEL;

export default defineConfig({
  nitro: isVercel ? { preset: "vercel" } : true,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts.
    server: { entry: "server" },
  },
});

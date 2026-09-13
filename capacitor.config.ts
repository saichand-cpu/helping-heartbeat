import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "in.humanlink.app",
  appName: "HumanLink",
  webDir: "dist",
  bundledWebRuntime: false,
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ["badge", "sound", "alert"],
    },
  },
};

export default config;

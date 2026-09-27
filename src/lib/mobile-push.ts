import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

const HUMANLINK_ALL_USERS_TOPIC = "humanlink-all-users";

let nativeReady = false;
let registeredToken = "";

async function registerToken(token: string, accessToken: string) {
  if (!token || !accessToken || token === registeredToken) return;

  const response = await fetch("/api/register-push-token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      token,
      platform: Capacitor.getPlatform(),
    }),
  });

  if (!response.ok) {
    throw new Error(`Push token registration failed (${response.status})`);
  }

  registeredToken = token;
}

export async function initializeMobilePushNotifications(accessToken?: string) {
  if (!Capacitor.isNativePlatform()) return;

  try {
    if (!nativeReady) {
      const permission = await FirebaseMessaging.requestPermissions();
      if (permission.receive !== "granted") return;

      await FirebaseMessaging.subscribeToTopic({
        topic: HUMANLINK_ALL_USERS_TOPIC,
      });

      await FirebaseMessaging.addListener("notificationReceived", (notification) => {
        console.info("HumanLink push notification received", notification);
      });

      await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
        const url = event.notification.data?.url;
        if (typeof url === "string" && url.length > 0) {
          window.location.href = url;
        }
      });

      nativeReady = true;
    }

    const { token } = await FirebaseMessaging.getToken();
    if (accessToken && token) {
      await registerToken(token, accessToken);
    }
  } catch (error) {
    console.warn("HumanLink mobile push initialization failed", error);
  }
}

export { HUMANLINK_ALL_USERS_TOPIC };

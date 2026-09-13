import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

const HUMANLINK_ALL_USERS_TOPIC = "humanlink-all-users";

let initialized = false;

export async function initializeMobilePushNotifications() {
  if (initialized || !Capacitor.isNativePlatform()) return;
  initialized = true;

  try {
    const permission = await FirebaseMessaging.requestPermissions();
    if (permission.receive !== "granted") return;

    await FirebaseMessaging.getToken();
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
  } catch (error) {
    initialized = false;
    console.warn("HumanLink mobile push initialization failed", error);
  }
}

export { HUMANLINK_ALL_USERS_TOPIC };

import { useCallback, useEffect, useState } from "react";

/**
 * Foreground-only system notifications + audio ping.
 * No service worker — works while the tab/app is open. Safe in Lovable preview.
 */

const LS_KEY = "hl-notif-pref"; // "granted" | "denied" | "dismissed" | undefined

function isSupported() {
  return typeof window !== "undefined" && "Notification" in window;
}

let audioCtx: AudioContext | null = null;
function ping() {
  try {
    if (typeof window === "undefined") return;
    const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    const ctx = audioCtx!;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(1320, now + 0.12);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch {
    /* silent */
  }
}

export function useSystemNotifications() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    () => (isSupported() ? Notification.permission : "unsupported"),
  );
  const [dismissed, setDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(LS_KEY) === "dismissed";
  });

  useEffect(() => {
    if (!isSupported()) return;
    setPermission(Notification.permission);
  }, []);

  const request = useCallback(async () => {
    if (!isSupported()) return "unsupported" as const;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      localStorage.setItem(LS_KEY, res);
      return res;
    } catch {
      return "denied" as const;
    }
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try { localStorage.setItem(LS_KEY, "dismissed"); } catch {}
  }, []);

  return { permission, dismissed, request, dismiss, supported: isSupported() };
}

/** Fire a foreground system notification + audio ping. Safe to call anywhere. */
export function notifySystem(title: string, opts: { body?: string; tag?: string; icon?: string; silent?: boolean } = {}) {
  if (!opts.silent) ping();
  if (!isSupported()) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") {
    // Tab is focused — the in-app toast already surfaces this; skip OS toast to avoid double-noise.
    return;
  }
  try {
    new Notification(title, {
      body: opts.body,
      tag: opts.tag,
      icon: opts.icon || "/__l5e/assets-v1/292f435f-b711-4584-99b5-1bd62bcc5359/humanlink-logo.jpeg",
      badge: "/__l5e/assets-v1/292f435f-b711-4584-99b5-1bd62bcc5359/humanlink-logo.jpeg",
    });
  } catch {
    /* silent */
  }
}

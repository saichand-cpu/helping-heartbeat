import type { HumiAttachment } from "./humi-threads";

/** Hand-off buffer so the landing composer can post into a freshly created thread. */
let pending: { text: string; attachments: HumiAttachment[]; agent: string } | null = null;

export function setPendingSend(value: { text: string; attachments: HumiAttachment[]; agent: string }) {
  pending = value;
}

export function takePendingSend() {
  const value = pending;
  pending = null;
  return value;
}

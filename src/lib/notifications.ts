import type { Message, User } from "./types";

let permissionRequested = false;

export async function ensureNotificationPermission(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  if (permissionRequested) return false;
  permissionRequested = true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function showMessageNotification(
  message: Message,
  peer: User
): void {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  if (document.visibilityState === "visible") return;

  const title = peer.username;
  const body =
    message.content.length > 120
      ? `${message.content.slice(0, 117)}...`
      : message.content;

  try {
    const n = new Notification(title, {
      body,
      icon: "/icon.svg",
      tag: `eclipse-${peer.id}`,
    });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    /* ignore blocked notifications */
  }
}

export function playMessageSound(): void {
  if (typeof window === "undefined") return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
    osc.onended = () => ctx.close();
  } catch {
    /* audio not available */
  }
}

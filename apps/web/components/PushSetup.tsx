"use client";
import { useEffect, useState } from "react";

const toBytes = (b64: string) => {
  const p = "=".repeat((4 - (b64.length % 4)) % 4);
  return Uint8Array.from(atob((b64 + p).replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
};

export default function PushSetup() {
  const [state, setState] = useState<"idle" | "on" | "denied" | "ios" | "unsupported">("idle");
  const [install, setInstall] = useState<any>(null);

  useEffect(() => {
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js");
    const onInstall = (e: Event) => { e.preventDefault(); setInstall(e); };
    window.addEventListener("beforeinstallprompt", onInstall);
    const ios = /iphone|ipad/i.test(navigator.userAgent);
    const standalone = (navigator as any).standalone || matchMedia("(display-mode: standalone)").matches;
    if (ios && !standalone) setState("ios");
    else if (!("PushManager" in window)) setState("unsupported");
    else if (Notification.permission === "granted") setState("on");
    else if (Notification.permission === "denied") setState("denied");
    return () => window.removeEventListener("beforeinstallprompt", onInstall);
  }, []);

  async function enable() {
    if ((await Notification.requestPermission()) !== "granted") return setState("denied");
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toBytes(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) });
    await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub) });
    setState("on");
  }

  return (
    <>
      {install && <button className="btn ghost" onClick={async () => { install.prompt(); await install.userChoice; setInstall(null); }}>Installer l'app sur l'écran d'accueil</button>}
      {state === "idle" && <button className="btn" onClick={enable}>Activer les notifications</button>}
      {state === "on" && <small className="mute">Notifications activées sur cet appareil.</small>}
      {state === "ios" && <small className="mute">Pour les notifications : bouton Partager, « Sur l'écran d'accueil », puis ouvre l'app depuis l'icône.</small>}
      {state === "denied" && <small className="mute">Notifications bloquées : autorise-les dans les réglages du navigateur.</small>}
    </>
  );
}

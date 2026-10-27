"use client";
import { useEffect, useState } from "react";

const DONE = "kk-installed", SNOOZE = "kk-install-snooze", PAUSE = 3 * 24 * 3600 * 1000;
const get = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch {} };

// Invite les membres qui n'ont pas encore installé l'app à le faire dès leur connexion.
export default function InstallBanner() {
  const [mode, setMode] = useState<"prompt" | "ios" | "manual" | null>(null);
  const [evt, setEvt] = useState<any>(null);

  useEffect(() => {
    const standalone = (navigator as any).standalone || matchMedia("(display-mode: standalone)").matches;
    if (standalone) { set(DONE, "1"); return; }               // app ouverte depuis l'icône : installée
    if (get(DONE)) return;                                      // déjà installée sur cet appareil
    if (Date.now() - Number(get(SNOOZE) || 0) < PAUSE) return; // « Plus tard » récent

    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    setMode(ios ? "ios" : "manual");

    const onPrompt = (e: Event) => { e.preventDefault(); setEvt(e); setMode("prompt"); };
    const onInstalled = () => { set(DONE, "1"); setMode(null); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => { window.removeEventListener("beforeinstallprompt", onPrompt); window.removeEventListener("appinstalled", onInstalled); };
  }, []);

  if (!mode) return null;
  const later = () => { set(SNOOZE, String(Date.now())); setMode(null); };
  async function install() {
    if (!evt) return;
    evt.prompt();
    const { outcome } = await evt.userChoice;
    setEvt(null);
    if (outcome === "accepted") { set(DONE, "1"); setMode(null); } else later();
  }

  return (
    <div className="banner install" role="region" aria-label="Installer l'application">
      <strong>Installe l'app sur ton téléphone</strong>
      <p>Elle s'ouvre comme une vraie application, fonctionne hors ligne et permet de recevoir les rappels.</p>
      {mode === "prompt" && <button className="btn" onClick={install}>Installer l'app</button>}
      {mode === "ios" && <p>Touche le bouton <b>Partager</b> (le carré avec la flèche), puis <b>« Sur l'écran d'accueil »</b>, et ouvre l'app depuis son icône.</p>}
      {mode === "manual" && <p>Ouvre le menu de ton navigateur (<b>⋮</b>) puis choisis <b>« Installer l'application »</b> ou <b>« Ajouter à l'écran d'accueil »</b>.</p>}
      <button className="mini" onClick={later}>Plus tard</button>
    </div>
  );
}

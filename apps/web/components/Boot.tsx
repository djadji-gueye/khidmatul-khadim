"use client";
import { useEffect } from "react";

// Enregistre le service worker sur toutes les pages (mode hors ligne).
export default function Boot() {
  useEffect(() => { if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(() => {}); }, []);
  return null;
}

"use client";
import { useState } from "react";
export default function CopyLink({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return <button type="button" className="btn ghost" onClick={async () => { await navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}>{ok ? "Lien copié" : "Copier le lien"}</button>;
}

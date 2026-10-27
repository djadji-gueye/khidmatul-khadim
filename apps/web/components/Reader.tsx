"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confetti, toast } from "./Fx";
import { BISMILLAH, arDigits, juzUrl } from "@/lib/quran";

type Part = { s: number; n: string; t: string; f: number; bism: boolean; v: string[] };

// Lecture d'un juz : texte en cache (hors ligne), position mémorisée, écran gardé allumé.
export default function Reader({ juz }: { juz: number }) {
  const router = useRouter();
  const [parts, setParts] = useState<Part[] | null>(null);
  const [err, setErr] = useState(false);
  const [fs, setFs] = useState(28);
  const [pct, setPct] = useState(0);
  const [sid, setSid] = useState("");
  const POS = `kk-pos-${juz}`;
  const restored = useRef(false);

  useEffect(() => {
    setSid(new URLSearchParams(location.search).get("s") || "");
    const f = Number(localStorage.getItem("kk-fs"));
    if (f >= 20 && f <= 44) setFs(f);
    fetch(juzUrl(juz)).then((r) => r.json()).then((d) => setParts(d.parts)).catch(() => setErr(true));
  }, [juz]);

  // Reprend là où la personne s'était arrêtée
  useEffect(() => {
    if (!parts || restored.current) return;
    restored.current = true;
    const p = Number(localStorage.getItem(POS));
    if (p > 0 && p < 0.98) requestAnimationFrame(() => window.scrollTo(0, p * (document.documentElement.scrollHeight - innerHeight)));
  }, [parts, POS]);

  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight, p = max > 0 ? Math.min(1, scrollY / max) : 0;
        setPct(p);
        if (restored.current) localStorage.setItem(POS, String(p));
      });
    };
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, [POS]);

  // Écran allumé pendant la lecture
  useEffect(() => {
    let lock: any;
    const get = async () => { try { lock = await (navigator as any).wakeLock?.request("screen"); } catch {} };
    const vis = () => { if (document.visibilityState === "visible") get(); };
    get(); document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); lock?.release?.().catch?.(() => {}); };
  }, []);

  const size = (d: number) => { const n = Math.min(44, Math.max(20, fs + d)); setFs(n); localStorage.setItem("kk-fs", String(n)); };

  // Marque terminé : l'action est mise dans la file de l'accueil (fonctionne aussi hors ligne)
  function finish() {
    try {
      const q = JSON.parse(localStorage.getItem("kk-queue") || "[]").filter((o: { id: string }) => o.id !== sid);
      localStorage.setItem("kk-queue", JSON.stringify([...q, { id: sid, state: "DONE", excuse: "" }]));
      localStorage.removeItem(POS);
    } catch {}
    navigator.vibrate?.(30); confetti(); toast("Machallah ! Juz " + juz + " terminé. Barkelou Serigne Touba");
    router.push("/");
  }

  return (
    <main className="reader" style={{ ["--fs" as any]: `${fs}px` }}>
      <div className="rd-bar">
        <Link href="/" className="rd-back">← Retour</Link>
        <strong className="num">Juz {juz}</strong>
        <span className="rd-size"><button onClick={() => size(-2)} aria-label="Plus petit">A−</button><button onClick={() => size(2)} aria-label="Plus grand">A+</button></span>
        <i className="rd-prog" style={{ width: `${pct * 100}%` }} />
      </div>

      {err && <div className="card">Impossible de charger le texte. Ouvre l'app une fois avec internet, puis réessaie.</div>}
      {!parts && !err && <p className="mute" style={{ textAlign: "center" }}>Chargement…</p>}

      {parts?.map((p) => (
        <section key={p.s + "-" + p.f}>
          <div className="sura">
            <span className="rd-ar">{p.n}</span>
            <small>{p.f > 1 ? "Suite · " : ""}Sourate {p.s} · {p.t}</small>
          </div>
          {p.bism && <p className="bism rd-ar">{BISMILLAH}</p>}
          <p className="rd-text rd-ar" lang="ar" dir="rtl">
            {p.v.map((t, i) => <span key={i}>{t}<span className="vn">{arDigits(p.f + i)}</span> </span>)}
          </p>
        </section>
      ))}

      {parts && (
        <div className="rd-end">
          {sid ? <button className="btn" onClick={finish}>J'ai terminé le juz {juz}</button> : <Link href="/" className="btn">Retour</Link>}
          <small className="mute">Texte : The Noble Qur'an Encyclopedia (quranenc.com), via quran-json, CC BY-SA 4.0.</small>
        </div>
      )}
    </main>
  );
}

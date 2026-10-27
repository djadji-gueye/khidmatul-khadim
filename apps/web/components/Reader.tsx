"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { confetti, toast } from "./Fx";
import { BISMILLAH, Mark, arDigits, juzUrl, markKey, readMark } from "@/lib/quran";

type Part = { s: number; n: string; t: string; f: number; bism: boolean; v: string[] };

// Lecture d'un juz : texte en cache (hors ligne), marqueur « je m'arrête ici », écran gardé allumé.
export default function Reader({ juz }: { juz: number }) {
  const router = useRouter();
  const [parts, setParts] = useState<Part[] | null>(null);
  const [err, setErr] = useState(false);
  const [fs, setFs] = useState(28);
  const [pct, setPct] = useState(0);
  const [sid, setSid] = useState<string | null>(null);
  const [mark, setMark] = useState<Mark | null>(null);
  const [sel, setSel] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const jumped = useRef(false);

  const flat = useMemo(() => (parts ? parts.flatMap((p) => p.v.map((_, k) => ({ s: p.s, a: p.f + k }))) : []), [parts]);
  const offs = useMemo(() => { let o = 0; return (parts || []).map((p) => { const x = o; o += p.v.length; return x; }); }, [parts]);

  useEffect(() => {
    const s = new URLSearchParams(location.search).get("s") || "";
    setSid(s); setMark(readMark(juz, s));
    const f = Number(localStorage.getItem("kk-fs"));
    if (f >= 20 && f <= 44) setFs(f);
    fetch(juzUrl(juz)).then((r) => r.json()).then((d) => setParts(d.parts)).catch(() => setErr(true));
  }, [juz]);

  const goTo = (i: number) => document.querySelector(`[data-i="${i}"]`)?.scrollIntoView({ block: "center", behavior: "smooth" });

  // À l'ouverture : reprend au marqueur (après chargement de la police pour ne pas décaler)
  useEffect(() => {
    if (!parts || sid === null || jumped.current) return;
    jumped.current = true;
    if (!mark) return;
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      document.querySelector(`[data-i="${mark.i}"]`)?.scrollIntoView({ block: "center" });
      toast(`Reprise : sourate ${mark.s}, verset ${mark.a}`);
    });
  }, [parts, sid, mark]);

  // Progression + verset en haut de l'écran
  useEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - innerHeight;
        setPct(max > 0 ? Math.min(1, scrollY / max) : 0);
        const el = document.elementFromPoint(innerWidth / 2, 150)?.closest("[data-i]") as HTMLElement | null;
        if (el) setCur(Number(el.dataset.i));
      });
    };
    addEventListener("scroll", on, { passive: true });
    return () => { removeEventListener("scroll", on); cancelAnimationFrame(raf); };
  }, []);

  // Écran allumé pendant la lecture
  useEffect(() => {
    let lock: any;
    const get = async () => { try { lock = await (navigator as any).wakeLock?.request("screen"); } catch {} };
    const vis = () => { if (document.visibilityState === "visible") get(); };
    get(); document.addEventListener("visibilitychange", vis);
    return () => { document.removeEventListener("visibilitychange", vis); lock?.release?.().catch?.(() => {}); };
  }, []);

  const size = (d: number) => { const n = Math.min(44, Math.max(20, fs + d)); setFs(n); localStorage.setItem("kk-fs", String(n)); };

  function place(i: number) {
    const f = flat[i], m: Mark = { i, s: f.s, a: f.a, n: flat.length, sid: sid || "" };
    try { localStorage.setItem(markKey(juz), JSON.stringify(m)); } catch {}
    setMark(m); setSel(null); navigator.vibrate?.(20);
    toast(`Marqueur placé : sourate ${f.s}, verset ${f.a}`);
  }
  function unmark() { localStorage.removeItem(markKey(juz)); setMark(null); setSel(null); toast("Marqueur retiré"); }
  const pick = (i: number) => { if (!String(getSelection() || "")) setSel((s) => (s === i ? null : i)); };

  // Terminé : le marqueur disparaît ; l'action part dans la file de l'accueil (marche hors ligne)
  function finish() {
    try {
      const q = JSON.parse(localStorage.getItem("kk-queue") || "[]").filter((o: { id: string }) => o.id !== sid);
      localStorage.setItem("kk-queue", JSON.stringify([...q, { id: sid, state: "DONE", excuse: "" }]));
      localStorage.removeItem(markKey(juz));
    } catch {}
    navigator.vibrate?.(30); confetti(); toast("Machallah ! Juz " + juz + " terminé. Barkelou Serigne Touba");
    router.push("/");
  }

  const here = flat[cur];
  const selV = sel !== null ? flat[sel] : null;

  return (
    <main className="reader" style={{ ["--fs" as any]: `${fs}px` }}>
      <div className="rd-bar">
        <div className="rd-row">
          <Link href="/" className="rd-back">← Retour</Link>
          <strong className="num">Juz {juz}</strong>
          <span className="rd-size"><button onClick={() => size(-2)} aria-label="Plus petit">A−</button><button onClick={() => size(2)} aria-label="Plus grand">A+</button></span>
        </div>
        {parts && (
          <div className="rd-info">
            <span>{here ? `Sourate ${here.s} · verset ${here.a} · ${cur + 1}/${flat.length}` : ""}</span>
            {mark ? <button className="rd-jump" onClick={() => goTo(mark.i)}>Aller au marqueur</button> : <span>Touche un verset pour marquer</span>}
          </div>
        )}
        <i className="rd-prog" style={{ width: `${pct * 100}%` }} />
      </div>

      {err && <div className="card">Impossible de charger le texte. Ouvre l'app une fois avec internet, puis réessaie.</div>}
      {!parts && !err && <p className="mute" style={{ textAlign: "center" }}>Chargement…</p>}

      {parts?.map((p, pi) => (
        <section key={p.s + "-" + p.f}>
          <div className="sura">
            <span className="rd-ar">{p.n}</span>
            <small>{p.f > 1 ? "Suite · " : ""}Sourate {p.s} · {p.t}</small>
          </div>
          {p.bism && <p className="bism rd-ar">{BISMILLAH}</p>}
          <p className="rd-text rd-ar" lang="ar" dir="rtl">
            {p.v.map((t, k) => {
              const i = offs[pi] + k;
              return (
                <span key={k} data-i={i} className={`vs${mark?.i === i ? " marked" : ""}${sel === i ? " sel" : ""}`} onClick={() => pick(i)}>
                  {t}<span className="vn">{arDigits(p.f + k)}</span>{" "}
                </span>
              );
            })}
          </p>
        </section>
      ))}

      {parts && (
        <div className="rd-end">
          {sid ? <button className="btn" onClick={finish}>J'ai terminé le juz {juz}</button> : <Link href="/" className="btn">Retour</Link>}
          <small className="mute">Texte : The Noble Qur'an Encyclopedia (quranenc.com), via quran-json, CC BY-SA 4.0.</small>
        </div>
      )}

      {selV && sel !== null && (
        <div className="rd-sheet" role="dialog">
          <span>Sourate {selV.s} · verset {selV.a}</span>
          {mark?.i === sel
            ? <button className="mini" onClick={unmark}>Retirer le marqueur</button>
            : <button className="mini fill" onClick={() => place(sel)}>Je m'arrête ici</button>}
          <button className="mini" onClick={() => setSel(null)} aria-label="Fermer">✕</button>
        </div>
      )}
    </main>
  );
}

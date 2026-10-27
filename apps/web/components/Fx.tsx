"use client";
import { useEffect, useState } from "react";

type T = { id: number; msg: string; kind: "ok" | "err" };
let uid = 0;
export const toast = (msg: string, kind: "ok" | "err" = "ok") => window.dispatchEvent(new CustomEvent("kk-toast", { detail: { msg, kind } }));
export const confetti = () => window.dispatchEvent(new Event("kk-confetti"));
const COLORS = ["#5FD3A0", "#E0B84F", "#ffffff", "#2E8A66", "#F2D98A"];

// Bulles de message + confettis vert et or
export default function Fx() {
  const [ts, setTs] = useState<T[]>([]);
  const [bits, setBits] = useState<number[]>([]);
  useEffect(() => {
    const onToast = (e: Event) => {
      const { msg, kind } = (e as CustomEvent).detail, id = ++uid;
      setTs((x) => [...x.slice(-2), { id, msg, kind }]);
      setTimeout(() => setTs((x) => x.filter((t) => t.id !== id)), 2600);
    };
    const onConf = () => { const id = ++uid; setBits((b) => [...b, id]); setTimeout(() => setBits((b) => b.filter((x) => x !== id)), 3300); };
    window.addEventListener("kk-toast", onToast);
    window.addEventListener("kk-confetti", onConf);
    return () => { window.removeEventListener("kk-toast", onToast); window.removeEventListener("kk-confetti", onConf); };
  }, []);
  return (
    <>
      <div className="toasts" aria-live="polite">{ts.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.msg}</div>)}</div>
      {bits.map((id) => (
        <div key={id} className="confetti" aria-hidden>
          {Array.from({ length: 40 }, (_, i) => (
            <i key={i} style={{ left: `${(i * 2.5 + Math.random() * 2) % 100}%`, background: COLORS[i % 5], animationDelay: `${(i % 10) * 0.05}s`, animationDuration: `${1.8 + (i % 5) * 0.25}s`, ["--dx" as any]: `${((i % 7) - 3) * 18}px` }} />
          ))}
        </div>
      ))}
    </>
  );
}

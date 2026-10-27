"use client";
import { useCallback, useEffect, useState } from "react";
import Ring from "./Ring";
import Touba from "./Touba";
import { toast } from "./Fx";
import { call } from "@/lib/client";
import { fmt } from "@/lib/cycle";
import { wa } from "@/lib/wa";

type Row = { id: string; state: string; excuse: string | null; assignment: { juz: number; member: { id: string; name: string; phone: string | null } } };
type Ov = { cycle: { message: string; deadline: string } | null; open: boolean; rows: Row[] };
const LABEL: Record<string, string> = { PENDING: "En attente", DONE: "Terminé", EXCUSED: "Excusé" };
const DEFAULT_MSG = "Bismillah, la semaine est ouverte. Bonne lecture à tous, à terminer avant dimanche 18h.";

export default function AdminBoard({ initial, base }: { initial: Ov; base: string }) {
  const [ov, setOv] = useState<Ov>(initial);
  const [msg, setMsg] = useState(DEFAULT_MSG);
  const [remindMsg, setRemindMsg] = useState("");
  const [busy, setBusy] = useState("");

  const refresh = useCallback(async () => {
    const r = await call<Ov>("GET", "/admin/overview");
    if (r.ok && r.data) setOv(r.data);
  }, []);

  useEffect(() => {
    const t = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
    return () => clearInterval(t);
  }, [refresh]);

  const offline = () => { if (navigator.onLine) return false; toast("Hors ligne : reconnecte-toi pour modifier", "err"); return true; };

  // Terminer / réinitialiser pour un membre : l'écran change tout de suite
  async function setRow(r: Row, state: string) {
    if (offline()) return;
    setOv((o) => ({ ...o, rows: o.rows.map((x) => (x.id === r.id ? { ...x, state, excuse: null } : x)) }));
    if (state === "DONE") { navigator.vibrate?.(30); toast(`Juz ${r.assignment.juz} validé pour ${r.assignment.member.name}`); }
    else toast(`Juz ${r.assignment.juz} remis en attente`);
    const res = await call("PATCH", `/admin/statuses/${r.id}`, { state });
    if (!res.ok) { toast(res.data?.message || "Échec, réessaie", "err"); setOv((o) => ({ ...o, rows: o.rows.map((x) => (x.id === r.id ? r : x)) })); }
  }

  async function resetAll() {
    if (offline() || !confirm("Remettre tous les juz de la semaine en attente ?")) return;
    setOv((o) => ({ ...o, rows: o.rows.map((x) => ({ ...x, state: "PENDING", excuse: null })) }));
    const res = await call("POST", "/admin/reset");
    if (!res.ok) { toast("Échec, réessaie", "err"); refresh(); } else toast("Semaine réinitialisée");
  }

  async function openCycle() {
    if (offline()) return;
    setBusy("open");
    const res = await call("POST", "/admin/cycles", { message: msg });
    if (res.ok) { toast(`Semaine ouverte · ${res.data?.sent ?? 0} notification(s)`); await refresh(); } else toast(res.data?.message || "Échec", "err");
    setBusy("");
  }

  async function remind() {
    if (offline()) return;
    setBusy("remind");
    const res = await call("POST", "/admin/remind", { message: remindMsg });
    toast(res.ok ? `${res.data?.sent ?? 0} notification(s) envoyée(s)` : "Échec", res.ok ? "ok" : "err");
    setBusy("");
  }

  const { rows, cycle, open } = ov;
  const n = (s: string) => rows.filter((r) => r.state === s).length;
  const cells = Array.from({ length: 30 }, (_, i) => rows.find((r) => r.assignment.juz === i + 1)?.state || "NONE");
  const pending = Array.from(new Map(rows.filter((r) => r.state === "PENDING").map((r) => [r.assignment.member.id, r.assignment.member])).values());
  const remindText = `Rappel : pense à signaler ta lecture avant dimanche 18h. ${base}`;

  return (
    <main>
      <div className="top"><h1>Suivi de la semaine</h1><span className="ar" lang="ar" dir="rtl">خدمة الخديم</span></div>
      <section className="hero">
        <Ring cells={open ? cells : cells.map(() => "NONE")}><b className="num">{n("DONE")}</b><span>sur {rows.length} juz terminés</span></Ring>
        <p>{cycle ? `${open ? "Ouverte" : "Clôturée"} · échéance ${fmt(new Date(cycle.deadline))}` : "Aucune semaine ouverte"}</p>
        <Touba light={rows.length ? n("DONE") / rows.length : 0} />
      </section>
      <div className="stats"><div><b>{n("DONE")}</b>terminés</div><div><b>{n("EXCUSED")}</b>excusés</div><div><b>{n("PENDING")}</b>en attente</div></div>

      <section className="card">
        <h2>Donner le feu vert</h2>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} />
        <button className="btn" disabled={busy === "open"} onClick={openCycle}>{busy === "open" ? "Ouverture…" : "Ouvrir la semaine"}</button>
        {cycle?.message && <p><a href={wa(null, `${cycle.message} ${base}`)} target="_blank">Partager le dernier message sur WhatsApp</a></p>}
      </section>

      <section className="card">
        <h2>Relancer</h2>
        <input value={remindMsg} onChange={(e) => setRemindMsg(e.target.value)} placeholder="Message de rappel (facultatif)" />
        <button className="btn ghost" disabled={busy === "remind"} onClick={remind}>{busy === "remind" ? "Envoi…" : "Notifier ceux qui n'ont pas répondu"}</button>
        {pending.map((p) => <p key={p.id} style={{ margin: "10px 0 0" }}><a href={wa(p.phone, remindText)} target="_blank">Relancer {p.name} sur WhatsApp</a></p>)}
      </section>

      <section className="card">
        <div className="row"><h2 className="grow">Détail par juz</h2>{open && rows.length > 0 && <button className="mini" onClick={resetAll}>Tout réinitialiser</button>}</div>
        {rows.length === 0 && <p className="mute">Ouvre une semaine pour voir le suivi.</p>}
        {rows.map((r) => (
          <div key={r.id} className={`li ${r.state}`}>
            <i className="dot" /><strong style={{ width: 56 }}>Juz {r.assignment.juz}</strong>
            <span style={{ flex: 1 }}>{r.assignment.member.name}{r.excuse && <small> · {r.excuse}</small>}</span>
            <span className="pill">{LABEL[r.state]}</span>
            {open && (
              <div className="acts">
                {r.state !== "DONE" && <button className="mini fill" onClick={() => setRow(r, "DONE")}>Marquer terminé</button>}
                {r.state !== "PENDING" && <button className="mini" onClick={() => setRow(r, "PENDING")}>Réinitialiser</button>}
              </div>
            )}
          </div>
        ))}
      </section>
    </main>
  );
}

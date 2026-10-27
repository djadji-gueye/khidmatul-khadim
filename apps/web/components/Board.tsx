"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Ring from "./Ring";
import Touba from "./Touba";
import PushSetup from "./PushSetup";
import { confetti, toast } from "./Fx";
import { call } from "@/lib/client";
import { fmt } from "@/lib/cycle";

type Row = { id: string; juz: number; state: string; excuse: string | null };
type Data = { cycle: { message: string; deadline: string } | null; open: boolean; cells: string[]; mine: Row[] };
type Op = { id: string; state: string; excuse: string };

const LABEL: Record<string, string> = { PENDING: "En attente", DONE: "Terminé", EXCUSED: "Excusé" };
const PHRASES = ["Machallah !", "Barkelou Serigne Touba", "Jërëjëf ! Que Dieu accepte ta lecture", "Alhamdulillah, c'est fait !", "Bismillah, un juz de plus !"];
const KEY = "kk-data", QKEY = "kk-queue";

const read = <T,>(k: string, d: T): T => { try { return JSON.parse(localStorage.getItem(k) || "") as T; } catch { return d; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };
const left = (iso: string, now: number) => { const h = Math.max(0, Math.floor((new Date(iso).getTime() - now) / 36e5)); return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${h} h`; };

// Applique une action sur les données locales (mise à jour immédiate, sans attendre le serveur)
const apply = (d: Data, op: Op): Data => {
  const r = d.mine.find((x) => x.id === op.id);
  if (!r) return d;
  return {
    ...d,
    mine: d.mine.map((x) => (x.id === op.id ? { ...x, state: op.state, excuse: op.state === "EXCUSED" ? op.excuse || null : null } : x)),
    cells: d.cells.map((c, i) => (i + 1 === r.juz ? op.state : c)),
  };
};

function JuzCard({ r, act }: { r: Row; act: (r: Row, state: string, excuse?: string) => void }) {
  const [ex, setEx] = useState(r.excuse || "");
  return (
    <div className={`card juz ${r.state}`}>
      <div className="row">
        <div className="n num">{r.juz}</div>
        <div className="grow"><strong>Juz {r.juz}</strong><br /><span className="pill">{LABEL[r.state]}</span></div>
      </div>
      {r.excuse && <small>Motif : {r.excuse}</small>}
      {r.state === "DONE" ? (
        <button className="btn ghost" onClick={() => act(r, "PENDING")}>Annuler</button>
      ) : (
        <>
          <button className="btn" onClick={() => act(r, "DONE")}>J'ai terminé</button>
          <details>
            <summary className="btn ghost">Je suis excusé</summary>
            <input value={ex} onChange={(e) => setEx(e.target.value)} placeholder="Motif (facultatif)" />
            <button className="btn ghost" onClick={() => act(r, "EXCUSED", ex)}>Confirmer l'excuse</button>
          </details>
        </>
      )}
    </div>
  );
}

export default function Board({ name, initial, at }: { name: string; initial: Data | null; at: number }) {
  const [data, setData] = useState<Data | null>(initial);
  const [queue, setQueue] = useState<Op[]>([]);
  const [online, setOnline] = useState(true);
  const [now, setNow] = useState(at);
  const dr = useRef<Data | null>(initial);
  const q = useRef<Op[]>([]);
  const busy = useRef(false);

  const commit = useCallback((d: Data) => { dr.current = d; setData(d); write(KEY, { data: d, at: Date.now() }); }, []);

  const refresh = useCallback(async () => {
    if (q.current.length) return;
    const r = await call<Data>("GET", "/cycle");
    if (r.ok && r.data && !q.current.length) { commit(r.data); setOnline(true); }
    else if (r.status === 0) setOnline(false);
  }, [commit]);

  // Envoie les actions en attente, une par une, dans l'ordre
  const sync = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      while (q.current.length) {
        const op = q.current[0];
        const r = await call("PATCH", `/statuses/${op.id}`, { state: op.state, excuse: op.excuse });
        if (r.status === 0) { setOnline(false); break; }
        if (r.status >= 500) break; // serveur qui se réveille : on réessaie plus tard
        if (!r.ok) toast(r.status === 401 ? "Session expirée : rouvre ton lien d'invitation" : r.data?.message || "Action refusée", "err");
        q.current = q.current.filter((o) => o !== op);
        setQueue(q.current); write(QKEY, q.current); setOnline(true);
      }
    } finally { busy.current = false; }
    if (!q.current.length) await refresh();
  }, [refresh]);

  // Au chargement : reprend les données locales si elles sont plus récentes (hors ligne), puis synchronise
  useEffect(() => {
    const saved = read<{ data: Data; at: number } | null>(KEY, null);
    const pend = read<Op[]>(QKEY, []);
    let base = initial;
    if (saved && (!initial || saved.at > at)) base = saved.data;
    if (base) { for (const op of pend) base = apply(base, op); commit(base); }
    q.current = pend; setQueue(pend); setOnline(navigator.onLine); setNow(Date.now());
    sync();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const on = () => { setOnline(true); sync(); };
    const off = () => setOnline(false);
    const vis = () => { if (document.visibilityState === "visible") { setNow(Date.now()); sync(); } };
    window.addEventListener("online", on); window.addEventListener("offline", off); document.addEventListener("visibilitychange", vis);
    const t1 = setInterval(() => { setNow(Date.now()); if (q.current.length) sync(); }, 15000);
    const t2 = setInterval(() => { if (document.visibilityState === "visible") refresh(); }, 30000);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); document.removeEventListener("visibilitychange", vis); clearInterval(t1); clearInterval(t2); };
  }, [sync, refresh]);

  function act(r: Row, state: string, excuse = "") {
    if (!dr.current) return;
    const op = { id: r.id, state, excuse };
    const next = apply(dr.current, op);
    commit(next);
    q.current = [...q.current.filter((o) => o.id !== r.id), op];
    setQueue(q.current); write(QKEY, q.current);
    if (state === "DONE") {
      navigator.vibrate?.(30);
      if (next.cells.every((c) => c === "DONE")) { confetti(); toast("Machallah ! Les 30 juz sont terminés. Barkelou Serigne Touba"); }
      else if (next.mine.every((x) => x.state !== "PENDING")) { confetti(); toast("Tous tes juz sont terminés, jërëjëf !"); }
      else toast(PHRASES[Math.floor(Math.random() * PHRASES.length)]);
    }
    sync();
  }

  const cells = data?.cells ?? Array(30).fill("NONE");
  const rows = data?.mine ?? [];
  const open = !!data?.open && !!data.cycle && new Date(data.cycle.deadline).getTime() > now;
  const done = cells.filter((c) => c === "DONE").length, total = cells.filter((c) => c !== "NONE").length;

  return (
    <main>
      <div className="top"><div><small>Salam</small><h1>{name}</h1></div><span className="ar" lang="ar" dir="rtl">خدمة الخديم</span></div>
      {!online && <div className="banner">Hors ligne : tes changements sont gardés sur ton téléphone et partiront dès le retour du réseau.{queue.length > 0 && ` (${queue.length} en attente)`}</div>}
      {online && queue.length > 0 && <div className="banner">Envoi en cours…</div>}

      <section className="hero">
        <Ring cells={open ? cells : cells.map(() => "NONE")} mine={open ? rows.map((r) => r.juz) : []}>
          <b className="num">{open ? done : "–"}</b><span>{open ? `juz terminés sur ${total}` : "semaine fermée"}</span>
        </Ring>
        {data?.cycle && open ? (
          <>
            <p className="msg">{data.cycle.message}</p>
            <p>Échéance {fmt(new Date(data.cycle.deadline))} · reste {left(data.cycle.deadline, now)}</p>
            <div className="legend"><span><i style={{ background: "var(--mint)" }} />Terminé</span><span><i style={{ background: "#E0B84F" }} />Excusé</span><span><i style={{ background: "rgba(255,255,255,.35)" }} />En attente</span></div>
          </>
        ) : <p>Aucune semaine ouverte. Tu seras notifié quand le jewrign donnera le feu vert.</p>}
        <Touba light={open && total ? done / total : 0} />
      </section>

      {open && rows.length === 0 && <div className="card mute">Aucun juz ne t'est assigné cette semaine.</div>}
      {open && rows.map((r) => <JuzCard key={r.id + r.state} r={r} act={act} />)}
      <div className="card"><PushSetup /></div>
    </main>
  );
}

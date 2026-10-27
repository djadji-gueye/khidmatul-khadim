import { api, me } from "@/lib/api";
import { fmt } from "@/lib/cycle";
import { setStatus } from "./actions";
import PushSetup from "@/components/PushSetup";
import Ring from "@/components/Ring";

export const dynamic = "force-dynamic";
const LABEL: Record<string, string> = { PENDING: "En attente", DONE: "Terminé", EXCUSED: "Excusé" };
const left = (d: Date) => { const h = Math.max(0, Math.floor((d.getTime() - Date.now()) / 36e5)); return h >= 24 ? `${Math.floor(h / 24)} j ${h % 24} h` : `${h} h`; };

export default async function Home({ searchParams }: { searchParams: { lien?: string } }) {
  const m = await me();
  if (!m) return (
    <main><div className="card"><h1>Khidmatul Khadim</h1><p className="mute">{searchParams.lien ? "Ce lien d'invitation n'est pas valide. Demande-en un nouveau au jewrign." : "Ouvre le lien d'invitation que le jewrign t'a envoyé pour te connecter."}</p></div></main>
  );

  const data = await api("/cycle");
  const cycle = data?.cycle ? { ...data.cycle, deadline: new Date(data.cycle.deadline) } : null;
  const open = !!data?.open;
  const rows: { id: string; juz: number; state: string; excuse: string | null }[] = data?.mine || [];
  const cells: string[] = data?.cells || Array(30).fill("NONE");
  const done = cells.filter((c) => c === "DONE").length, total = cells.filter((c) => c !== "NONE").length;

  return (
    <main>
      <div className="top"><div><small>Salam</small><h1>{m.name}</h1></div></div>
      <section className="hero">
        <Ring cells={open ? cells : cells.map(() => "NONE")} mine={open ? rows.map((r) => r.juz) : []}>
          <b className="num">{open ? done : "–"}</b><span>{open ? `juz terminés sur ${total}` : "semaine fermée"}</span>
        </Ring>
        {cycle && open ? (<><p className="msg">{cycle.message}</p><p>Échéance {fmt(cycle.deadline)} · reste {left(cycle.deadline)}</p>
          <div className="legend"><span><i style={{ background: "var(--mint)" }} />Terminé</span><span><i style={{ background: "#E0B84F" }} />Excusé</span><span><i style={{ background: "rgba(255,255,255,.35)" }} />En attente</span></div></>)
          : <p>Aucune semaine ouverte. Tu seras notifié quand le jewrign donnera le feu vert.</p>}
      </section>

      {open && rows.length === 0 && <div className="card mute">Aucun juz ne t'est assigné cette semaine.</div>}
      {open && rows.map((r) => (
        <form key={r.id} action={setStatus} className={`card juz ${r.state}`}>
          <input type="hidden" name="statusId" value={r.id} />
          <div className="row">
            <div className="n num">{r.juz}</div>
            <div className="grow"><strong>Juz {r.juz}</strong><br /><span className="pill">{LABEL[r.state]}</span></div>
          </div>
          {r.excuse && <small>Motif : {r.excuse}</small>}
          {r.state === "DONE" ? <button className="btn ghost" name="state" value="PENDING">Annuler</button> : (
            <>
              <button className="btn" name="state" value="DONE">J'ai terminé</button>
              <details>
                <summary className="btn ghost">Je suis excusé</summary>
                <input name="excuse" placeholder="Motif (facultatif)" defaultValue={r.excuse || ""} />
                <button className="btn ghost" name="state" value="EXCUSED">Confirmer l'excuse</button>
              </details>
            </>
          )}
        </form>
      ))}
      <div className="card"><PushSetup /></div>
    </main>
  );
}

import { headers } from "next/headers";
import { api, me } from "@/lib/api";
import { fmt } from "@/lib/cycle";
import { openCycle, remind, addMember, assignJuz } from "../actions";
import Ring from "@/components/Ring";
import CopyLink from "@/components/CopyLink";

export const dynamic = "force-dynamic";
const LABEL: Record<string, string> = { PENDING: "En attente", DONE: "Terminé", EXCUSED: "Excusé" };
const num = (p: string | null) => { let d = (p || "").replace(/\D/g, "").replace(/^00/, ""); return d.length === 9 ? "221" + d : d; };
const wa = (phone: string | null, text: string) => `https://wa.me/${num(phone)}?text=${encodeURIComponent(text)}`;

export default async function Admin({ searchParams }: { searchParams: { v?: string } }) {
  const m = await me();
  if (!m?.isAdmin) return <main><div className="card">Accès réservé à l'admin.</div></main>;

  const h = headers();
  const base = `${h.get("x-forwarded-proto") || "http"}://${h.get("host")}`;
  const ov = await api("/admin/overview");
  const cycle = ov?.cycle ? { ...ov.cycle, deadline: new Date(ov.cycle.deadline) } : null;
  const open = !!ov?.open;
  const rows: any[] = ov?.rows || [];
  const members: any[] = (await api("/admin/members")) || [];
  const n = (s: string) => rows.filter((r) => r.state === s).length;
  const cells = Array.from({ length: 30 }, (_, i) => rows.find((r) => r.assignment.juz === i + 1)?.state || "NONE");
  const pending = Array.from(new Map(rows.filter((r) => r.state === "PENDING").map((r) => [r.assignment.member.id, r.assignment.member])).values());
  const assigned = new Set(members.flatMap((x) => x.assignments.map((a) => a.juz)));
  const free = Array.from({ length: 30 }, (_, i) => i + 1).filter((j) => !assigned.has(j));
  const remindText = `Rappel : pense à signaler ta lecture avant dimanche 18h. ${base}`;

  if (searchParams.v === "membres") return (
    <main>
      <div className="top"><h1>Membres</h1></div>
      <section className="card">
        <h2>Assigner un juz</h2>
        {free.length > 0 && <p className="mute">Sans membre : juz {free.join(", ")}</p>}
        <form action={assignJuz}>
          <div className="two">
            <input name="juz" type="number" inputMode="numeric" min={1} max={30} placeholder="Juz (1-30)" required />
            <select name="memberId">{members.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          </div>
          <button className="btn">Assigner</button>
        </form>
      </section>
      <section className="card">
        <h2>Ajouter un membre</h2>
        <form action={addMember}>
          <input name="name" placeholder="Nom" required />
          <input name="phone" inputMode="tel" placeholder="Téléphone (ex : 22177…)" />
          <label className="row"><input type="checkbox" name="isAdmin" style={{ width: 24, minHeight: 24 }} /> Admin</label>
          <button className="btn">Ajouter</button>
        </form>
      </section>
      {members.map((x) => {
        const link = `${base}/join/${x.inviteToken}`;
        return (
          <div key={x.id} className="card">
            <strong>{x.name}</strong>{x.isAdmin && <span className="pill" style={{ marginLeft: 8 }}>Admin</span>}
            <p className="mute" style={{ margin: "2px 0 8px" }}>Juz {x.assignments.map((a) => a.juz).sort((a, b) => a - b).join(", ") || "aucun"}</p>
            <p className="link"><a href={link}>{link}</a></p>
            <CopyLink text={link} />
            <a className="btn ghost" href={wa(x.phone, `Salam ${x.name}, voici ton lien personnel pour l'app Khidmatul Khadim : ${link}`)} target="_blank">Envoyer l'invitation sur WhatsApp</a>
          </div>
        );
      })}
    </main>
  );

  return (
    <main>
      <div className="top"><h1>Suivi de la semaine</h1></div>
      <section className="hero">
        <Ring cells={open ? cells : cells.map(() => "NONE")}><b className="num">{n("DONE")}</b><span>sur {rows.length} juz terminés</span></Ring>
        <p>{cycle ? `${open ? "Ouverte" : "Clôturée"} · échéance ${fmt(cycle.deadline)}` : "Aucune semaine ouverte"}</p>
      </section>
      <div className="stats"><div><b>{n("DONE")}</b>terminés</div><div><b>{n("EXCUSED")}</b>excusés</div><div><b>{n("PENDING")}</b>en attente</div></div>

      <section className="card">
        <h2>Donner le feu vert</h2>
        <form action={openCycle}>
          <textarea name="message" defaultValue="Bismillah, la semaine est ouverte. Bonne lecture à tous, à terminer avant dimanche 18h." />
          <button className="btn">Ouvrir la semaine</button>
        </form>
        {cycle?.message && <p><a href={wa(null, `${cycle.message} ${base}`)} target="_blank">Partager le dernier message sur WhatsApp</a></p>}
      </section>

      <section className="card">
        <h2>Relancer</h2>
        <form action={remind}>
          <input name="message" placeholder="Message de rappel (facultatif)" />
          <button className="btn ghost">Notifier ceux qui n'ont pas répondu</button>
        </form>
        {pending.map((p) => <p key={p.id} style={{ margin: "10px 0 0" }}><a href={wa(p.phone, remindText)} target="_blank">Relancer {p.name} sur WhatsApp</a></p>)}
      </section>

      <section className="card">
        <h2>Détail par juz</h2>
        {rows.length === 0 && <p className="mute">Ouvre une semaine pour voir le suivi.</p>}
        {rows.map((r) => (
          <div key={r.id} className={`li ${r.state}`}>
            <i className="dot" /><strong style={{ width: 56 }}>Juz {r.assignment.juz}</strong>
            <span className="grow" style={{ flex: 1 }}>{r.assignment.member.name}{r.excuse && <small> · {r.excuse}</small>}</span>
            <span className="pill">{LABEL[r.state]}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

"use client";
import { useState } from "react";
import CopyLink from "./CopyLink";
import { toast } from "./Fx";
import { call } from "@/lib/client";
import { wa } from "@/lib/wa";

type M = { id: string; name: string; phone: string | null; isAdmin: boolean; inviteToken: string; assignments: { juz: number }[] };
const JUZ = Array.from({ length: 30 }, (_, i) => i + 1);
const byName = (a: M, b: M) => a.name.localeCompare(b.name, "fr");

export default function MembersAdmin({ initial, base }: { initial: M[]; base: string }) {
  const [ms, setMs] = useState<M[]>(initial);
  const [form, setForm] = useState({ name: "", phone: "", isAdmin: false });
  const [adding, setAdding] = useState(false);

  const owner = new Map<number, M>();
  ms.forEach((m) => m.assignments.forEach((a) => owner.set(a.juz, m)));
  const free = JUZ.filter((j) => !owner.has(j));

  const offline = () => { if (navigator.onLine) return false; toast("Hors ligne : reconnecte-toi pour modifier", "err"); return true; };
  async function reload() { const r = await call<M[]>("GET", "/admin/members"); if (r.ok && r.data) setMs(r.data); }

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (offline() || !form.name.trim()) return;
    setAdding(true);
    const r = await call("POST", "/admin/members", form);
    if (r.ok && r.data?.member) { setMs((l) => [...l, r.data.member].sort(byName)); setForm({ name: "", phone: "", isAdmin: false }); toast("Membre ajouté"); }
    else toast(r.data?.message || "Échec", "err");
    setAdding(false);
  }

  async function save(m: M, patch: { name: string; phone: string; isAdmin: boolean }) {
    if (offline()) return false;
    setMs((l) => l.map((x) => (x.id === m.id ? { ...x, ...patch, phone: patch.phone.trim() || null, name: patch.name.trim() } : x)).sort(byName));
    const r = await call("PATCH", `/admin/members/${m.id}`, patch);
    if (!r.ok) { toast(r.data?.message || "Échec, réessaie", "err"); reload(); return false; }
    toast("Modifications enregistrées");
    return true;
  }

  async function take(m: M, juz: number) {
    const o = owner.get(juz);
    if (o?.id === m.id || offline()) return;
    if (o && !confirm(`Le juz ${juz} est à ${o.name}. Le donner à ${m.name} ?`)) return;
    setMs((l) => l.map((x) => (x.id === m.id ? { ...x, assignments: [...x.assignments, { juz }] } : { ...x, assignments: x.assignments.filter((a) => a.juz !== juz) })));
    const r = await call("POST", "/admin/assignments", { juz, memberId: m.id });
    if (r.ok) toast(`Juz ${juz} → ${m.name}`); else { toast("Échec, réessaie", "err"); reload(); }
  }

  return (
    <main>
      <div className="top"><h1>Membres</h1><span className="ar" lang="ar" dir="rtl">خدمة الخديم</span></div>
      <section className="card">
        <h2>Ajouter un membre</h2>
        <form onSubmit={add}>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nom" required />
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="Téléphone (ex : 22177…)" />
          <label className="row"><input type="checkbox" checked={form.isAdmin} onChange={(e) => setForm({ ...form, isAdmin: e.target.checked })} style={{ width: 24, minHeight: 24 }} /> Admin</label>
          <button className="btn" disabled={adding}>{adding ? "Ajout…" : "Ajouter"}</button>
        </form>
        {free.length > 0 && <p className="mute">Juz sans membre : {free.join(", ")}. Ouvre un membre, « Modifier », puis touche le juz.</p>}
      </section>
      {ms.map((m) => <MemberCard key={m.id} m={m} base={base} owner={owner} save={save} take={take} />)}
    </main>
  );
}

function MemberCard({ m, base, owner, save, take }: { m: M; base: string; owner: Map<number, M>; save: (m: M, p: { name: string; phone: string; isAdmin: boolean }) => Promise<boolean>; take: (m: M, j: number) => void }) {
  const [edit, setEdit] = useState(false);
  const [f, setF] = useState({ name: m.name, phone: m.phone || "", isAdmin: m.isAdmin });
  const link = `${base}/join/${m.inviteToken}`;
  const mine = m.assignments.map((a) => a.juz).sort((a, b) => a - b);

  return (
    <div className="card">
      <div className="row">
        <div className="grow"><strong>{m.name}</strong>{m.isAdmin && <span className="pill" style={{ marginLeft: 8 }}>Admin</span>}</div>
        <button className="mini" onClick={() => setEdit(!edit)}>{edit ? "Fermer" : "Modifier"}</button>
      </div>
      <p className="mute" style={{ margin: "2px 0 8px" }}>Juz {mine.join(", ") || "aucun"}</p>

      {edit && (
        <div className="edit">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Nom" />
          <input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} inputMode="tel" placeholder="Téléphone" />
          <label className="row"><input type="checkbox" checked={f.isAdmin} onChange={(e) => setF({ ...f, isAdmin: e.target.checked })} style={{ width: 24, minHeight: 24 }} /> Admin</label>
          <button className="btn" onClick={async () => { if (await save(m, f)) setEdit(false); }}>Enregistrer</button>
          <h2 style={{ marginTop: 6 }}>Ses juz</h2>
          <p className="mute" style={{ margin: 0 }}>Touche un juz pour le donner à {m.name}. Pour en retirer un, donne-le à un autre membre.</p>
          <div className="juzgrid">
            {JUZ.map((j) => {
              const o = owner.get(j), cls = !o ? "free" : o.id === m.id ? "mine" : "other";
              return <button key={j} type="button" className={`chip ${cls}`} title={o ? o.name : "Sans membre"} onClick={() => take(m, j)}>{j}</button>;
            })}
          </div>
        </div>
      )}

      <p className="link"><a href={link}>{link}</a></p>
      <CopyLink text={link} />
      <a className="btn ghost" href={wa(m.phone, `Salam ${m.name}, voici ton lien personnel pour l'app Khidmatul Khadim : ${link}`)} target="_blank">Envoyer l'invitation sur WhatsApp</a>
    </div>
  );
}

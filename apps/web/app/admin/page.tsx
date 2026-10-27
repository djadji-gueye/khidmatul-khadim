import { headers } from "next/headers";
import { api, me } from "@/lib/api";
import AdminBoard from "@/components/AdminBoard";
import MembersAdmin from "@/components/MembersAdmin";

export const dynamic = "force-dynamic";

export default async function Admin({ searchParams }: { searchParams: { v?: string } }) {
  const membres = searchParams.v === "membres";
  const [m, ov, members] = await Promise.all([me(), membres ? null : api("/admin/overview"), api("/admin/members")]);
  if (!m?.isAdmin) return <main><div className="card">Accès réservé à l'admin.</div></main>;

  const h = headers();
  const base = `${h.get("x-forwarded-proto") || "http"}://${h.get("host")}`;
  return membres
    ? <MembersAdmin initial={members || []} base={base} />
    : <AdminBoard initial={ov || { cycle: null, open: false, rows: [] }} base={base} />;
}

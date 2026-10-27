import { api, me } from "@/lib/api";
import Board from "@/components/Board";

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: { searchParams: { lien?: string } }) {
  const [m, data] = await Promise.all([me(), api("/cycle")]);
  if (!m) return (
    <main><div className="card"><h1>Khidmatul Khadim</h1><p className="mute">{searchParams.lien ? "Ce lien d'invitation n'est pas valide. Demande-en un nouveau au jewrign." : "Ouvre le lien d'invitation que le jewrign t'a envoyé pour te connecter."}</p></div></main>
  );
  return <Board name={m.name} initial={data} at={Date.now()} />;
}

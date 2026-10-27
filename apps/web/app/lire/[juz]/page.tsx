import { notFound } from "next/navigation";
import Reader from "@/components/Reader";

export default function Lire({ params }: { params: { juz: string } }) {
  const j = Number(params.juz);
  if (!Number.isInteger(j) || j < 1 || j > 30) notFound();
  return <Reader juz={j} />;
}

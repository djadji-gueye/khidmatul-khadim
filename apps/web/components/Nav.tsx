"use client";
import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function Items() {
  const p = usePathname(), v = useSearchParams().get("v");
  const items: [string, string, boolean][] = [
    ["/", "Mes juz", p === "/"],
    ["/admin", "Suivi", p === "/admin" && v !== "membres"],
    ["/admin?v=membres", "Membres", p === "/admin" && v === "membres"],
  ];
  return <nav className="tabs">{items.map(([h, l, on]) => <Link key={h} href={h} className={on ? "on" : ""}>{l}</Link>)}</nav>;
}
export default function Nav() { return <Suspense fallback={null}><Items /></Suspense>; }

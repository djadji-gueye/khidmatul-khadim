import { NextResponse } from "next/server";
import { api } from "@/lib/api";

export async function POST(req: Request) {
  const r = await api("/push", { method: "POST", body: JSON.stringify(await req.json()) });
  return NextResponse.json(r || { error: "non connecté" }, { status: r ? 200 : 401 });
}

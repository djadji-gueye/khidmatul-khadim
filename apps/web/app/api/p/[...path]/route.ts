import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Relais navigateur -> API NestJS (le jeton reste dans le cookie httpOnly).
async function proxy(req: Request, { params }: { params: { path: string[] } }) {
  const t = cookies().get("kk")?.value;
  const body = req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  try {
    const r = await fetch(`${process.env.API_URL}/${params.path.join("/")}${new URL(req.url).search}`, {
      method: req.method,
      body,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}) },
    });
    return new NextResponse(await r.text(), { status: r.status, headers: { "Content-Type": "application/json" } });
  } catch {
    return NextResponse.json({ message: "API injoignable" }, { status: 502 });
  }
}
export { proxy as GET, proxy as POST, proxy as PATCH, proxy as DELETE };

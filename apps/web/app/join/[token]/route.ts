import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const ok = (await fetch(`${process.env.API_URL}/auth/join/${params.token}`, { cache: "no-store" }).catch(() => null))?.ok;
  const h = req.headers, origin = `${h.get("x-forwarded-proto") || "http"}://${h.get("x-forwarded-host") || h.get("host")}`;
  const res = NextResponse.redirect(new URL(ok ? "/" : "/?lien=invalide", origin));
  if (ok) res.cookies.set("kk", params.token, { httpOnly: true, secure: origin.startsWith("https"), sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 365 });
  return res;
}

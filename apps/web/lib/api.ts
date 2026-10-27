import { cookies } from "next/headers";

// Appel serveur -> API NestJS. Le jeton d'invitation (cookie httpOnly) sert de Bearer.
export async function api<T = any>(path: string, init: RequestInit = {}): Promise<T | null> {
  const t = cookies().get("kk")?.value;
  try {
    const res = await fetch(process.env.API_URL + path, {
      ...init,
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(t ? { Authorization: `Bearer ${t}` } : {}), ...init.headers },
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}
export const me = () => api<{ id: string; name: string; isAdmin: boolean }>("/me");

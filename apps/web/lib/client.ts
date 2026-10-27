// Appels depuis le navigateur (via /api/p). status 0 = pas de réseau.
export type Res<T = any> = { ok: boolean; status: number; data: T | null };
export async function call<T = any>(method: string, path: string, body?: object): Promise<Res<T>> {
  try {
    const r = await fetch(`/api/p${path}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    return { ok: r.ok, status: r.status, data: await r.json().catch(() => null) };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

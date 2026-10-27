export const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
export const STATIC_CACHE = "kk-static-v4";
// Marqueur de lecture : « je m'arrête ici » (par juz, sur cet appareil). Valable pour la semaine (sid) en cours.
export type Mark = { i: number; s: number; a: number; n: number; sid: string };
export const markKey = (juz: number) => `kk-mark-${juz}`;
export function readMark(juz: number, sid: string): Mark | null {
  try {
    const x = JSON.parse(localStorage.getItem(markKey(juz)) || "null") as Mark | null;
    if (!x || (sid && x.sid && x.sid !== sid)) return null;
    return x;
  } catch { return null; }
}
export const juzUrl = (n: number) => `/quran/juz-${n}.json`;
export const arDigits = (n: number) => String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);

// Garde en cache (hors ligne) le texte des juz et la police coranique ; appelé en ligne uniquement.
export async function prefetchJuz(list: number[]) {
  try {
    if (!("caches" in window)) return;
    const c = await caches.open(STATIC_CACHE);
    for (const n of list) if (!(await c.match(juzUrl(n)))) await c.add(juzUrl(n));
    await document.fonts.load('28px "Amiri Quran"', BISMILLAH);
  } catch {}
}

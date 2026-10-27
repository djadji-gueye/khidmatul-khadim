export const BISMILLAH = "بِسۡمِ ٱللَّهِ ٱلرَّحۡمَٰنِ ٱلرَّحِيمِ";
export const STATIC_CACHE = "kk-static-v4";
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

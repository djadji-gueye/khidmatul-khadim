// Hors ligne : pages en réseau d'abord (copie gardée), fichiers statiques en cache.
const SHELL = "kk-shell-v3", STATIC = "kk-static-v3";
const OFFLINE = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0C2E24;color:#fff;display:grid;place-content:center;height:100vh;text-align:center;padding:24px"><h1>Hors ligne</h1><p>Ouvre l\'app une fois avec internet pour l\'utiliser ensuite sans réseau.</p>';

self.addEventListener("install", (e) => { e.waitUntil(caches.open(STATIC).then((c) => c.addAll(["/icon-192.png", "/icon-512.png"]))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== SHELL && x !== STATIC).map((x) => caches.delete(x)))).then(() => clients.claim())); });

async function page(req) {
  const cache = await caches.open(SHELL);
  const hit = await cache.match(req);
  const net = fetch(req).then((res) => { if (res.ok && !res.redirected) cache.put(req, res.clone()); return res; });
  net.catch(() => {});
  try { return await Promise.race([net, new Promise((_, no) => setTimeout(no, hit ? 2500 : 20000))]); }
  catch { return hit || new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } }); }
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== "GET") return;
  if (u.origin === location.origin) {
    if (u.pathname.startsWith("/api/") || u.pathname.startsWith("/join/")) return;
    if (r.mode === "navigate") return e.respondWith(page(r));
    if (u.pathname.startsWith("/_next/static/") || /\/icon-/.test(u.pathname)) return e.respondWith(cacheFirst(r, STATIC));
  } else if (u.hostname === "fonts.googleapis.com" || u.hostname === "fonts.gstatic.com") {
    e.respondWith(cacheFirst(r, STATIC).catch(() => fetch(r)));
  }
});

self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Khidmatul Khadim", body: "" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [120, 60, 120] }));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.openWindow("/")); });

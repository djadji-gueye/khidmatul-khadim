const C = "kk-v2";
const OFFLINE = '<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><body style="font:16px system-ui;background:#0C2E24;color:#fff;display:grid;place-content:center;height:100vh;text-align:center;padding:24px"><h1>Hors ligne</h1><p>Reconnecte-toi à internet pour mettre à jour ton suivi.</p>';
self.addEventListener("install", (e) => { e.waitUntil(caches.open(C).then((c) => c.addAll(["/icon-192.png", "/icon-512.png"]))); self.skipWaiting(); });
self.addEventListener("activate", (e) => { e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => clients.claim())); });
self.addEventListener("fetch", (e) => {
  if (e.request.mode === "navigate") e.respondWith(fetch(e.request).catch(() => new Response(OFFLINE, { headers: { "Content-Type": "text/html; charset=utf-8" } })));
  else if (e.request.method === "GET" && /\/icon-/.test(e.request.url)) e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request)));
});
self.addEventListener("push", (e) => {
  const d = e.data ? e.data.json() : { title: "Khidmatul Khadim", body: "" };
  e.waitUntil(self.registration.showNotification(d.title, { body: d.body, icon: "/icon-192.png", badge: "/icon-192.png", vibrate: [120, 60, 120] }));
});
self.addEventListener("notificationclick", (e) => { e.notification.close(); e.waitUntil(clients.openWindow("/")); });

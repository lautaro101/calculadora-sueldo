/* Service worker de "Mi Recibo": deja usar la app sin conexión.
   Si cambiás index.html, subí el archivo y listo: con internet siempre baja la versión nueva. */
const VERSION = "2.1.4";                                  // misma que APP_VERSION en index.html
const V = "mi-recibo-v" + VERSION;
const AV = "calc-avisos";                               // aquí se guardan los próximos avisos (no se borra al actualizar)
const SHELL = ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V && k !== AV).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;            // Google, Microsoft y demás: no se tocan
  if (r.mode === "navigate") {                          // la página: primero internet, y si no hay, la guardada
    e.respondWith(fetch(r).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put("./", cp)); }
      return res;
    }).catch(() => caches.match("./")));
    return;
  }
  e.respondWith(caches.match(r).then(hit => hit || fetch(r).then(res => {   // el resto: lo guardado, y si no, internet
    if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(r, cp)); }
    return res;
  })));
});

// ---------- avisos: cierre de quincena y cobro ----------
// La página guarda acá la lista de los próximos eventos {f: "AAAA-MM-DD", t: título, c: texto}. Cuando Android despierta al service worker
// (periodicsync, más o menos una vez al día, o cuando abrís la app) se muestran los de hoy y los de mañana, una sola vez cada uno.
const ymdL = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
function avisosPendientes(eventos, ahora, avisados) {
  const hoy = ymdL(ahora), man = ymdL(new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1)), ya = new Set(avisados), out = [];
  (eventos || []).forEach(e => {
    const cuando = e.f === hoy ? "hoy" : e.f === man ? "man" : "";
    if (!cuando) return;
    const key = e.f + "|" + e.t + "|" + cuando; if (ya.has(key)) return;
    out.push({key, titulo: (cuando === "hoy" ? "Hoy: " : "Mañana: ") + e.t, cuerpo: e.c || ""});
  });
  return out;
}
async function leerAv(n, def) { try { const r = await (await caches.open(AV)).match(n); return r ? await r.json() : def; } catch (e) { return def; } }
async function guardarAv(n, v) { const c = await caches.open(AV); await c.put(n, new Response(JSON.stringify(v), {headers: {"content-type": "application/json"}})); }
async function revisarAvisos() {
  if (!self.Notification || Notification.permission !== "granted") return;
  const ev = await leerAv("avisos.json", []), ya = await leerAv("avisados.json", []), p = avisosPendientes(ev, new Date(), ya);
  for (const a of p) { await self.registration.showNotification(a.titulo, {body: a.cuerpo, icon: "icon-192.png", badge: "icon-192.png", tag: a.key}); ya.push(a.key); }
  if (p.length) await guardarAv("avisados.json", ya.slice(-80));
}
self.addEventListener("periodicsync", e => { if (e.tag === "avisos") e.waitUntil(revisarAvisos()); });
self.addEventListener("message", e => {
  if (e.data && e.data.tipo === "avisos") e.waitUntil(guardarAv("avisos.json", e.data.eventos || []).then(revisarAvisos));
  if (e.data && e.data.tipo === "prueba" && self.Notification && Notification.permission === "granted") e.waitUntil(self.registration.showNotification("Así te va a avisar", {body: "Cuando cierre la quincena o se acerque tu cobro, vas a ver un mensaje como este.", icon: "icon-192.png", tag: "prueba"}));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(l => l.length ? l[0].focus() : self.clients.openWindow("./")));
});

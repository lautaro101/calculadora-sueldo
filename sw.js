/* Service worker de "Mi Recibo": deja usar la app sin conexión y avisa cuando hay una versión nueva.
   La versión se cambia SOLO en version.js. Subí version.js, index.html y sw.js y, al abrir la app, aparece el aviso con el botón «Actualizar». */
try { importScripts("version.js"); } catch (e) {}                 // define self.APP_VERSION
const VERSION = self.APP_VERSION || "sin-version";
const PREF = "mi-recibo-";                             // todas las cachés de ESTA app empiezan así: en usuario.github.io hay otras apps con su propia caché y no se tocan
const V = PREF + "v" + VERSION;
const BASE = (() => { try { return new URL("./", self.location.href).pathname; } catch (e) { return "/"; } })();   // la carpeta de esta app (por ej. /calculadora-sueldo/): este service worker no toca nada fuera de ella
const AV = "calc-avisos";                               // aquí se guardan los próximos avisos (no se borra al actualizar)
const SHELL = ["./", "./version.js", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];
const fresco = u => /\/(index\.html|version\.js)?$/.test(u.pathname);   // la página y version.js: siempre se pide a internet primero

self.addEventListener("install", e => {
  // sin skipWaiting: la versión nueva espera a que toques «Actualizar» en la app
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL.map(u => new Request(u, {cache: "reload"})))));
});
self.addEventListener("activate", e => {
  // solo se borran las cachés viejas de ESTA app (prefijo PREF); «calc-avisos» no empieza así, así que se conserva, y las de otras apps del mismo dominio ni se miran
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith(PREF) && k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  const r = e.request;
  if (r.method !== "GET") return;
  const u = new URL(r.url);
  if (u.origin !== location.origin) return;            // Google, Microsoft y demás: no se tocan
  if (!u.pathname.startsWith(BASE)) return;            // otra app del mismo dominio (otra carpeta): no se toca
  if (r.mode === "navigate" || fresco(u)) {             // la página y version.js: primero internet (revalidando), y si no hay, la guardada
    const clave = r.mode === "navigate" ? "./" : r;
    // primero internet, pero con tope: si en 1,5 segundos no respondió (señal mala), se abre con la copia guardada y la red sigue por detrás actualizándola
    const red = fetch(new Request(r, {cache: "no-cache"})).then(res => {
      if (res.ok) { const cp = res.clone(); caches.open(V).then(c => c.put(clave, cp)); }
      return res;
    });
    const lenta = new Promise(ok => setTimeout(() => ok(null), 1500));
    e.waitUntil(red.catch(() => {}));
    e.respondWith(Promise.race([red.catch(() => null), lenta]).then(res => res || caches.match(clave, {cacheName: V}).then(hit => hit || red)));
    return;
  }
  e.respondWith(caches.match(r, {cacheName: V}).then(hit => hit || fetch(r).then(res => {   // el resto: lo guardado, y si no, internet
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
    if (Array.isArray(e.av) && e.av.length) {         // avisos con anticipación (feriados): por ejemplo 7, 3 y 1 día antes; si un día no se abrió la app, se avisa al abrirla
      const [a, m, d] = String(e.f).split("-").map(Number), dias = Math.round((new Date(a, m - 1, d) - new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate())) / 864e5);
      const n = e.av.filter(x => dias >= 1 && dias <= x).sort((x, y) => x - y)[0]; if (!n) return;
      const key = e.f + "|" + e.t + "|antes" + n; if (ya.has(key)) return;
      out.push({key, titulo: (dias === 1 ? "Mañana: " : "En " + dias + " días: ") + e.t, cuerpo: e.c || ""}); return;
    }
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
  if (e.data && e.data.tipo === "actualizar") { self.skipWaiting(); return; }   // botón «Actualizar» de la app
  if (e.data && e.data.tipo === "avisos") e.waitUntil(guardarAv("avisos.json", e.data.eventos || []).then(revisarAvisos));
  if (e.data && e.data.tipo === "prueba" && self.Notification && Notification.permission === "granted") e.waitUntil(self.registration.showNotification("Así te va a avisar", {body: "Cuando cierre la quincena, se acerque tu cobro o haya un feriado, vas a ver un mensaje como este.", icon: "icon-192.png", tag: "prueba"}));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(l => l.length ? l[0].focus() : self.clients.openWindow("./")));
});

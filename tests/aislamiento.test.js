// Mi Recibo comparte el dominio (usuario.github.io) con otras apps: cada una tiene que poder instalarse, actualizarse y guardar datos sin pisar a las demás.
const test = require("node:test"), assert = require("node:assert/strict"), vm = require("node:vm");
const fs = require("fs"), path = require("path");
const RAIZ = path.join(__dirname, ".."), leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
const MI_CARPETA = "/calculadora-sueldo/";

test("manifest: id propio (no el raíz del dominio), y scope y start_url dentro de la carpeta de la app", () => {
  const m = JSON.parse(leer("manifest.webmanifest")), base = "https://usuario.github.io" + MI_CARPETA;
  assert.equal(m.id, MI_CARPETA, "el id tiene que ser único por app; «./» se resuelve a la raíz del dominio y lo comparten todas");
  assert.equal(new URL(m.scope, base + "manifest.webmanifest").pathname, MI_CARPETA);
  assert.equal(new URL(m.start_url, base + "manifest.webmanifest").pathname, MI_CARPETA);
  assert.notEqual(m.name, "Second Brain"); assert.notEqual(m.short_name, "Second Brain");
});
test("index.html enlaza el manifest y registra el service worker acotado a su carpeta", () => {
  const h = leer("index.html");
  assert.match(h, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(h, /serviceWorker\.register\("sw\.js", \{scope: "\.\/", updateViaCache: "none"\}\)/);
});
function ctxSW() {
  const manej = {}, borradas = [];
  const ctx = {self: {addEventListener: (t, f) => { manej[t] = f; }, registration: {}, clients: {claim: async () => {}}}, importScripts() {}, URL, Promise, console, setTimeout, clearTimeout,
    location: {origin: "https://prueba.test", href: "https://prueba.test" + MI_CARPETA + "sw.js"},
    caches: {keys: async () => ["mi-recibo-v2.3.7", "mi-recibo-v2.3.9", "calc-avisos", "second-brain-v1.11.0", "sb-avisos", "otra-app"], delete: async k => { borradas.push(k); return true; }, open: async () => ({}), match: async () => undefined},
    fetch: () => Promise.reject(new Error("no"))};
  ctx.self.location = ctx.location; vm.createContext(ctx);
  vm.runInContext(leer("sw.js").replace(/try \{ importScripts\("version\.js"\); \} catch \(e\) \{\}/, 'self.APP_VERSION = "2.3.9";'), ctx);
  return {manej, borradas};
}
test("service worker: al activarse solo borra cachés viejas de Mi Recibo y conserva las de otras apps y sus avisos", async () => {
  const {manej, borradas} = ctxSW(); let esperar; manej.activate({waitUntil: p => { esperar = p; }}); await esperar;
  assert.deepEqual(borradas, ["mi-recibo-v2.3.7"]);
});
test("service worker: no atiende pedidos de otra carpeta del mismo dominio", () => {
  const {manej} = ctxSW(); let respondio = false;
  const pedir = url => { respondio = false; manej.fetch({request: {method: "GET", url, mode: "same-origin"}, respondWith: p => { respondio = true; Promise.resolve(p).catch(() => {}); }, waitUntil() {}}); return respondio; };
  assert.equal(pedir("https://prueba.test/Second-Brain/index.html"), false);
  assert.equal(pedir("https://prueba.test/Second-Brain/"), false);
  assert.equal(pedir("https://prueba.test" + MI_CARPETA + "icon-192.png"), true);
});
test("almacenamiento: todas las claves de localStorage/sessionStorage y la base IndexedDB llevan el prefijo de la app", () => {
  const t = leer("index.html"), malas = [];
  for (const m of t.matchAll(/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\(\s*"([^"]+)"/g)) if (!/^(calc_sueldo_|mr_)/.test(m[1])) malas.push(m[1]);
  for (const m of t.matchAll(/indexedDB\.open\(\s*"([^"]+)"/g)) if (!/^calc_sueldo/.test(m[1])) malas.push("IndexedDB " + m[1]);
  assert.deepEqual(malas, []);
});
test("ningún código borra todo el localStorage ni todas las cachés del dominio", () => {
  const h = leer("index.html");
  assert.doesNotMatch(h, /localStorage\.clear\(/);
  assert.doesNotMatch(h, /k\.map\(function \(x\) \{ return caches\.delete\(x\)/);
  assert.doesNotMatch(leer("sw.js"), /localStorage\.clear\(/);
});

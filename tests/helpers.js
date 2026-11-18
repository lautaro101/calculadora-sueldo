// Utilidades para las pruebas. Las pruebas del motor y del arranque abren index.html de verdad (con jsdom),
// así que prueban el código real y no una copia. Si jsdom no está instalado, esas pruebas se saltean (npm i --no-save jsdom).
const fs = require("fs"), path = require("path"), vm = require("vm");
const RAIZ = path.join(__dirname, "..");
const leer = f => fs.readFileSync(path.join(RAIZ, f), "utf8");
let JSDOM = null; try { ({JSDOM} = require("jsdom")); } catch (e) {}
const SIN_JSDOM = JSDOM ? false : "falta jsdom: corré «npm i --no-save jsdom»";

// Abre la app como la abriría un navegador. `almacen` = lo que ya había en localStorage; `ahora` = fecha simulada (opcional).
function abrirApp(almacen = {}, ahora) {
  const ver = leer("version.js").replace(/self\./g, "window.");
  const html = leer("index.html").replace('<script src="version.js"></script>', "<script>" + ver + "</script>");
  const errores = [];
  const {VirtualConsole} = require("jsdom"), vc = new VirtualConsole(); vc.on("jsdomError", e => errores.push(String(e.message)));
  const dom = new JSDOM(html, {runScripts: "dangerously", url: "https://prueba.test/", pretendToBeVisual: true, virtualConsole: vc,
    beforeParse(w) {
      for (const k in almacen) w.localStorage.setItem(k, almacen[k]);
      w.matchMedia = () => ({matches: false, addListener() {}, removeListener() {}, addEventListener() {}});
      w.fetch = () => Promise.reject(new Error("sin red"));
      if (ahora) { const Real = w.Date; w.Date = class extends Real { constructor(...a) { super(...(a.length ? a : [ahora])); } static now() { return new Real(ahora).getTime(); } }; }
    }});
  const w = dom.window;
  return {dom, w, errores, ev: codigo => w.eval(codigo), cerrar: () => w.close()};
}

// Carga sw.js en un contexto aislado, con lo mínimo que necesita, y devuelve sus funciones y el manejador de «fetch».
function abrirSW({red, copia} = {}) {
  let manejador; const guardado = {put: async () => {}};
  const ctx = {
    self: {addEventListener: (t, f) => { if (t === "fetch") manejador = f; }, registration: {}, clients: {claim: async () => {}}, skipWaiting() {}},
    importScripts() {}, location: {origin: "https://prueba.test"}, URL, setTimeout, clearTimeout, Promise, console,
    Request: class { constructor(u) { this.url = u.url || u; this.mode = u.mode || "navigate"; } }, Response: class {},
    fetch: red || (() => Promise.reject(new Error("sin red"))),
    caches: {open: async () => guardado, match: async () => copia, keys: async () => [], delete: async () => true},
  };
  ctx.self.location = ctx.location; ctx.window = ctx.self;
  vm.createContext(ctx); vm.runInContext(leer("sw.js"), ctx);
  return {ctx, manejador, avisosPendientes: ctx.avisosPendientes};
}
module.exports = {RAIZ, leer, abrirApp, abrirSW, SIN_JSDOM};

// El service worker (sw.js) corre en un contexto aislado: no hace falta navegador.
const test = require("node:test"), assert = require("node:assert/strict");
const {abrirSW} = require("./helpers");

const EVENTO = {f: "2026-11-23", t: "es feriado", av: [7, 3, 1], c: "Lunes 23 de noviembre. Aprovechá."};
const dia = d => new Date("2026-11-" + d + "T09:00:00");

test("feriado: avisa a los 7, 3 y 1 día antes, una sola vez cada uno", () => {
  const {avisosPendientes} = abrirSW(); const ya = [], salida = [];
  for (let d = 14; d <= 24; d++) avisosPendientes([EVENTO], dia(d), ya).forEach(x => { ya.push(x.key); salida.push(d + ": " + x.titulo); });
  assert.deepEqual(salida, ["16: En 7 días: es feriado", "20: En 3 días: es feriado", "22: Mañana: es feriado"]);
});

test("feriado: si un día no se abrió la app, avisa al abrirla (sin repetir)", () => {
  const {avisosPendientes} = abrirSW(); const ya = [];
  const a = avisosPendientes([EVENTO], dia(18), ya); assert.equal(a.length, 1); assert.equal(a[0].titulo, "En 5 días: es feriado"); ya.push(a[0].key);
  assert.equal(avisosPendientes([EVENTO], dia(19), ya).length, 0, "no repite el de 7 días");
});

test("feriado: el mismo día y después ya no avisa", () => {
  const {avisosPendientes} = abrirSW();
  assert.equal(avisosPendientes([EVENTO], dia(23), []).length, 0);
  assert.equal(avisosPendientes([EVENTO], dia(24), []).length, 0);
});

test("cierre y cobro siguen avisando el día antes y el mismo día", () => {
  const {avisosPendientes} = abrirSW(), e = {f: "2026-11-20", t: "cobrás la 1ª quincena", c: "x"};
  assert.equal(avisosPendientes([e], dia(19), [])[0].titulo, "Mañana: cobrás la 1ª quincena");
  assert.equal(avisosPendientes([e], dia(20), [])[0].titulo, "Hoy: cobrás la 1ª quincena");
});

async function pedir(red, copia) {
  const {manejador} = abrirSW({red, copia}); let resp; const t0 = Date.now();
  manejador({request: {method: "GET", url: "https://prueba.test/index.html", mode: "navigate"}, respondWith: p => { resp = p; }, waitUntil() {}});
  const r = await resp; return {r, ms: Date.now() - t0};
}
const RED_OK = () => Promise.resolve({ok: true, tag: "RED", clone() { return this; }});
const COPIA = {tag: "COPIA"};

test("abrir: con buena señal usa internet", async () => { const {r} = await pedir(RED_OK, COPIA); assert.equal(r.tag, "RED"); });
test("abrir: sin internet usa la copia guardada al instante", async () => { const {r, ms} = await pedir(() => Promise.reject(new Error("x")), COPIA); assert.equal(r.tag, "COPIA"); assert.ok(ms < 300); });
test("abrir: con internet colgado no espera más de ~1,5 s", async () => {
  const {r, ms} = await pedir(() => new Promise(() => {}), COPIA);
  assert.equal(r.tag, "COPIA"); assert.ok(ms >= 1400 && ms < 2500, "tardó " + ms + " ms");
});

const test = require("node:test"), assert = require("node:assert/strict");
const {abrirApp, SIN_JSDOM} = require("./helpers");

// 15/11/2026 (domingo). Los próximos feriados de lunes a viernes: 23/11, 7/12, 8/12, 25/12.
const HOY = "2026-11-15T12:00:00";
const conPerfil = app => app.ev(`(() => {
  const it = itemsRepicky(); it.find(x => x.n === "Horas normales").u = 6942.35;
  S.plan.perfiles = [{id: "p1", nombre: "Repicky", items: it, redondeo: true}]; S.plan.actual = "p1"; S.plan.items = it; return true; })()`);

test("los próximos feriados salen ordenados y desde hoy", {skip: SIN_JSDOM}, () => {
  const app = abrirApp({}, HOY); try {
    const f = app.ev(`proximosFeriados(4).map(x => x.fecha.getFullYear() + "-" + (x.fecha.getMonth() + 1) + "-" + x.fecha.getDate() + ":" + x.dias)`);
    assert.deepEqual([...f], ["2026-11-23:8", "2026-12-7:22", "2026-12-8:23", "2026-12-25:40"]);
  } finally { app.cerrar(); }
});

test("trabajar un feriado suma 9 hs al 100% menos el 17% de descuentos", {skip: SIN_JSDOM}, () => {
  const app = abrirApp({}, HOY); try {
    conPerfil(app);
    const g = app.ev(`ganaFeriado(new Date(2026, 10, 23))`);
    const esperado = 9 * 6942.35 * 2 * (1 - 0.17);        // jubilación 11 + obra social 2,55 + fondo 0,45 + ley 19032 3
    assert.equal(g.hs, 9);
    assert.ok(Math.abs(g.neto - esperado) <= 50, `dio ${g.neto}, esperado ~${esperado.toFixed(0)}`);
  } finally { app.cerrar(); }
});

test("sin valor de la hora o sin concepto al 100%, no inventa un número", {skip: SIN_JSDOM}, () => {
  const app = abrirApp({}, HOY); try {
    app.ev(`(() => { const it = itemsRepicky(); S.plan.perfiles = [{id: "p1", nombre: "Repicky", items: it}]; S.plan.actual = "p1"; S.plan.items = it; })()`);
    assert.equal(app.ev(`ganaFeriado(new Date(2026, 10, 23))`), null, "valor hora 0");
    app.ev(`(() => { const it = S.plan.perfiles[0].items.filter(x => !/100/.test(x.n)); it[0].u = 6942.35; S.plan.perfiles[0].items = it; })()`);
    assert.equal(app.ev(`ganaFeriado(new Date(2026, 10, 23))`), null, "sin Hs al 100%");
  } finally { app.cerrar(); }
});

test("la notificación del feriado trae la fecha y cuánto sumás", {skip: SIN_JSDOM}, () => {
  const app = abrirApp({}, HOY); try {
    conPerfil(app);
    const ev = app.ev(`eventosAviso().filter(e => e.t === "es feriado")`);
    assert.ok(ev.length >= 4, "faltan feriados en los avisos");
    assert.deepEqual([...ev.slice(0, 4).map(e => e.f)], ["2026-11-23", "2026-12-07", "2026-12-08", "2026-12-25"]);
    assert.deepEqual([...ev[0].av], [7, 3, 1]);
    assert.match(ev[0].c, /^Lunes 23 de noviembre\. Aprovechá ese día: si trabajás las 9 hs, sumás unos \$[\d.]+ netos\.$/);
  } finally { app.cerrar(); }
});

test("los feriados en fin de semana no avisan", {skip: SIN_JSDOM}, () => {
  const app = abrirApp({}, HOY); try {
    const dias = app.ev(`eventosAviso().filter(e => e.t === "es feriado").map(e => { const [a, m, d] = e.f.split("-").map(Number); return new Date(a, m - 1, d).getDay(); })`);
    assert.ok([...dias].every(d => d >= 1 && d <= 5));
  } finally { app.cerrar(); }
});

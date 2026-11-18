// El motor de cálculo contra los dos recibos reales de octubre 2026 (Repicky SA). Si cambia un solo centavo, falla.
const test = require("node:test"), assert = require("node:assert/strict");
const {abrirApp, SIN_JSDOM} = require("./helpers");

const RECIBOS = {
  q1: {quin: 1, horas: {n: 94, fer: 9, h50: 4, h100: 11, noc: 9}, rem: 1164995.76, norem: 0.36, desc: 216462.12, neto: 948534.00,
    lineas: {"Horas normales": 652580.90, "Horas extra al 50%": 41654.10, "Hs Feriado": 62481.15, "Hs Adic Noc": 62481.15, "Hs al 100%": 152731.70,
      "Presentismo": 71506.21, "Premio (Pr CamCul)": 100108.69, "Antigüedad": 21451.86,
      "Jubilación Reparto": 128149.53, "O. Social UOM": 29707.39, "Fondo Solidario": 5242.48, "Ley 19032 INSSJP": 34949.87, "U.O.M. Sindicato": 18412.85}},
  q2: {quin: 2, horas: {n: 96, fer: 0, h50: 11, h100: 0, noc: 0}, rem: 985659.58, norem: 100000.01, desc: 193708.59, neto: 891951.00,
    lineas: {"Horas normales": 666465.60, "Horas extra al 50%": 114548.78, "Presentismo": 66646.56, "Premio (Pr CamCul)": 93305.18, "Adicional de título": 24699.49,
      "Antigüedad": 19993.97, "CompExtr NoRem Abr-Jul/26": 70000, "Grat Extr NO REM Oct/26": 30000,
      "Jubilación Reparto": 108422.55, "O. Social UOM": 25134.32, "Fondo Solidario": 4435.47, "Ley 19032 INSSJP": 29569.79, "U.O.M. Sindicato": 17778.98, "Seguro Vida UOM": 8367.48}},
};

// Perfil Repicky tal como lo usa Lauty: valor hora 6.942,35, antigüedad 3% y adicional de título de $24.699,49
function calcular(app, r, per = "2026-10") {
  return app.ev(`(() => {
    const it = itemsRepicky(), f = n => it.find(x => x.n === n), h = ${JSON.stringify(r.horas)};
    f("Horas normales").u = 6942.35; f("Horas normales").cant = h.n; f("Hs Feriado").cant = h.fer; f("Horas extra al 50%").cant = h.h50;
    f("Hs al 100%").cant = h.h100; f("Hs Adic Noc").cant = h.noc; f("Antigüedad").p = 3; f("Adicional de título").m = 24699.49;
    return JSON.parse(JSON.stringify(calcItems(it, ${r.quin}, true, undefined, ${JSON.stringify(per)})));
  })()`);
}
const monto = (res, nombre) => [...res.rem, ...res.norem, ...res.desc].filter(x => x[0] === nombre).reduce((s, x) => s + x[2], 0);

for (const [id, r] of Object.entries(RECIBOS)) {
  test(`recibo octubre ${id === "q1" ? "1ra" : "2da"} quincena: totales exactos`, {skip: SIN_JSDOM}, () => {
    const app = abrirApp(); try {
      const res = calcular(app, r);
      assert.equal(res.totalRem, r.rem, "total remunerativo");
      assert.equal(res.totalNorem, r.norem, "no remunerativo (con redondeo)");
      assert.equal(res.totalDesc, r.desc, "descuentos");
      assert.equal(res.neto, r.neto, "sueldo neto");
    } finally { app.cerrar(); }
  });
  test(`recibo octubre ${id === "q1" ? "1ra" : "2da"} quincena: cada concepto`, {skip: SIN_JSDOM}, () => {
    const app = abrirApp(); try {
      const res = calcular(app, r);
      for (const [n, esperado] of Object.entries(r.lineas)) assert.equal(+monto(res, n).toFixed(2), esperado, n);
    } finally { app.cerrar(); }
  });
}

test("lo que va solo en una quincena no aparece en la otra", {skip: SIN_JSDOM}, () => {
  const app = abrirApp(); try {
    const q1 = calcular(app, RECIBOS.q1), q2 = calcular(app, RECIBOS.q2);
    for (const n of ["Adicional de título", "Seguro Vida UOM", "CompExtr NoRem Abr-Jul/26", "Grat Extr NO REM Oct/26"]) assert.equal(monto(q1, n), 0, n + " no va en la 1ra");
    assert.ok(monto(q2, "Adicional de título") > 0 && monto(q2, "Seguro Vida UOM") > 0, "la 2da sí los tiene");
  } finally { app.cerrar(); }
});

test("las sumas no remunerativas son solo de octubre 2026", {skip: SIN_JSDOM}, () => {
  const app = abrirApp(); try {
    for (const per of ["2026-09", "2026-11", "2027-10"]) {
      const res = calcular(app, RECIBOS.q2, per);
      assert.equal(monto(res, "CompExtr NoRem Abr-Jul/26"), 0, "1026 en " + per);
      assert.equal(monto(res, "Grat Extr NO REM Oct/26"), 0, "1027 en " + per);
    }
  } finally { app.cerrar(); }
});

test("un perfil Repicky viejo se arregla una sola vez y no duplica nada", {skip: SIN_JSDOM}, () => {
  const app = abrirApp(); try {
    const r = app.ev(`(() => {
      const it = itemsRepicky().filter(x => !/CompExtr|Grat Extr/.test(x.n)); it.find(x => x.n === "Adicional de título").q = 0;
      const a = ajustarRepicky(it), b = ajustarRepicky(it);
      return {a, b, n: it.length, q: it.find(x => x.n === "Adicional de título").q, puntuales: it.filter(x => x.t === "norem").length};
    })()`);
    assert.equal(r.a, 3); assert.equal(r.b, 0); assert.equal(r.q, 2); assert.equal(r.puntuales, 2);
  } finally { app.cerrar(); }
});

const test = require("node:test"), assert = require("node:assert/strict");
const {abrirApp, SIN_JSDOM} = require("./helpers");
const espera = ms => new Promise(r => setTimeout(r, ms));

test("la app arranca sin errores y sin pasos fallidos", {skip: SIN_JSDOM}, () => {
  const app = abrirApp(); try { assert.deepEqual(app.errores, []); assert.equal(app.w.__fallos, undefined); assert.ok(app.w.__listo); } finally { app.cerrar(); }
});
test("la pantalla del logo se cierra sola aunque no llegue nada de internet", {skip: SIN_JSDOM}, async () => {
  const app = abrirApp(); try { await espera(3000); const sp = app.w.document.getElementById("splash"); assert.ok(!sp || sp.className === "fuera", "el logo siguió tapando la app"); } finally { app.cerrar(); }
});
test("novedades: salen la primera vez y después de actualizar, una sola vez", {skip: SIN_JSDOM}, async () => {
  let app = abrirApp(); await espera(2800);
  const panel = a => a.w.document.getElementById("modalNov");
  assert.ok(panel(app), "primera vez"); assert.match(panel(app).textContent, /Bienvenido/);
  panel(app).querySelector("button").click(); assert.equal(panel(app), null);
  const guardado = {}; for (let i = 0; i < app.w.localStorage.length; i++) { const k = app.w.localStorage.key(i); guardado[k] = app.w.localStorage.getItem(k); } app.cerrar();
  app = abrirApp(guardado); await espera(2800); assert.equal(panel(app), null, "misma versión: no vuelve a salir"); app.cerrar();
  delete guardado.mr_nov_pend; guardado.mr_ult_version = "2.3.0";
  app = abrirApp(guardado); await espera(2800); assert.ok(panel(app), "después de actualizar"); assert.match(panel(app).textContent, /Novedades/); app.cerrar();
});

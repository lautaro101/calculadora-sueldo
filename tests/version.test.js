// Que la versión y la lista de novedades no queden desparejas, y que no falte ningún archivo.
const test = require("node:test"), assert = require("node:assert/strict"), vm = require("vm"), fs = require("fs"), path = require("path");
const {leer, RAIZ} = require("./helpers");
const ctx = {}; ctx.self = ctx; vm.createContext(ctx); vm.runInContext(leer("version.js"), ctx);
const partes = v => String(v).split(".").map(Number);
const cmp = (a, b) => { const x = partes(a), y = partes(b); for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i]; return 0; };

test("la versión actual es la primera de la lista de novedades", () => {
  assert.match(ctx.APP_VERSION, /^\d+\.\d+\.\d+$/);
  assert.equal(ctx.APP_HISTORIAL[0][0], ctx.APP_VERSION);
});
test("APP_NOVEDADES coincide con la novedad de la versión actual", () => assert.equal(ctx.APP_NOVEDADES, ctx.APP_HISTORIAL[0][1]));
test("la lista va de la más nueva a la más vieja, sin repetir, y llega a la 1.0.0", () => {
  const H = ctx.APP_HISTORIAL;
  for (let i = 1; i < H.length; i++) assert.ok(cmp(H[i - 1][0], H[i][0]) > 0, `${H[i - 1][0]} debería ser mayor que ${H[i][0]}`);
  assert.equal(H[H.length - 1][0], "1.0.0");
  H.forEach(([v, n]) => assert.ok(typeof n === "string" && n.length > 10, "falta el texto de " + v));
});
test("la app puede leer APP_NOVEDADES con su expresión regular", () => {
  const m = leer("version.js").match(/APP_NOVEDADES\s*=\s*("(?:[^"\\]|\\.)*")/); assert.ok(m); assert.equal(JSON.parse(m[1]), ctx.APP_NOVEDADES);
});
test("están todos los archivos de la app y el manifest es válido", () => {
  for (const f of ["index.html", "version.js", "sw.js", "manifest.webmanifest", "icon-192.png", "icon-512.png"]) assert.ok(fs.existsSync(path.join(RAIZ, f)), "falta " + f);
  assert.ok(JSON.parse(leer("manifest.webmanifest")).name);
});
test("el JavaScript de index.html y sw.js no tiene errores de sintaxis", () => {
  const bloques = [...leer("index.html").matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  bloques.forEach((b, i) => assert.doesNotThrow(() => new vm.Script(b), "bloque " + i));
  assert.doesNotThrow(() => new vm.Script(leer("sw.js")));
});

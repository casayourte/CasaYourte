/* ═══════════════════════════════════════════════════════════════
   PRUEBAS · el orden y el apagado de secciones
   
   Se corre con node a secas, sin npm y sin navegador:

       node pruebas-secciones.mjs

   No prueba una copia de la lógica: extrae el aplicarSecciones REAL de
   index.html y lo corre contra un DOM de juguete. Si alguien cambia esa
   función, esto se entera.

   Es el banco de pruebas sin dependencias que Harmonía le presta a los
   otros tres (ver PROTOCOLO-DESARROLLO.md), y el primero de CasaYourte.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const fuente = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "index.html"), "utf8");
const trozo = fuente.slice(
  fuente.indexOf("const enLista = (v) =>"),
  fuente.indexOf("/* Lo único que el editor puede llamar"));
if (!trozo.includes("function aplicarSecciones")) throw new Error("no se encontró el código");

// ── DOM mínimo ────────────────────────────────────────────
class El {
  constructor(tag, data = {}) {
    this.tag = tag; this.dataset = data; this._cls = new Set(); this.children = [];
    this.classList = {
      toggle: (c, on) => { on ? this._cls.add(c) : this._cls.delete(c); },
      contains: (c) => this._cls.has(c),
    };
  }
  querySelector(){ return null; }
}
function hacerDoc(ids, conBanda = []) {
  const body = new El("body");
  body.children = [];
  ids.forEach(id => {
    if (conBanda.includes(id)) body.children.push(new El("div", { bandaDe: id }));
    body.children.push(new El("section", { seccion: id }));
  });
  const foot = new El("div"); foot._cls.add("foot"); body.children.push(foot);
  body.insertBefore = (el, ref) => {
    const i = body.children.indexOf(el); if (i >= 0) body.children.splice(i, 1);
    const j = ref ? body.children.indexOf(ref) : -1;
    j >= 0 ? body.children.splice(j, 0, el) : body.children.push(el);
  };
  const doc = {
    body,
    querySelectorAll: (sel) => {
      if (sel === "body > [data-seccion]") return body.children.filter(x => x.dataset.seccion);
      return [];
    },
    querySelector: (sel) => {
      if (sel === "body > .foot") return foot;
      let m = sel.match(/^body > \[data-seccion="(.+)"\]$/);
      if (m) return body.children.find(x => x.dataset.seccion === m[1]) || null;
      m = sel.match(/^body > \[data-banda-de="(.+)"\]$/);
      if (m) return body.children.find(x => x.dataset.bandaDe === m[1]) || null;
      return null;
    },
  };
  return { doc, body, orden: () => body.children.filter(x => x.dataset.seccion).map(x => x.dataset.seccion),
           todo: () => body.children.map(x => x.dataset.bandaDe ? "~" + x.dataset.bandaDe
                                            : (x.dataset.seccion || ".foot")),
           apagadas: () => body.children.filter(x => x._cls.has("cy-oculta"))
                                        .map(x => x.dataset.seccion || "~" + x.dataset.bandaDe) };
}

const correr = (m, orden, ocultas) => {
  const f = new Function("document", trozo + "\nreturn aplicarSecciones;")(m.doc);
  f(orden, ocultas);
};

let ok = 0, mal = 0;
const es = (n, a, b) => {
  const x = JSON.stringify(a), y = JSON.stringify(b);
  if (x === y) { ok++; console.log("  ok  " + n); }
  else { mal++; console.log("  MAL " + n + "\n       dio " + x + "\n       esperaba " + y); }
};

const HTML = ["hero","foto","idea","proceso","trayectoria","diferencial","interior",
              "oferta","co","taller","albumes","contacto"];

console.log("1 · sin lista guardada manda el HTML");
let m = hacerDoc(HTML); correr(m, "", "");
es("orden intacto", m.orden(), HTML);
es("nada apagado", m.apagadas(), []);

console.log("2 · lista completa, orden nuevo");
m = hacerDoc(HTML);
const nuevo = ["hero","idea","interior","oferta","foto","proceso","trayectoria",
               "diferencial","co","taller","albumes","contacto"];
correr(m, nuevo.join(","), "");
es("respeta la lista", m.orden(), nuevo);

console.log("3 · lista PARCIAL: lo que falta no puede desaparecer (§3.35)");
m = hacerDoc(HTML); correr(m, "contacto,hero", "");
es("las 12 siguen", m.orden().slice().sort(), HTML.slice().sort());
es("las dos nombradas van primero", m.orden().slice(0,2), ["contacto","hero"]);

console.log("4 · apagar no borra");
m = hacerDoc(HTML); correr(m, "", "proceso,co");
es("siguen las 12 en el DOM", m.orden(), HTML);
es("dos marcadas", m.apagadas().sort(), ["co","proceso"]);

console.log("5 · encender de nuevo la deja como estaba");
correr(m, "", "");
es("ninguna apagada", m.apagadas(), []);

console.log("6 · la banda viaja con su sección");
m = hacerDoc(HTML, ["trayectoria","taller"]);
correr(m, ["taller","hero","trayectoria"].concat(HTML.filter(x=>!["taller","hero","trayectoria"].includes(x))).join(","), "");
const t = m.todo();
es("banda de taller justo antes de taller", t[t.indexOf("taller")-1], "~taller");
es("banda de trayectoria justo antes", t[t.indexOf("trayectoria")-1], "~trayectoria");

console.log("7 · la banda se apaga con su sección");
m = hacerDoc(HTML, ["trayectoria"]); correr(m, "", "trayectoria");
es("apagadas: la sección y su banda", m.apagadas().sort(), ["trayectoria","~trayectoria"]);

console.log("8 · un id guardado que ya no existe en el HTML no rompe");
m = hacerDoc(HTML); correr(m, "hero,seccion-borrada,idea", "");
es("sigue habiendo 12", m.orden().length, 12);
es("hero e idea adelante", m.orden().slice(0,2), ["hero","idea"]);

console.log("9 · el pie nunca se mueve");
m = hacerDoc(HTML); correr(m, HTML.slice().reverse().join(","), "");
es("el pie queda último", m.todo().at(-1), ".foot");

console.log("10 · basura en los campos no rompe nada");
m = hacerDoc(HTML); correr(m, "  , ,, ", null);
es("orden intacto", m.orden(), HTML);
correr(m, undefined, "   ");
es("sigue intacto", m.orden(), HTML);

console.log("\n" + ok + " bien · " + mal + " mal");
process.exit(mal ? 1 : 0);

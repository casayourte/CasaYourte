// pruebas-calculo.mjs — el banco de la geometría de Cálculos (calculo-geo.js).
// Sin npm y sin navegador:  node pruebas-calculo.mjs
//
// Compara contra los números del manual técnico del plancher (versión
// Christine, 1-nov-2026), calculados a mano, y prueba los bordes: que ninguna
// medida rara deje un NaN ni un dibujo vacío.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { calc, corte, cuerdas, pilares } from "./calculo-geo.js";

let bien = 0, mal = 0;
function ok(nombre, cond, extra = "") {
  if (cond) { bien++; } else { mal++; console.log("✖ " + nombre + (extra ? "  → " + extra : "")); }
}
const cerca = (a, b, tol = 0.0015) => Math.abs(a - b) <= tol;

// Las medidas por defecto de calculo.html: se leen del archivo, no se copian.
const html = readFileSync(new URL("./calculo.html", import.meta.url), "utf8");
const bloque = html.match(/const CAMPOS = \[([\s\S]*?)\n\];/);
ok("calculo.html tiene CAMPOS", !!bloque);
const PORDEF = {};
for (const m of bloque[1].matchAll(/\["(\w+)",\s*"[^"]*",\s*([\d.]+)/g)) PORDEF[m[1]] = parseFloat(m[2]);

// ── Christine con los valores por defecto (son los de Christine) ──
const P = { ...PORDEF };
const C = calc(P);
ok("D por defecto 7,00", P.D === 7);
ok("A = 0,24 × 0,75 = 0,18", cerca(C.A, 0.18));
ok("c = 2 × 0,01", cerca(C.c, 0.02));
ok("cara exterior del trei 3,320", cerca(C.Rint, 3.32), C.Rint);
ok("anillo hasta 3,420", cerca(C.Rext, 3.42));
ok("vuelo 0,08", cerca(C.vuelo, 0.08));
ok("alto de la cal contra el trei 0,208", cerca(C.h0, 0.208), C.h0);
ok("punta truncada 0,1155", cerca(C.tri_tr, 0.1155, 0.0002), C.tri_tr);
ok("cinta como mucho 0,104", cerca(C.cinta_max, 0.104), C.cinta_max);
ok("barrido 0,012", cerca(C.barrido, 0.012));
ok("anillo de 2 capas de 0,04 = 0,08", cerca(C.alto_an, 0.08));
ok("17 tirantes", C.n_tir === 17, C.n_tir);
ok("95,9 m de tirante", cerca(C.m_tir, 95.9, 0.06), C.m_tir);
ok("5 vigas", C.n_vig === 5, C.n_vig);
ok("30,3 m de viga", cerca(C.m_vig, 30.3, 0.06), C.m_vig);
ok("23 pilares", C.n_pil === 23, C.n_pil);
ok("15 placas de OSB por capa", C.placas_capa === 15, C.placas_capa);
ok("celulosa bruta 5,39", cerca(C.cel_bruto, 5.39, 0.006), C.cel_bruto);
ok("celulosa neta ~4,7", cerca(C.cel_neto, 4.68, 0.03), C.cel_neto);
ok("piso de 0,170", cerca(C.alto_piso, 0.17));
ok("la placa de 1,20 son 3 entreejes", C.placa_ok && Math.round(C.por_placa) === 3);
ok("encastre 0,08 y quedan 0,06", cerca(C.encastre, 0.08) && cerca(C.bajo_encastre, 0.06));
ok("unos 63 puntos de abajo del trei", Math.abs(C.n_pts - 63) <= 1, C.n_pts);
ok("zócalo de unos 20,6 m", cerca(C.zocalo, 20.6, 0.06), C.zocalo);
ok("circunferencia a trazar 20,86", cerca(C.circ_trazo, 20.86, 0.01), C.circ_trazo);
ok("bulón de cruce 0,04, el de abajo 0,05", cerca(C.grip_cruce, 0.04) && cerca(C.grip_abajo, 0.05));

// ── el toono de Christine: Ø 2,00 (Mauro, 1-nov) y la percha radial ──
ok("toono por defecto de 1,00 de radio", P.r_toono === 1);
ok("canal entre 8 triángulos 0,765", cerca(C.sep_tri, 0.765, 0.001), C.sep_tri);
ok("pasa de 0,40: va una percha radial por canal", C.con_radial === true);
ok("percha radial de 2,679", cerca(C.largo_radial, 2.679, 0.002), C.largo_radial);
ok("hueco a cada lado 0,367", cerca(C.hueco_radial, 0.3677, 0.001), C.hueco_radial);
ok("con el toono de 0,502 no hace falta", calc({ ...P, r_toono: 0.502 }).con_radial === false);
ok("la percha radial es de la madera de los triángulos", /de la misma madera que los triángulos/.test(html));
ok("calculo.html avisa la percha radial", /percha radial en el medio de cada canal/.test(html));

// ── las piezas sueltas ──
const cv = cuerdas(3.5, 1.2);
ok("vigas: 0, 1,2 y 2,4", cv.length === 3 && cerca(cv[2].x, 2.4));
const pc = pilares(7, 0.5, 1.6);
ok("viga central: 4 tramos de 1,5 y 5 pilares", pc.tramos === 4 && cerca(pc.largo, 1.5) && pc.pilares === 5);
ok("viga corta: un pilar", pilares(0.8, 0.5, 1.6).pilares === 1);
ok("sin paso no hay cuerdas (no cuelga)", cuerdas(3.5, 0).length === 0);

// ── si la placa cambia y el entreeje no, avisa ──
const C2 = calc({ ...P, placa_a: 1.25 });
ok("placa de 1,25 con entreeje 0,40: no cierra", !C2.placa_ok);

// ── la cinta más alta que lo que entra ──
ok("cinta de 0,12 no entra", calc({ ...P, anc_per: 0.12 }).cinta_max < 0.12);

// ── ninguna medida rara deja un NaN ──
function sinNaN(o, ruta = "") {
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "number" && !isFinite(v)) return ruta + k;
    if (v && typeof v === "object") { const r = sinNaN(v, ruta + k + "."); if (r) return r; }
  }
  return "";
}
for (const [nom, Q] of [["Christine", P], ["4 m", { ...P, D: 4 }], ["12 m", { ...P, D: 12 }],
  ["ángulo 35", { ...P, ang: 35 }], ["aislación 0,30", { ...P, ais_nom: 0.3, ais_techo: 0.3 }]]) {
  const K = calc(Q);
  ok(`${nom}: sin NaN`, sinNaN(K) === "", sinNaN(K));
  const d = corte(Q, K);
  ok(`${nom}: el corte no tiene NaN`, !/NaN|Infinity/.test(d.svg1 + d.svg2));
  ok(`${nom}: el corte entra en el ancho`, /viewBox="0 0 680 /.test(d.svg1) && d.escala > 0);
}

// ── el dibujo dice los números del cálculo ──
const d = corte(P, C);
ok("el corte trae la punta 0,115 (115,5 mm)", d.svg1.includes("punta 0,115"));
ok("el corte trae el anillo 0,100 × 0,080", d.svg1.includes("anillo 0,100 × 0,080"));
ok("el corte trae el anillo encastrado", d.svg2.includes("anillo encastrado 0,080"));
const d2 = corte({ ...P, ang: 40 }, calc({ ...P, ang: 40 }));
ok("otro ángulo cambia el dibujo", d2.svg1 !== d.svg1);

// ── que parsee como MÓDULO, este y el de adentro de calculo.html ──
const parsea = (codigo) => {
  try { execFileSync(process.execPath, ["--input-type=module", "--check"], { input: codigo, stdio: ["pipe", "ignore", "pipe"] }); return true; }
  catch { return false; }
};
ok("calculo-geo.js parsea como módulo", parsea(readFileSync(new URL("./calculo-geo.js", import.meta.url), "utf8")));
const mod = html.match(/<script type="module">([\s\S]*?)<\/script>/);
ok("el módulo de calculo.html parsea", !!mod && parsea(mod[1]));
ok("calculo.html importa calculo-geo.js", /from "\.\/calculo-geo\.js"/.test(html));
const sw = readFileSync(new URL("./sw.js", import.meta.url), "utf8");
ok("calculo-geo.js está en el SHELL", /'\.\/calculo-geo\.js'/.test(sw));

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);

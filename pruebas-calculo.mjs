// pruebas-calculo.mjs — el banco de la geometría de Cálculos (calculo-geo.js).
// Sin npm y sin navegador:  node pruebas-calculo.mjs
//
// Compara contra los números del manual técnico del plancher (versión
// Christine, 1-nov-2026), calculados a mano, y prueba los bordes: que ninguna
// medida rara deje un NaN ni un dibujo vacío.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { calc, corte, cuerdas, pilares, montaje, escuadraSimple, resumen, vanos, materiales, NOMBRES_MAT, renglonMat } from "./calculo-geo.js";
import { piezas3d, arriostramiento, geodesica, PARTES, CAMPO_PARTES } from "./calculo-3d.js";

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

// ── el 3D (calculo-3d.js): la geometría sin navegador ──
const ar = arriostramiento(1.817, 2.586);
const de = (t) => ar.filter(x => x.tipo === t);
ok("3D: 16 barras por triángulo", ar.length === 16, ar.length);
ok("3D: paralelas a 0,545 hasta 1,035", de("paralela").every(x => cerca(Math.abs(x.s1), 0.545, 0.002) && cerca(x.t2, 1.035, 0.003)));
ok("3D: cuatro Λ con los pies cada 0,366, suben 0,30", [0, 0.366, 0.733, 1.099].every((t, i) =>
  cerca(de("lambda")[2 * i].t1, t, 0.003) && cerca(de("lambda")[2 * i].t2 - t, 0.30, 0.003)));
ok("3D: el cuarto Λ apoya en el lado (las paralelas ya terminaron)", cerca(Math.abs(de("lambda")[6].s1), 0.9085 * (1 - 1.099 / 2.586), 0.003));
ok("3D: el hueco entre dos Λ queda en 0,32", cerca(0.366 * Math.cos(Math.atan(0.30 / 0.545)), 0.32, 0.005));
ok("3D: V a 1,465 con los brazos a 1,810", de("v").every(x => cerca(x.t1, 1.465, 0.005) && cerca(x.t2, 1.810, 0.003)));
ok("3D: sin travesaños paralelos a la base (sólo la base)", de("travesano").length === 0 && ar.filter(x => x.t1 === x.t2).length === 1);
const T3 = piezas3d(P, C);
const cuenta = (g, tipo) => T3.piezas.filter(p => p.g === g && p.tipo === tipo).length;
ok("3D: 17 tirantes, 5 vigas y 23 pilares", cuenta("tirantes", "barra") === 17 && cuenta("vigas", "barra") === 5 && cuenta("pilares", "barra") === 23);
ok("3D: el trei de 63 × 2 listones, cortado en montantes y aberturas", cuenta("trei", "barra") < 63 * 2 * 8 && cuenta("trei", "barra") > 63 * 2 * 8 * 0.6, cuenta("trei", "barra"));
ok("3D: sin aberturas ni montantes el trei va entero", (() => { const Q = { ...P, n_ab: 0, sep_mon: 1000 }; const Cq = calc(Q);
  return Cq.n_mon === 3 && piezas3d(Q, Cq).piezas.filter(p => p.g === "trei").length < 63 * 2 * 8; })());
ok("3D: 8 triángulos y 8 perchas radiales", cuenta("triangulos", "barra") === 8 * 16 && cuenta("radiales", "barra") === 8);
ok("3D: 36 perchas y 36 calces", cuenta("perchas", "barra") === 36 && cuenta("cal", "calce") === 36);
ok("3D: cada barra tiene su sección real", T3.piezas.filter(p => p.g === "tirantes")[0].ancho === P.tir_anc && T3.piezas.filter(p => p.g === "tirantes")[0].alto === P.tir_alt
  && T3.piezas.filter(p => p.g === "trei")[0].ancho === P.anc_trei && T3.piezas.filter(p => p.g === "perchas")[0].alto === P.p_anc);
ok("3D: una percha mide del toono al desborde", (() => { const q = T3.piezas.find(p => p.g === "perchas");
  const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1], q.b[2] - q.a[2]); return cerca(L, (C.Rp - (P.r_toono - 0.02)) / Math.cos(P.ang * Math.PI / 180), 0.002); })());
ok("3D: el toono lleva 5 coronas de relleno (0,187)", T3.nCor === 5 && cerca(T3.relleno, 0.187, 0.002), T3.relleno);
ok("3D: con el toono de 0,502 no hay perchas radiales", piezas3d({ ...P, r_toono: 0.502 }, calc({ ...P, r_toono: 0.502 })).piezas.filter(p => p.g === "radiales").length === 0);
// Las partes salen de las cuatro combinaciones (doble/simple × domo/sobrealto, 3d-11).
ok("3D: cada parte tiene su casilla, y cada casilla su parte", (() => { const g = new Set();
  for (const Q of [P, { ...P, tipo: 2, tono_tipo: 2, n_vt: 2 }]) piezas3d(Q, calc(Q)).piezas.forEach(p => g.add(p.g));
  return [...g].every(x => PARTES.some(([k]) => k === x)) && PARTES.every(([k]) => g.has(k)); })());
ok("3D: lo que resalta cada medida son partes que existen", Object.values(CAMPO_PARTES).flat().every(x => PARTES.some(([k]) => k === x)));
ok("3D: cada medida que resalta es un campo de la página", Object.keys(CAMPO_PARTES).every(k => k in PORDEF));
ok("3D: toda medida de la estructura resalta algo", ["D","ang","alto","E","e_trei","tir_alt","viga_alt","n_tri","p_anc","r_toono","osb_sup"].every(k => (CAMPO_PARTES[k] || []).length > 0));
ok("calculo.html: el 3D está en la pestaña de las medidas", /<div id="t-datos">[\s\S]*?id="vista3d"[\s\S]*?id="campos"/.test(html) && !/\["3d","3D"\]/.test(html));
for (const [nom, Q] of [["Christine", P], ["4 m", { ...P, D: 4 }], ["12 m", { ...P, D: 12 }], ["10 triángulos", { ...P, n_tri: 10 }], ["6 triángulos", { ...P, n_tri: 6 }],
  ["sin aberturas", { ...P, n_ab: 0 }], ["domo media esfera, 5V", { ...P, dom_ang: 90, dom_frec: 5 }], ["domo bajo", { ...P, dom_ang: 30, dom_frec: 1 }], ["tapa a medio camino", { ...P, ts_giro: 0.5 }], ["una abertura", { ...P, n_ab: 1, n_gr: 1 }], ["aberturas bajas", { ...P, alt_ab: 1.9 }], ["simple", { ...P, tipo: 2 }], ["simple con sobrealto", { ...P, tipo: 2, tono_tipo: 2 }], ["doble con sobrealto", { ...P, tono_tipo: 2 }],
  ["simple 4 m, 3 ventanas cerradas", { ...P, D: 4, tipo: 2, tono_tipo: 2, sa_vent: 3, sa_abre: 0 }], ["simple 12 m, 12 ventanas", { ...P, D: 12, tipo: 2, tono_tipo: 2, sa_vent: 12 }],
  ["simple con anillo", { ...P, tipo: 2, s_anillo: 1 }], ["piso de una capa", { ...P, piso_tipo: 2 }], ["simple, una capa, 4 m", { ...P, tipo: 2, piso_tipo: 2, D: 4 }],
  ["con ventanas", { ...P, n_vt: 3 }], ["6 m, 1 puerta y 2 ventanas", { ...P, D: 6, tipo: 2, tono_tipo: 2, r_toono: 0.5, n_ab: 1, n_gr: 1, n_vt: 2 }], ["ventana hasta arriba", { ...P, n_vt: 1, vt_alto: 3 }],
  ["sin campos nuevos", Object.fromEntries(Object.entries(P).filter(([k]) => !["n_vt","vt_anc","vt_alto","vt_ant","s_anillo","cab_dist","piso_tipo","tipo","tono_tipo","esc","s_ais","sa_alto","sa_vent","sa_desb","sa_ang","sa_abre","anc_ab","sep_mon","umb_esp","umb_vuelo","umb_caida","lona_baja","diente","tapa_cam","tapa_vuelo","dom_ang","dom_frec","tapa_ranura","ts_giro","ts_esp","ts_rendija"].includes(k)))]]) {
  const K = piezas3d(Q, calc(Q));
  ok(`3D ${nom}: sin NaN`, !/null|NaN|Infinity/.test(JSON.stringify(K)));
}
// ── los montantes y las aberturas (geo-3) ──
const MO = C.mon;
ok("5 aberturas en 3 grupos: 2, 2 y 1", MO.grupos.map(g => g.k).join() === "2,2,1");
ok("montantes de las aberturas = aberturas + grupos = 8", C.n_mon_ab === 8);
ok("y 3 sueltos, uno en cada arco libre: 11 en total", C.n_mon_sueltos === 3 && C.n_mon === 11, C.n_mon);
ok("ninguno a más de 3 m", C.mon_max_sep <= 3 + 1e-9, C.mon_max_sep);
ok("el ancho libre entre montantes es el pedido, en el trei", MO.aberturas.every(([a, b]) => cerca((b - a) * C.r_trei_int, P.anc_ab, 1e-9)));
ok("sin aberturas: uno cada 3 m, 8 en un perímetro de 22", montaje({ ...P, n_ab: 0 }, 3.5, 3.3).n_mon === 8);
ok("más grupos que aberturas no inventa grupos", montaje({ ...P, n_ab: 2, n_gr: 5 }, 3.5, 3.3).grupos.length === 2);
ok("sin sep_mon no cuelga", montaje({ ...P, sep_mon: 0 }, 3.5, 3.3).sueltos.length === 0);
ok("3D: 11 montantes (y los dinteles si la abertura es más baja que el anillo)", cuenta("montantes", "barra") === 11 + (T3.conDintel ? 5 : 0));
ok("3D: una abertura del alto del muro no lleva dintel", (() => { const Q = { ...P, alt_ab: 3 }; const K = piezas3d(Q, calc(Q));
  return !K.conDintel && K.piezas.filter(p => p.g === "montantes").length === 11; })());
ok("3D: un piso de abertura por grupo, con su caída hacia afuera", (() => { const v = T3.piezas.filter(p => p.g === "suelo_ab");
  if (v.length !== 1) return false; const ys = []; for (let i = 1; i < v[0].v.length; i += 3) ys.push(v[0].v[i]);
  const yP = P.tir_alt + P.osb_sup; return cerca(Math.max(...ys), yP + P.umb_esp, 1e-6) && cerca(Math.min(...ys), yP, 1e-6); })());
ok("3D: el piso de la abertura pasa el borde", (() => { const v = T3.piezas.find(p => p.g === "suelo_ab").v; let r = 0;
  for (let i = 0; i < v.length; i += 3) r = Math.max(r, Math.hypot(v[i], v[i + 2])); return cerca(r, C.R + P.umb_vuelo, 0.002); })());
// ── las capas ──
const capas = PARTES.filter(p => p[2] === "capa").map(p => p[0]);
ok("3D: nueve capas, techo y muro", capas.length === 9 && capas.filter(k => /techo|tyvek/.test(k)).length === 5);
ok("3D: las capas son mallas sin NaN", capas.every(k => T3.piezas.filter(p => p.g === k).every(p => p.tipo === "malla" || p.tipo === "barra") && T3.piezas.some(p => p.g === k && p.tipo === "malla")));
const radios = (k) => { const r = []; for (const p of T3.piezas.filter(q => q.g === k && q.tipo === "malla")) for (let i = 0; i < p.v.length; i += 3) r.push(Math.hypot(p.v[i], p.v[i + 2])); return r; };
// La altura de una malla sobre el punto (r, θ) del piso: el triángulo que lo cubre, por baricéntricas.
const alturaDe = (K, k, r0, th = 0.1) => { const x = r0 * Math.cos(th), z = r0 * Math.sin(th); let y = null;
  for (const p of K.piezas.filter(q => q.g === k && q.tipo === "malla")) for (let i = 0; i < p.v.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = p.v.slice(i, i + 9);
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-12) continue;
    const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2;
    if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) { const h = l1 * ay + l2 * by + l3 * cy; if (y === null || h > y) y = h; } }
  return y; };
const alturaEn = (k, r0, th) => alturaDe(T3, k, r0, th);
ok("3D: el Tyvek va debajo de las perchas y la lona encima (la cámara)", (() => {
  const r = 2.5, tan = Math.tan(P.ang * Math.PI / 180), yPer = T3.yA + C.h0 + (C.Rint - r) * tan;
  return alturaEn("tyvek", r) < yPer && alturaEn("lona_techo", r) > yPer + P.p_anc / Math.cos(P.ang * Math.PI / 180); })());
ok("3D: de adentro hacia afuera en el techo: algodón < freno < aislación < Tyvek < lona", [1.5, 2.0, 2.5, 3.0].every(r => {
  const a = ["algodon_techo", "freno_techo", "aislacion_techo", "tyvek", "lona_techo"].map(k => alturaEn(k, r));
  return a.every((y, i) => y !== null && (i === 0 || y > a[i - 1])); }));
ok("3D: el algodón va sobre los triángulos", (() => { const r = 2.0, tan = Math.tan(P.ang * Math.PI / 180);
  return alturaEn("algodon_techo", r, 0) > T3.yt + P.tri_anc / 2 + (C.r_med - r) * tan; })());
ok("3D: el Tyvek baja sobre la cinta del borde", Math.max(...radios("tyvek")) > C.R && Math.max(...radios("tyvek")) < C.R + 0.01);
ok("3D: la lona del techo pasa la cinta del alero", Math.max(...radios("lona_techo")) > C.Rp + C.c);
ok("3D: el muro de adentro hacia afuera, y la tela en el borde", Math.min(...radios("algodon_muro")) < Math.min(...radios("freno_muro")) && Math.max(...radios("lona_muro")) > C.R);
ok("3D: el muro se corta en las aberturas", (() => { const ab = C.mon.aberturas[0], m = (ab[0] + ab[1]) / 2;
  const p = T3.piezas.find(q => q.g === "lona_muro"); for (let i = 0; i < p.v.length; i += 3) {
    const a = Math.atan2(p.v[i + 2], p.v[i]); if (Math.abs(Math.atan2(Math.sin(a - m), Math.cos(a - m))) < 0.05 && p.v[i + 1] < 1.5) return false; } return true; })());
ok("3D: la cinta del alero, dos capas en la punta de las perchas", cuenta("cinta_alero", "anillo") === 2 && T3.piezas.filter(p => p.g === "cinta_alero").every(p => p.r1 >= C.Rp - 1e-9));
ok("3D: las capas arrancan apagadas en la página", /visibles3d\[k\] = leer3d\("parte:" \+ k, !capa\)/.test(html));
// ── la lona plana ──
ok("lona plana: el cono cerrado ocupa 360° × cos 30° = 311,8°", cerca(C.lona_ang_cono, 311.77, 0.01));
ok("lona plana: radio exterior (Rp + c)/cos + bajada = 4,742", cerca(C.lona_r_ext, (4.0 + 0.02) / Math.cos(Math.PI / 6) + 0.1, 1e-6), C.lona_r_ext);
ok("lona plana: la pieza es el círculo entero, la lengüeta lleva todo el sobrante", C.lona_ang === 360 && cerca(C.lengueta_ang, 48.23, 0.01) && cerca(C.sobrante_cono, 2 * Math.PI * C.lona_r_ext * (1 - Math.cos(Math.PI / 6)), 1e-9));
ok("lona plana: la superficie es la del anillo plano entero", cerca(C.lona_area, Math.PI * (C.lona_r_ext ** 2 - C.lona_r_int ** 2), 1e-9));
// ── el toono por anillos (3d-6) ──
ok("geodésica 3V: 30·9 + 2 caras... 20 × 9 = 180 caras y 270 aristas", (() => { const g = geodesica(3); return g.caras.length === 180 && g.aristas.length === 270; })());
ok("geodésica: todos los puntos en la esfera de radio 1", geodesica(4).aristas.flat().every(p => cerca(Math.hypot(...p), 1, 1e-9)));
ok("3D: el domo no baja de la tapa y no pasa el radio del toono", (() => { const d = T3.piezas.filter(p => p.g === "domo" && p.tipo === "barra");
  const ys = d.flatMap(p => [p.a[1], p.b[1]]), rs = d.flatMap(p => [Math.hypot(p.a[0], p.a[2]), Math.hypot(p.b[0], p.b[2])]);
  return d.length > 50 && Math.max(...rs) <= P.r_toono + P.tapa_vuelo + 1e-6 && Math.max(...rs) > P.r_toono + P.tapa_vuelo - 0.01 && Math.min(...ys) > alturaEn("lona_techo", P.r_toono - 0.04, 0.05); })());
ok("3D: el diente sube del anillo de las perchas hasta debajo de la lona", (() => { const t = T3.piezas.filter(p => p.g === "toono" && p.tipo === "anillo");
  const d = t[t.length - 1]; return cerca(d.r2 - d.r1, P.diente, 1e-9) && d.y2 > d.y1 && d.y2 < alturaEn("lona_techo", d.r1 + 0.001, 0.05) + 1e-6; })());
ok("3D: el anillo tapa va sobre la lona, con un tabique por percha y el faldón abierto abajo", (() => {
  const t = T3.piezas.filter(p => p.g === "tapa"); const fal = t.filter(p => p.tipo === "anillo").find(p => cerca(p.r2, P.r_toono + P.tapa_vuelo, 1e-9) && p.r2 - p.r1 < 0.02);
  return t.filter(p => p.tipo === "barra").length === P.n_per_r && fal && fal.y1 >= alturaEn("lona_techo", fal.r2 + 0.002, 0.05) + P.tapa_ranura - 0.005; })());
ok("3D: el domo es un tercio de la circunferencia: su alto es (1 − cos 60°) del radio de la esfera", (() => {
  const d = T3.piezas.filter(p => p.g === "domo" && p.tipo === "barra"), ys = d.flatMap(p => [p.a[1], p.b[1]]);
  const rb = P.r_toono + P.tapa_vuelo, Rd = rb / Math.sin(Math.PI / 3); return cerca(Math.max(...ys) - Math.min(...ys), Rd * 0.5, 0.01); })());
ok("3D: la tapa aislante cerrada queda debajo del toono con su rendija, y abierta apoya contra el techo", (() => {
  const yB = (Q) => { const K = piezas3d(Q, calc(Q)); const m = K.piezas.find(p => p.g === "tapa_sol" && p.tipo === "malla"); const ys = [];
    for (let i = 1; i < m.v.length; i += 3) ys.push(m.v[i]); return { max: Math.max(...ys), min: Math.min(...ys), K }; };
  const c = yB({ ...P, ts_giro: 0 }), a = yB({ ...P, ts_giro: 1 });
  const ySuj0 = T3.yC - P.tri_anc / 2 - 0.02;
  return cerca(c.max, ySuj0 - P.ts_rendija, 1e-6) && cerca(c.max - c.min, P.ts_esp, 1e-6) && a.min < c.min - 0.5; })());
ok("3D: abierta, la tapa queda debajo del techo (no se mete en la primera capa)", (() => {
  const m = T3.piezas.find(p => p.g === "tapa_sol" && p.tipo === "malla").v, tan = Math.tan(C.dip * Math.PI / 180);
  // la cara de abajo del triángulo que tiene encima (en θ = π), medida sobre su mediana
  for (let i = 0; i < m.length; i += 3) { const s = -m[i]; if (s > P.r_toono + 0.05 && m[i + 1] > T3.yC - P.tri_anc / 2 / Math.cos(C.dip * Math.PI / 180) - (s - P.r_toono) * tan) return false; } return true; })());
ok("3D: abierta, la tapa queda paralela a la cara del triángulo (gira 180° − su pendiente)", (() => {
  const m = T3.piezas.find(p => p.g === "tapa_sol" && p.tipo === "malla").v;
  const p0 = m.slice(0, 3), p1 = m.slice(3, 6), p2 = m.slice(6, 9);
  const u = p1.map((x, i) => x - p0[i]), w = p2.map((x, i) => x - p0[i]);
  const nrm = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]];
  const inc = Math.acos(Math.abs(nrm[1]) / Math.hypot(...nrm)) * 180 / Math.PI; return cerca(inc, C.dip, 0.01); })());
// 3d-11 (Mauro, 17-nov-2026: «las sogas para la tapa en el caso de la doble techo no se
// tienen que dibujar»): ni las escondidas ni la que se ve, abierta o cerrada. Quedan la
// bisagra, la manivela y la traba.
ok("3D: las sogas de la tapa aislante no se dibujan", [0, 1].every(g => {
  const s = piezas3d({ ...P, ts_giro: g }, calc({ ...P, ts_giro: g })).piezas.filter(p => p.g === "tapa_sol");
  return s.length > 0 && !s.some(p => p.mat === "oculto" || p.mat === "cordon") && s.filter(p => p.mat === "tapa").length === 3; }));
ok("3D: la cara vista de la tapa mira hacia adentro abierta y cerrada", (() => {
  for (const g of [0, 1]) { const K = piezas3d({ ...P, ts_giro: g }, calc({ ...P, ts_giro: g }));
    const m = K.piezas.find(p => p.g === "tapa_sol" && p.tipo === "malla").v, aro = K.piezas.find(p => p.g === "tapa_sol" && p.mat === "madera");
    let ym = 0; for (let i = 1; i < m.length; i += 3) ym += m[i] / (m.length / 3);
    if (!((aro.a[1] + aro.b[1]) / 2 < ym)) return false; } return true; })());
ok("3D: la aislación del muro sube al costado del anillo", (() => { const p = T3.piezas.find(q => q.g === "aislacion_muro"); let m = -9;
  for (let i = 0; i < p.v.length; i += 3) if (Math.hypot(p.v[i], p.v[i + 2]) > C.Rext) m = Math.max(m, p.v[i + 1]); return cerca(m, T3.yA, 1e-6); })());
ok("calculo.html ya no pide el cable (el doble techo no lo lleva)", !/faltan los del techo y el cable/.test(html) && /no hace falta el cable/.test(html));

// ── la yurta simple (geo-5, 3d-11) ──
{
  const Q = { ...P, tipo: 2 }, Cs = calc(Q), K = piezas3d(Q, Cs), de = (g) => K.piezas.filter(p => p.g === g);
  ok("simple: una percha por punto de arriba del trei (63), con su escuadra", Cs.simple.n_perchas === C.n_pts && Cs.simple.escuadras === 63);
  ok("simple: el paso es el de los bulones, medido en la cabeza", cerca(Cs.simple.paso, 2 * Math.PI * C.r_trei / 63, 1e-9) && Math.abs(Cs.simple.paso - P.bul) < 0.01);
  ok("simple: el desborde es el suyo (10 cm), y la percha va del toono a la punta", P.desb_s === 0.1 && cerca(Cs.Rp, Cs.R + 0.1, 1e-12)
    && cerca(Cs.simple.largo, (Cs.R + 0.1 - P.r_toono) / Math.cos(P.ang * Math.PI / 180), 1e-9) && cerca(C.Rp, C.R + P.desb, 1e-12));
  ok("3D simple: 63 perchas de la sección de la 2.ª capa; cada una con su escuadra metálica (pata, ala, tornillo 6×40 y bulón)",
    de("perchas").length === 63 && de("escuadras").length === 63 * 4 && de("escuadras").every(p => p.mat === "metal"));
  ok("3D simple: sin primera capa (ni triángulos, ni radiales, ni cal, ni doble cinta, ni anillo tapa, ni tapa aislante)",
    ["triangulos", "radiales", "cal", "cinta", "tapa", "tapa_sol"].every(g => de(g).length === 0));
  ok("3D simple: cada percha arranca en el toono, sin meterse", de("perchas").every(p => cerca(Math.hypot(p.a[0], p.a[2]), P.r_toono, 1e-9)));
  const ES = escuadraSimple(Q, Cs), yt = K.yt, tan = Math.tan(P.ang * Math.PI / 180);
  ok("3D simple: con cable, sin el anillo de arriba; el cable da toda la vuelta por las perchas", de("anillo").length === 0 && de("cable").length === 1
    && cerca(de("cable")[0].r1 + 0.003, Cs.Rp - P.cab_dist, 1e-9) && cerca(Cs.simple.cable, 2 * Math.PI * (Cs.Rp - P.cab_dist), 1e-9) && P.cab_dist === 0.03);
  ok("3D simple: la percha apoya en la cabeza del trei, en su canto de afuera", (() => { const q = de("perchas")[0], r = Math.hypot(q.a[0], q.a[2]);
    const yAb = q.a[1] - P.p_anc / 2 / Math.cos(P.ang * Math.PI / 180); return cerca(yAb + (r - Cs.r_trei) * tan, yt, 1e-9); })());
  ok("escuadra: metálica, por fuera del trei, la pata baja «esc» y la toma el bulón del último agujero", (() => {
    const [[r1, y1], [r2, y2]] = ES.pata; return r1 === Cs.r_trei && r2 === Cs.r_trei && cerca(y2 - y1, P.esc, 1e-12) && y2 === 0
      && cerca(ES.bulon, -P.b_borde, 1e-12) && ES.bulon < y2 && ES.bulon > y1; })());
  ok("escuadra: el ala sale hacia el desborde por debajo de la percha, doblada a 90° − ángulo", (() => {
    const [[ra, ya], [rb, yb]] = ES.ala; return rb > ra && cerca(yb, ES.bajo(rb), 1e-12) && cerca(ES.doblez, 90 - P.ang, 1e-12)
      && cerca(Math.hypot(rb - ra, yb - ya), P.esc, 1e-12); })());
  ok("escuadra: el tornillo 6×40 entra en la percha, a 35 mm del doblez", (() => { const t = de("escuadras").filter(p => p.ancho === 0.006)[0];
    const L = Math.hypot(t.b[0] - t.a[0], t.b[1] - t.a[1], t.b[2] - t.a[2]); return t && cerca(L, 0.04, 1e-9) && t.b[1] > t.a[1] && Cs.simple.tornillos === 63; })());
  ok("3D simple: sin anillo, los montantes no se meten en las perchas", de("montantes").every(p => Math.max(p.a[1], p.b[1]) + (p.a[1] === p.b[1] ? P.esp_mon / 2 : 0) <= yt + ES.bajo((Cs.R + Cs.r_trei_int) / 2) + 1e-9));
  ok("3D simple con anillo: va el anillo, no el cable, y la percha apoya en su canto de afuera", (() => {
    const Qa = { ...Q, s_anillo: 1 }, Ca = calc(Qa), Ka = piezas3d(Qa, Ca), q = Ka.piezas.find(p => p.g === "perchas"), r = Math.hypot(q.a[0], q.a[2]);
    const yAb = q.a[1] - P.p_anc / 2 / Math.cos(P.ang * Math.PI / 180);
    return Ka.piezas.some(p => p.g === "anillo") && !Ka.piezas.some(p => p.g === "cable") && Ca.simple.cable === 0
      && cerca(yAb + (r - Ca.Rext) * tan, Ka.yA, 1e-9) && Ka.piezas.filter(p => p.g === "escuadras").length === 63 * 3; })());
  ok("3D simple: las capas van encima de las perchas, de adentro hacia afuera", [1.5, 2.2, 3.0].every(r => {
    const yTop = yt + ES.bajo(r) + P.p_anc / Math.cos(P.ang * Math.PI / 180);
    const ys = ["algodon_techo", "freno_techo", "aislacion_techo", "tyvek", "lona_techo"].map(g => alturaDe(K, g, r));
    return ys[0] > yTop && ys.every((y, i) => y !== null && (i === 0 || y > ys[i - 1])); }), "");
  ok("simple: el corte no dibuja la cal ni la doble cinta, y sí la escuadra", (() => { const k = corte(Q, Cs).svg1;
    return !/class="cal"/.test(k) && !/class="cinta"/.test(k) && !/class="anillo"/.test(k) && /escuadra metálica · 60°/.test(k) && /tornillo 6×40/.test(k) && /cable de acero/.test(k); })());
  ok("doble: el corte sigue con la cal y la doble cinta", /class="cal"/.test(corte(P, C).svg1) && /class="cinta"/.test(corte(P, C).svg1));
  ok("simple: un toono chico avisa que las perchas no entran", calc({ ...Q, r_toono: 0.35 }).simple.aprieta && !Cs.simple.aprieta);
}
// ── el piso de una capa (geo-6, Mauro, 17-nov-2026: «el piso tiene que tener la opción de ser doble capa o con aislación») ──
{
  const Q = { ...P, piso_tipo: 2 }, Cq = calc(Q), K = piezas3d(Q, Cq);
  ok("piso de una capa: sin OSB de abajo ni celulosa; una capa de placas", !K.piezas.some(p => p.g === "osb_inf") && Cq.cel_neto === 0 && Cq.capas_osb === 1
    && cerca(Cq.alto_piso, P.tir_alt + P.osb_sup, 1e-12) && C.capas_osb === 2 && C.cel_neto > 0);
  ok("piso de una capa: las vigas suben a tocar los tirantes", cerca(Math.max(...K.piezas.filter(p => p.g === "vigas").map(p => p.a[1] + p.alto / 2)), 0, 1e-9));
  // geo-8 (Mauro: «doble capa sin aislación no tiene sentido»): dos opciones, y la doble
  // va siempre con la aislación del alto del tirante.
  ok("calculo.html: el piso tiene dos opciones, doble con aislación o simple sin", /\[\[1, "Doble capa con aislación"\], \[2, "Simple · sin aislación"\]\]/.test(html) && !/Doble capa sin aislación/.test(html));
  ok("piso doble: la aislación es del alto del tirante", C.piso_aislado && cerca(C.cel_bruto, C.area * P.tir_alt, 1e-12) && calc({ ...P, piso_tipo: 3 }).piso_aislado);
  ok("piso de una capa: el corte no dibuja el OSB de abajo", (corte(Q, Cq).svg2.match(/class="osb"/g) || []).length === 1 && (corte(P, C).svg2.match(/class="osb"/g) || []).length === 2);
}
// ── las ventanas (geo-9, 3d-13, Mauro, 17-nov-2026: «el modelo de 6 m tiene una puerta y dos ventanas») ──
{
  const Q = { ...P, D: 6, tipo: 2, tono_tipo: 2, r_toono: 0.5, n_ab: 1, n_gr: 1, n_vt: 2 }, Cq = calc(Q), K = piezas3d(Q, Cq), de = (g) => K.piezas.filter(p => p.g === g);
  const G = Cq.mon.grupos;
  ok("ventanas: una puerta y dos ventanas, repartidas a 120°", G.length === 3 && G.map(g => g.tipo).join() === "puerta,ventana,ventana"
    && G.every((g, i) => cerca(g.c, 2 * Math.PI * i / 3, 1e-12)));
  ok("ventanas: dos montantes por ventana, del ancho pedido en el trei", Cq.mon.ventanas.length === 2 && Cq.mon.ventanas.every(([a, b]) => cerca((b - a) * Cq.r_trei_int, P.vt_anc, 1e-9))
    && G.filter(g => g.tipo === "ventana").every(g => g.montantes.length === 2));
  ok("ventanas: las aberturas de piso siguen siendo sólo las puertas", Cq.mon.aberturas.length === 1);
  ok("3D ventanas: un vidrio por ventana, entre el antepecho y el alto", (() => { const v = de("vidrios")[0].v; if (v.length !== 2 * 18) return false;
    const ys = []; for (let i = 1; i < v.length; i += 3) ys.push(v[i]); const yP = P.tir_alt + P.osb_sup;
    return cerca(Math.min(...ys), yP + P.vt_ant, 1e-9) && cerca(Math.max(...ys), yP + P.vt_ant + P.vt_alto, 1e-9); })());
  ok("3D ventanas: el trei sigue debajo del alféizar y se corta en el hueco", (() => { const am = Cq.mon.ventanas[0], c = (am[0] + am[1]) / 2, yP = P.tir_alt + P.osb_sup;
    const en = (y0, y1) => de("trei").filter(p => { const m = [(p.a[0] + p.b[0]) / 2, (p.a[1] + p.b[1]) / 2, (p.a[2] + p.b[2]) / 2], a = Math.atan2(m[2], m[0]);
      return Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < 0.05 && m[1] > y0 && m[1] < y1; }).length;
    return en(yP, yP + P.vt_ant - P.esp_mon - 0.05) > 0 && en(yP + P.vt_ant, yP + P.vt_ant + P.vt_alto) === 0; })());
  // 3d-14 (Mauro: «la puerta y las ventanas se consiguen aparte… sólo prever los montantes»)
  const yP = P.tir_alt + P.osb_sup;
  ok("3D vanos: cada abertura, puerta o ventana, lleva su piso; el de la ventana, en el antepecho", (() => { const v = de("suelo_ab")[0].v; const ys = new Set();
    for (let i = 1; i < v.length; i += 3) ys.add(Math.round(v[i] * 1000)); return [...ys].some(y => Math.abs(y / 1000 - (yP + P.vt_ant)) < 0.002)
      && [...ys].some(y => Math.abs(y / 1000 - (yP + P.umb_esp)) < 0.002); })());
  ok("3D vanos: los montantes de la ventana se paran en su piso", G.filter(g => g.tipo === "ventana").every(g => g.montantes.every(a =>
    de("montantes").some(p => p.a[1] !== p.b[1] && cerca(Math.min(p.a[1], p.b[1]), yP + P.vt_ant, 1e-9) && cerca(Math.atan2(p.a[2], p.a[0]), Math.atan2(Math.sin(a), Math.cos(a)), 1e-9)))));
  ok("3D vanos: dos tapas por montante de abertura (interior y exterior), ninguna en los sueltos", de("tapas").length === 2 * 2 * G.length
    && de("tapas").every(p => p.ancho === P.tapa_anc && p.alto === P.tapa_esp));
  ok("3D vanos: la tapa interior contra el trei, la exterior por fuera de la lona", (() => { const rs = de("tapas").map(p => Math.hypot(p.a[0], p.a[2]));
    return rs.filter(r => r < Cq.r_trei_int).length === 2 * G.length && rs.filter(r => r > Cq.R + 0.003).length === 2 * G.length; })());
  ok("3D vanos: sin alféizar suelto; sólo los dinteles", de("montantes").filter(p => p.a[1] === p.b[1]).length === 2 + (K.conDintel ? 1 : 0));
  const V = vanos(Q, Cq);
  ok("vanos: por abertura un piso, dos montantes y cuatro tapas", V.pisos.length === 3 && V.montantes.length === 6 && V.tapas.length === 12
    && V.montantes.every(m => m.ancho === Cq.mon_ancho && m.esp === P.esp_mon) && P.esp_mon === 0.04);
  ok("vanos: el montante de la ventana es más corto que el de la puerta", V.montantes.find(m => m.tipo === "ventana").largo < V.montantes.find(m => m.tipo === "puerta").largo);
  const Rs = resumen(Q, Cq);
  ok("resumen: la madera es la suma de sus partes, y las telas salen del cálculo", cerca(Rs.madera_total, Object.values(Rs.madera).reduce((a, b) => a + b, 0), 1e-12)
    && Rs.madera_total > 1 && Rs.madera_total < 4 && cerca(Rs.lona_techo, Cq.lona_area, 1e-12) && Rs.puertas === 1 && Rs.ventanas === 2 && Rs.placas === 2 * Cq.placas_capa);
  ok("resumen: en la simple no entra la madera de la primera capa", resumen(P, C).madera.techo > Rs.madera.techo);
}
// ── la lista de materiales (geo-12) ──
{
  const Q = { ...P, D: 6, tipo: 2, tono_tipo: 2, r_toono: 0.8, sa_alto: 0.35, n_ab: 1, n_gr: 1, n_vt: 2, piso_tipo: 2 }, Cq = calc(Q), L = materiales(Q, Cq);
  const de = (k) => L.find(x => x.k === k);
  ok("materiales: cada renglón tiene nombre en castellano y unidad", L.length > 20 && L.every(x => NOMBRES_MAT[x.k] && NOMBRES_MAT.u[x.u] && NOMBRES_MAT.grupos[x.g]));
  ok("materiales: la simple de 6 m lleva perchas, cable y escuadras arriba y abajo, y no lleva primera capa ni anillo de arriba",
    de("perchas").n === Cq.n_pts && de("cable") && de("escuadras").n === 2 * Cq.n_pts && !de("triangulos") && !de("cal") && !de("anillo") && !de("tornillos_690"));
  ok("materiales: piso simple, una capa de OSB y sin celulosa", de("osb").n === Cq.placas_capa && !de("celulosa") && de("osb").esp.length === 1);
  ok("materiales: la puerta y las ventanas se compran hechas, y sus vanos sí están", de("puertas").compra && de("ventanas").n === 2 && de("montantes").n === 6 + Cq.mon.sueltos.length && de("tapas").n === 12);
  ok("materiales: el sobrealto pieza por pieza (geo-13): solera y cabezal, parantes, limatesas, marcos, vidrios y herrajes de las que abren", (() => {
    const n = Cq.sobrealto.n_vent; return de("sob_solera").n === 2 * n && de("sob_parantes").n === n && de("sob_limatesas").n === n && de("sob_limatesas").sec.join() === "80,40"
      && de("sob_marcos").n === n && de("vidrio").n === n && de("vidrio").medida[0] < de("sob_marcos").medida[0] && de("bisagras").n === 4 && de("compases").n === 2
      && cerca(de("techito_capas").n, Cq.sobrealto.area_techito, 1e-9); })());
  ok("resumen: la madera del toono suma la del sobrealto", resumen(Q, Cq).madera.toono > resumen({ ...Q, tono_tipo: 1 }, calc({ ...Q, tono_tipo: 1 })).madera.toono);
  ok("materiales: sin precios", !JSON.stringify(L).match(/precio|USD|UYU|\$/));
  ok("materiales: el doble techo lleva su primera capa y su cal", (() => { const D = materiales(P, C); return D.some(x => x.k === "triangulos") && D.some(x => x.k === "cal") && D.some(x => x.k === "celulosa"); })());
  ok("materiales: el renglón se arma con la sección y los largos", (() => { const r = renglonMat(de("perchas"), NOMBRES_MAT, (v, d) => v.toFixed(d));
    return /80 × 40 mm/.test(r.detalle) && /m c\/u/.test(r.detalle) && new RegExp("^" + Cq.n_pts + " piezas$").test(r.cant); })());
}
// ── el toono en sobrealto (geo-5, 3d-11) ──
{
  const Q = { ...P, tipo: 2, tono_tipo: 2 }, Cs = calc(Q), K = piezas3d(Q, Cs), de = (g) => K.piezas.filter(p => p.g === g);
  const A = Cs.sobrealto;
  ok("sobrealto: 8 ventanas de 30 cm por defecto, sobre el aro del remate", A.n_vent === 8 && A.alto === 0.3 && cerca(A.r_aro, P.r_toono + P.tapa_vuelo - 0.02, 1e-9));
  ok("sobrealto: el techito pasa el aro el desborde", cerca(A.r_techito - A.r_aro, P.sa_desb, 1e-9));
  ok("3D sobrealto: sin domo; solera, cabezal, parante y limatesa por cara", de("domo").length === 0 && de("sobrealto").filter(p => p.tipo === "barra").length === 8 * 4);
  ok("3D sobrealto: una ventana por cara, con marco, vidrio y compás", de("ventanas").filter(p => p.mat === "madera").length === 8 * 4
    && de("ventanas").filter(p => p.mat === "tapa").length === 2 && de("ventanas").find(p => p.mat === "vidrio").v.length === 8 * 18);
  const radioAbajo = (Qx) => { const v = piezas3d(Qx, calc(Qx)).piezas.find(p => p.g === "ventanas" && p.mat === "vidrio").v;
    let rMin = 9, rMax = 0, yMin = 9, rDeYmin = 0;
    for (let i = 0; i < v.length; i += 3) { const r = Math.hypot(v[i], v[i + 2]); rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); if (v[i + 1] < yMin) { yMin = v[i + 1]; rDeYmin = r; } }
    return { rMin, rMax, yMin, rDeYmin }; };
  ok("3D sobrealto: las ventanas se abren hacia arriba y hacia afuera (cerradas, a plomo)", (() => {
    const c = radioAbajo({ ...Q, sa_abre: 0 }), a = radioAbajo({ ...Q, sa_abre: 30, sa_abiertas: 8 });
    return a.yMin > c.yMin + 0.01 && a.rDeYmin > c.rDeYmin + 0.05; })());
  ok("3D sobrealto: se abren sólo dos, opuestas (3d-15)", (() => { const v = de("ventanas").filter(p => p.mat === "tapa");
    const ang = v.map(p => Math.atan2(p.a[2], p.a[0])); const d = Math.abs(Math.atan2(Math.sin(ang[0] - ang[1]), Math.cos(ang[0] - ang[1])));
    return v.length === 2 && cerca(d, Math.PI, 0.05) && Cs.sobrealto.n_abiertas === 2; })());
  ok("3D: el OSB es opaco (semitransparente parecía que iba debajo de los tirantes)", !/osb: 0\.\d/.test(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8").match(/const OPACIDAD = \{[^}]*\}/)[0]));
  ok("calculo.html: en castellano el piso se llama piso, no plancher", !/plancher/i.test(html.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "")));
  ok("calculo.html: lo que no corresponde queda deshabilitado, no sólo gris", /x\.disabled = off/.test(html) && /arriba: \["n_partes"\]/.test(html));
  ok("3D sobrealto: el techito cubre las ventanas abiertas", (() => { const a = radioAbajo({ ...Q, sa_abiertas: 8 }); const t = de("sobrealto").find(p => p.tipo === "malla").v;
    let r = 0; for (let i = 0; i < t.length; i += 3) r = Math.max(r, Math.hypot(t[i], t[i + 2])); return r > a.rMax && cerca(r, A.r_techito, 1e-6); })());
  ok("3D sobrealto: el modelo crece con el sobrealto", K.alto > piezas3d({ ...Q, tono_tipo: 1 }, calc({ ...Q, tono_tipo: 1 })).alto - 0.5);
  ok("3D: en el doble techo el sobrealto va sobre el anillo tapa", (() => { const Qd = { ...P, tono_tipo: 2 }, Kd = piezas3d(Qd, calc(Qd));
    const tapa = Kd.piezas.filter(p => p.g === "tapa" && p.tipo === "anillo"), yTapa = Math.max(...tapa.map(p => p.y2));
    const sol = Kd.piezas.filter(p => p.g === "sobrealto" && p.tipo === "barra"); return Math.min(...sol.map(p => Math.min(p.a[1], p.b[1]))) >= yTapa - 0.03 && Kd.piezas.some(p => p.g === "tapa_sol"); })());
}
// ── los colores (3d-11, Mauro: «corrige los colores azules de los listones…»
//    y «la madera que va entre los triángulos está roja… también color madera») ──
{
  const f3 = readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8");
  const color = (k) => { const m = f3.match(new RegExp("\\b" + k + ": 0x([0-9a-f]{6})")); return m && [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16)); };
  const madera = (c) => c && c[0] > c[1] && c[1] > c[2] && c[0] - c[2] > 60 && c[1] - c[2] > 20;   // tono madera: rojo > verde > azul
  ok("3D: las cintas del muro y del alero son color madera, no azules", madera(color("cinta")), JSON.stringify(color("cinta")));
  ok("3D: las perchas radiales son color madera, no rojas", madera(color("radial")), JSON.stringify(color("radial")));
}
// ── el link para el cliente (calculo-23, propuesta-1) ──
{
  const pr = readFileSync(new URL("./propuesta.html", import.meta.url), "utf8");
  const reglas = readFileSync(new URL("./REGLAS.txt", import.meta.url), "utf8");
  const bl = (reglas.match(/match \/entregas\/\{token\} \{([\s\S]*?)\n    \}/) || [])[1] || "";
  ok("reglas: entregas se lee sin cuenta de a uno, activo y sin vencer; listar sólo con permiso", /allow get: if token\.size\(\) >= 20\s*&& resource\.data\.activo == true\s*&& request\.time < resource\.data\.vence;/.test(bl)
    && !/allow (list|read)[^;]*if (true|token)/.test(bl) && /allow read, delete: if con\('calculo'\) \|\| con\('presupuestos'\);/.test(bl));
  ok("reglas: el agente crea y actualiza un link, pero no lo borra", /allow create, update: if \(con\('calculo'\) \|\| con\('presupuestos'\) \|\| esAgente\(\)\)/.test(bl)
    && !/allow[^;]*delete[^;]*esAgente/.test(bl));
  ok("calculo.html: el lugar de abajo es el alto medido de la barra de guardar", /--barra-p/.test(html) && /ResizeObserver\(\(\) => document\.body\.style\.setProperty\("--barra-p"/.test(html));
  ok("reglas: la forma de una entrega es fija (sin costos ni contacto)", /hasOnly\(\['titulo', 'para', 'idioma', 'descripcion', 'incluye',\s*'no_incluye', 'precio', 'moneda', 'datos', 'vence', 'activo', 'actualizado'\]\)/.test(bl));
  ok("calculo.html escribe la entrega con esas claves y nada más", (() => { const m = html.match(/const pub = \{([\s\S]*?)\n  \};/); if (!m) return false;
    const ks = [...m[1].matchAll(/^\s{4}(\w+)[,:]/gm)].map(x => x[1]); return ks.length >= 10 && ks.every(k => ["titulo","para","idioma","descripcion","incluye","no_incluye","precio","moneda","datos","vence","activo","actualizado"].includes(k)); })());
  ok("calculo.html: la lista de links para clientes con copiar, ver, +30 días, desactivar y pasar a un cálculo (calculo-32)",
    /getDocs\(collection\(db, "entregas"\)\)/.test(html) && ["copiar", "mas30", "apagar", "prender", "calculo"].every(k => html.includes(`data-link="${k}"`))
    && /addDoc\(collection\(db, "calculos"\), cuerpo\)/.test(html));
  ok("el token del link son 16 bytes al azar (22 caracteres)", /new Uint8Array\(16\); crypto\.getRandomValues/.test(html));
  ok("propuesta.html no carga el SDK de Firebase ni pide sesión", !/firebase-init|gstatic\.com\/firebasejs|signIn/.test(pr) && /firestore\.googleapis\.com/.test(pr));
  ok("propuesta.html no se indexa y no está en el SHELL", /<meta name="robots" content="noindex,nofollow">/.test(pr) && !/'\.\/propuesta\.html'/.test(sw));
  ok("propuesta.html lee las medidas con calculo-geo.js y el 3D con calculo-3d.js, diferidos", /import\("\.\/calculo-geo\.js"\)/.test(pr) && /import\("\.\/calculo-3d\.js"\)/.test(pr));
  const mod = (pr.match(/<script type="module">([\s\S]*?)<\/script>/) || [])[1] || "";
  ok("propuesta.html: su módulo parsea", parsea(mod));
  ok("propuesta.html: la lista de materiales tiene cada nombre en francés, inglés y portugués", (() => { const b = (mod.match(/const MAT_T = \{([\s\S]*?)\n\};/) || [])[1] || "";
    return Object.keys(NOMBRES_MAT).filter(k => typeof NOMBRES_MAT[k] === "string").every(k => (b.match(new RegExp("\\b" + k + ": \"", "g")) || []).length >= 3)   // «toono» está también en los grupos
      && /materiales\(P, C\)/.test(mod); })());
  ok("propuesta.html: los cuatro idiomas tienen las mismas claves", (() => { const T = mod.match(/const T = \{([\s\S]*?)\n\};/)[1];
    const claves = (l) => [...(T.split(new RegExp("\\n  " + l + ": \\{"))[1] || "").split(/\n  \w\w: \{/)[0].matchAll(/(\w+):/g)].map(x => x[1]).sort().join();
    return ["fr", "en", "pt"].every(l => claves(l) === claves("es")) && claves("es").length > 50; })());
}

ok("calculo-3d.js parsea como módulo", parsea(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")));
ok("calculo.html importa calculo-3d.js", /from "\.\/calculo-3d\.js"/.test(html));
ok("three.js se pide diferido, nunca con un import estático", !/^import[^\n]*three/m.test(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")) && /await import\(THREE_URL\)/.test(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")));
ok("calculo-3d.js está en el SHELL", /'\.\/calculo-3d\.js'/.test(sw));

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);

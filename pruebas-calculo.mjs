// pruebas-calculo.mjs — el banco de la geometría de Cálculos (calculo-geo.js).
// Sin npm y sin navegador:  node pruebas-calculo.mjs
//
// Compara contra los números del manual técnico del plancher (versión
// Christine, 1-nov-2026), calculados a mano, y prueba los bordes: que ninguna
// medida rara deje un NaN ni un dibujo vacío.

import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { calc, corte, cuerdas, pilares, montaje } from "./calculo-geo.js";
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
ok("3D: cada parte tiene su casilla, y cada casilla su parte", (() => { const g = new Set(T3.piezas.map(p => p.g));
  return [...g].every(x => PARTES.some(([k]) => k === x)) && PARTES.every(([k]) => g.has(k)); })());
ok("3D: lo que resalta cada medida son partes que existen", Object.values(CAMPO_PARTES).flat().every(x => PARTES.some(([k]) => k === x)));
ok("3D: cada medida que resalta es un campo de la página", Object.keys(CAMPO_PARTES).every(k => k in PORDEF));
ok("3D: toda medida de la estructura resalta algo", ["D","ang","alto","E","e_trei","tir_alt","viga_alt","n_tri","p_anc","r_toono","osb_sup"].every(k => (CAMPO_PARTES[k] || []).length > 0));
ok("calculo.html: el 3D está en la pestaña de las medidas", /<div id="t-datos">[\s\S]*?id="vista3d"[\s\S]*?id="campos"/.test(html) && !/\["3d","3D"\]/.test(html));
for (const [nom, Q] of [["Christine", P], ["4 m", { ...P, D: 4 }], ["12 m", { ...P, D: 12 }], ["10 triángulos", { ...P, n_tri: 10 }], ["6 triángulos", { ...P, n_tri: 6 }],
  ["sin aberturas", { ...P, n_ab: 0 }], ["domo media esfera, 5V", { ...P, dom_ang: 90, dom_frec: 5 }], ["domo bajo", { ...P, dom_ang: 30, dom_frec: 1 }], ["una abertura", { ...P, n_ab: 1, n_gr: 1 }], ["aberturas bajas", { ...P, alt_ab: 1.9 }], ["sin campos nuevos", Object.fromEntries(Object.entries(P).filter(([k]) => !["anc_ab","sep_mon","umb_esp","umb_vuelo","umb_caida","lona_baja","diente","tapa_cam","tapa_vuelo","dom_ang","dom_frec","tapa_ranura"].includes(k)))]]) {
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
const alturaEn = (k, r0, th = 0.1) => { const x = r0 * Math.cos(th), z = r0 * Math.sin(th); let y = null;
  for (const p of T3.piezas.filter(q => q.g === k && q.tipo === "malla")) for (let i = 0; i < p.v.length; i += 9) {
    const [ax, ay, az, bx, by, bz, cx, cy, cz] = p.v.slice(i, i + 9);
    const d = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz); if (Math.abs(d) < 1e-12) continue;
    const l1 = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / d, l2 = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / d, l3 = 1 - l1 - l2;
    if (l1 >= -1e-9 && l2 >= -1e-9 && l3 >= -1e-9) { const h = l1 * ay + l2 * by + l3 * cy; if (y === null || h > y) y = h; } }
  return y; };
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
ok("3D: la aislación del muro sube al costado del anillo", (() => { const p = T3.piezas.find(q => q.g === "aislacion_muro"); let m = -9;
  for (let i = 0; i < p.v.length; i += 3) if (Math.hypot(p.v[i], p.v[i + 2]) > C.Rext) m = Math.max(m, p.v[i + 1]); return cerca(m, T3.yA, 1e-6); })());
ok("calculo.html ya no pide el cable (el doble techo no lo lleva)", !/faltan los del techo y el cable/.test(html) && /no hace falta el cable/.test(html));

ok("calculo-3d.js parsea como módulo", parsea(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")));
ok("calculo.html importa calculo-3d.js", /from "\.\/calculo-3d\.js"/.test(html));
ok("three.js se pide diferido, nunca con un import estático", !/^import[^\n]*three/m.test(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")) && /await import\(THREE_URL\)/.test(readFileSync(new URL("./calculo-3d.js", import.meta.url), "utf8")));
ok("calculo-3d.js está en el SHELL", /'\.\/calculo-3d\.js'/.test(sw));

console.log(`\n${bien} bien, ${mal} mal`);
process.exit(mal ? 1 : 0);

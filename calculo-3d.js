// calculo-3d.js — el modelo en 3D de la estructura, con las medidas del cálculo.
// Sello: 3d-7 (2-nov-2026). 3d-7: el domo es un tercio de la circunferencia y
// llega al borde exterior del anillo tapa; el faldón deja una ranura sobre la
// lona. 3d-6: 3d-6: el toono por anillos —el diente y las
// cámaras, el anillo tapa hermanado y el domo geodésico—, la aislación llenando
// todo y la lona entera. 3d-5: 3d-1: «un primer render 3d de la estructura total».
// 3d-2: el 3D pasa a la pestaña de las MEDIDAS, con cada parte por separado
// (prender y apagar), y la parte que se está midiendo se resalta (Mauro: «para
// tener noción clara de qué se está modificando»). Todo a escala real: cada
// barra tiene su sección y su largo en metros, y el piso lleva una cuadrícula
// de 1 m para tener la medida a la vista.
//
// 3d-5: las CAPAS de la yurta, cada una con su casilla y apagadas al abrir
// (si no, tapan la estructura), y la carpintería que faltaba: montantes,
// aberturas con su piso de una pieza, la cinta del alero y la tapa del toono
// (Mauro, 2-nov-2026: «agregar al esquema 3d las capas de la yurta… y los
// elementos de carpintería que faltan»). El orden, de adentro hacia afuera:
//   TECHO: algodón (se ve detrás de los triángulos) · freno de vapor ·
//   aislación · Tyvek (cierra el primer techo; se fija y sella sobre la cinta
//   del borde, encima de la lona del muro, y pasa sobre la cal: las perchas se
//   atornillan haciendo sándwich con él) · perchas · cinta del alero en dos
//   capas · lona de PVC con urlete y cordón, acordonada en zigzag sobre la
//   línea de una percha. Entre el Tyvek y la lona queda la CÁMARA VENTILADA.
//   MURO: algodón · freno de vapor (optativo) · aislación · tela náutica de
//   entramado, que respira.
//
// Dos mitades, y la separación es a propósito:
//   · piezas3d(P, C) — la geometría: una lista de piezas (barras, anillos,
//     discos, calces) en metros, sin navegador y sin three.js. La corre el
//     banco (`node pruebas-calculo.mjs`) contra los números del manual.
//   · montar(caja, ...) — el dibujo: baja three.js del CDN RECIÉN cuando se
//     abre la pestaña, con import() dentro de un try. Si el CDN no contesta,
//     la página sigue andando y la pestaña lo dice (la misma regla del SDK de
//     Firebase desde init-2: una dependencia de afuera nunca es estática).
//
// Ejes: x y z en el piso, y hacia arriba. y = 0 es la cara de arriba del OSB
// de abajo (donde apoyan los tirantes). Todo sale de calc(P): si cambia una
// medida, cambia el modelo.

export const SELLO_3D = "3d-7";
export const THREE_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/+esm";
export const ORBIT_URL = "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/controls/OrbitControls.js/+esm";
// Las dos con «/+esm»: jsDelivr reescribe el «import from \"three\"» de OrbitControls a
// la MISMA dirección de THREE_URL, así que no hace falta un importmap y hay una sola three.

// Las partes que se prenden y apagan, en el orden de la obra. La clave es el
// campo `g` de cada pieza de piezas3d.
export const PARTES = [
  ["pilares",     "Pilares"],
  ["vigas",       "Vigas"],
  ["osb_inf",     "OSB de abajo"],
  ["tirantes",    "Tirantes"],
  ["anillo_piso", "Anillo del piso"],
  ["osb_sup",     "OSB de arriba"],
  ["trei",        "Trei"],
  ["zocalos",     "Zócalos"],
  ["anillo",      "Anillo periférico"],
  ["cal",         "Cal"],
  ["cinta",       "Doble cinta"],
  ["triangulos",  "Triángulos"],
  ["radiales",    "Perchas radiales"],
  ["toono",       "Toono"],
  ["perchas",     "Perchas · 2.ª capa"],
  ["cinta_alero", "Cinta del alero"],
  ["tapa",        "Toono · anillo tapa"],
  ["domo",        "Toono · domo geodésico"],
  ["montantes",   "Montantes"],
  ["suelo_ab",    "Piso de las aberturas"],
  // Las capas: el tercer dato las marca, y arrancan apagadas.
  ["algodon_techo",   "Techo · algodón", "capa"],
  ["freno_techo",     "Techo · freno de vapor", "capa"],
  ["aislacion_techo", "Techo · aislación", "capa"],
  ["tyvek",           "Techo · Tyvek", "capa"],
  ["lona_techo",      "Techo · lona de PVC", "capa"],
  ["algodon_muro",    "Muro · algodón", "capa"],
  ["freno_muro",      "Muro · freno de vapor", "capa"],
  ["aislacion_muro",  "Muro · aislación", "capa"],
  ["lona_muro",       "Muro · tela náutica", "capa"],
];
export const GRUPOS = PARTES;   // el nombre de 3d-1

// Qué partes cambian con cada medida de la pestaña «Medidas»: al tocar un
// campo, esas se resaltan y el resto queda en transparencia.
export const CAMPO_PARTES = {
  D: ["anillo_piso", "anillo", "tirantes", "vigas", "osb_sup", "cal", "cinta"],
  ang: ["triangulos", "radiales", "perchas", "cal"],
  alto: ["trei"],
  ais_nom: ["cal", "cinta", "anillo", "anillo_piso", "trei"],
  ais_techo: ["cal", "perchas", "toono"],
  rel: ["cal", "cinta", "anillo", "perchas"],
  E: ["anillo", "anillo_piso"], e_mad: ["anillo", "anillo_piso", "toono"],
  n_cap: ["anillo", "anillo_piso"], n_partes: ["anillo"], T: ["trei"],
  e_per: ["cinta"], anc_per: ["cinta"],
  e_trei: ["trei"], anc_trei: ["trei"], bul: ["trei"], b_borde: ["trei"],
  e_int: ["zocalos"], anc_int: ["zocalos"],
  paso_t: ["tirantes"], tir_alt: ["tirantes", "anillo_piso"], tir_anc: ["tirantes"],
  paso_v: ["vigas", "pilares"], viga_alt: ["vigas"], viga_anc: ["vigas"],
  pil_max: ["pilares"], pil_borde: ["pilares"],
  placa_a: ["osb_inf", "osb_sup"], placa_l: ["osb_inf", "osb_sup"],
  osb_inf: ["osb_inf"], osb_sup: ["osb_sup"], desp: ["osb_inf", "osb_sup"],
  n_tri: ["triangulos", "radiales"], tri_anc: ["triangulos", "radiales"], tri_esp: ["triangulos", "radiales"],
  n_per_r: ["perchas", "cal"], desb: ["perchas"], p_anc: ["perchas"], p_alt: ["perchas", "cal"],
  r_toono: ["toono", "triangulos", "radiales", "tapa"], sep_max: ["radiales"],
  n_ab: ["montantes", "suelo_ab", "trei"], n_gr: ["montantes", "suelo_ab", "trei"],
  alt_ab: ["montantes", "trei"], esp_mon: ["montantes", "suelo_ab"], anc_ab: ["montantes", "suelo_ab", "trei", "zocalos"],
  sep_mon: ["montantes"], umb_esp: ["suelo_ab", "montantes"], umb_vuelo: ["suelo_ab"], umb_caida: ["suelo_ab"],
  lona_baja: ["lona_techo"],
  diente: ["toono"], tapa_cam: ["tapa"], tapa_vuelo: ["tapa", "domo"], tapa_ranura: ["tapa"], dom_ang: ["domo"], dom_frec: ["domo"],
};
for (const k of ["ais_techo", "rel", "ang"]) CAMPO_PARTES[k].push("aislacion_techo", "tyvek", "lona_techo");
for (const k of ["ais_nom", "rel", "alto"]) CAMPO_PARTES[k].push("aislacion_muro", "lona_muro");
CAMPO_PARTES.desb.push("cinta_alero", "lona_techo");
CAMPO_PARTES.e_per.push("cinta_alero"); CAMPO_PARTES.anc_per.push("cinta_alero");
CAMPO_PARTES.alto.push("montantes", "algodon_muro", "freno_muro");

// El arriostramiento de un triángulo, en su plano: s = lateral desde la
// mediana, t = a lo largo de la mediana desde la base. Es el de Christine
// (1-nov-2026, n = 8: base 1,817, mediana 2,586), llevado a proporción de la
// base B y la mediana M para que otro triángulo lo herede con la misma forma:
//   paralelas a 0,30 B de la mediana, de la base hasta los lados (0,40 M);
//   CUATRO Λ equidistantes con la V (3d-4, Mauro, 1-nov: «cuatro Λ
//   equidistantes»): los pies cada 0,1416 M (0,366 en Christine), sobre las
//   paralelas o, si ya terminaron, sobre los lados, y suben 0,116 M;
//   la V con el vértice a 0,567 M (cuatro pasos) y los brazos a 0,700 M.
//   El hueco mayor, entre dos Λ, queda en 0,32 (con tres eran 0,43).
// SIN travesaños paralelos a la base (3d-3, Mauro, 1-nov: «no van las líneas
// paralelas a la base, sólo la altura, las dos paralelas a la altura y las
// diagonales»).
export function arriostramiento(B, M) {
  const hb = B / 2, ancho = (t) => hb * (1 - t / M);
  const seg = [];
  const add = (s1, t1, s2, t2, tipo) => seg.push({ s1, t1, s2, t2, tipo });
  add(-hb, 0, hb, 0, "base"); add(-hb, 0, 0, M, "lado"); add(hb, 0, 0, M, "lado");
  add(0, 0, 0, M, "mediana");
  const sp = 0.30 * B, tp = M * (1 - sp / hb);
  for (const g of [-1, 1]) add(g * sp, 0, g * sp, tp, "paralela");
  const paso = 0.14163 * M, sube = 0.11601 * M;
  for (let i = 0; i < 4; i++) { const t = i * paso, x = Math.min(sp, ancho(t));
    for (const g of [-1, 1]) add(g * x, t, 0, t + sube, "lambda"); }
  const tv = 4 * paso, tb = 0.69992 * M;
  for (const g of [-1, 1]) add(0, tv, g * ancho(tb), tb, "v");
  return seg;
}

const v3 = (x, y, z) => [x, y, z];
const rotY = (p, a) => [p[0] * Math.cos(a) + p[2] * Math.sin(a), p[1], -p[0] * Math.sin(a) + p[2] * Math.cos(a)];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const addv = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const len = (a) => Math.hypot(a[0], a[1], a[2]);
const nor = (a) => mul(a, 1 / (len(a) || 1));
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

// La esfera geodésica de frecuencia n, desde un icosaedro con un vértice
// arriba: cada cara se parte en n × n triángulos y los puntos se llevan a la
// esfera de radio 1. Devuelve las aristas y las caras (puntos [x, y, z]).
export function geodesica(n) {
  const t = Math.atan(0.5), V = [[0, 1, 0]], up = [], lo = [];
  for (let i = 0; i < 5; i++) {
    const a = 2 * Math.PI * i / 5, b = a + Math.PI / 5;
    up.push([Math.cos(t) * Math.cos(a), Math.sin(t), Math.cos(t) * Math.sin(a)]);
    lo.push([Math.cos(t) * Math.cos(b), -Math.sin(t), Math.cos(t) * Math.sin(b)]);
  }
  const B = [0, -1, 0], F = [];
  for (let i = 0; i < 5; i++) {
    const j = (i + 1) % 5;
    F.push([V[0], up[i], up[j]], [up[i], lo[i], up[j]], [up[j], lo[i], lo[j]], [B, lo[j], lo[i]]);
  }
  const unit = (p) => { const l = Math.hypot(...p); return p.map(x => x / l); };
  const clave = (p) => p.map(x => x.toFixed(6)).join(",");
  const aristas = new Map(), caras = [];
  for (const [A, Bv, Cv] of F) {
    const P = (i, j) => unit(A.map((x, k) => (x * (n - i - j) + Bv[k] * i + Cv[k] * j) / n));
    const arista = (p, q) => { const k = [clave(p), clave(q)].sort().join("|"); if (!aristas.has(k)) aristas.set(k, [p, q]); };
    for (let i = 0; i < n; i++) for (let j = 0; i + j < n; j++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i, j + 1);
      caras.push([a, b, c]); arista(a, b); arista(a, c); arista(b, c);
      if (i + j + 1 < n) caras.push([b, P(i + 1, j + 1), c]);
    }
  }
  return { aristas: [...aristas.values()], caras };
}

export function piezas3d(P, C) {
  const out = [];
  const rad = P.ang * Math.PI / 180, tan = Math.tan(rad), cos = Math.cos(rad);
  const barra = (g, a, b, ancho, alto, arriba, mat) => out.push({ g, tipo: "barra", a, b, ancho, alto, arriba, mat });
  const anillo = (g, r1, r2, y1, y2, mat) => out.push({ g, tipo: "anillo", r1, r2, y1, y2, mat });
  const disco = (g, r, y1, y2, mat) => out.push({ g, tipo: "disco", r, y1, y2, mat });
  // Una malla: triángulos sueltos (x, y, z, x, y, z, …). La usan las capas y
  // las piezas que no son una caja ni un anillo entero.
  const malla = (g, mat, v) => { if (v.length) out.push({ g, tipo: "malla", mat, v }); };
  const TAU = 2 * Math.PI;
  const norm = (a) => ((a % TAU) + TAU) % TAU;
  const dentro = (a, [a0, a1]) => norm(a - a0) <= a1 - a0;
  const pol = (r, th, y) => [r * Math.cos(th), y, r * Math.sin(th)];
  const tri = (v, a, b, c) => v.push(a[0], a[1], a[2], b[0], b[1], b[2], c[0], c[1], c[2]);
  const quad = (v, a, b, c, d) => { tri(v, a, b, c); tri(v, a, c, d); };
  // Gira un perfil [[r, y], …] de a0 a a1 (un perfil cerrado da un sólido).
  const revolver = (v, perfil, a0 = 0, a1 = TAU) => {
    const n = Math.max(2, Math.ceil((a1 - a0) / TAU * 96));
    for (let i = 0; i < n; i++) {
      const t1 = a0 + (a1 - a0) * i / n, t2 = a0 + (a1 - a0) * (i + 1) / n;
      for (let j = 0; j + 1 < perfil.length; j++) {
        const [r1, y1] = perfil[j], [r2, y2] = perfil[j + 1];
        quad(v, pol(r1, t1, y1), pol(r1, t2, y1), pol(r2, t2, y2), pol(r2, t1, y2));
      }
    }
  };
  // La tapa de un perfil cerrado y convexo, en el ángulo th.
  const tapar = (v, perfil, th) => {
    const k = perfil.length, c = perfil.reduce((s, p) => [s[0] + p[0] / k, s[1] + p[1] / k], [0, 0]);
    for (let j = 0; j + 1 < k; j++) tri(v, pol(c[0], th, c[1]), pol(perfil[j][0], th, perfil[j][1]), pol(perfil[j + 1][0], th, perfil[j + 1][1]));
  };

  // ── los montantes y las aberturas (calc → montaje) ──
  const mon = C.mon || { aberturas: [], grupos: [], sueltos: [], montantes: [], dm: 0 };
  const aberturas = mon.aberturas.map(([a0, a1]) => [norm(a0), norm(a0) + (a1 - a0)]).sort((x, y) => x[0] - y[0]);
  // Los tramos de muro entre aberturas (con ninguna, el círculo entero).
  const tramosMuro = aberturas.length ? aberturas.map((ab, i) => {
    const sig = aberturas[(i + 1) % aberturas.length];
    return [ab[1], sig[0] + (i + 1 === aberturas.length ? TAU : 0)];
  }).filter(([a, b]) => b - a > 1e-6) : [[0, TAU]];

  // ── el plancher ──
  const yTir = P.tir_alt, yPiso = yTir + P.osb_sup;
  const yViga = -P.osb_inf;
  for (const v of (C.vigas || [])) for (const sx of (v.n === 1 ? [0] : [-1, 1])) {
    const x = sx * v.x;
    barra("vigas", v3(x, yViga - P.viga_alt / 2, -v.L / 2), v3(x, yViga - P.viga_alt / 2, v.L / 2), P.viga_anc, P.viga_alt, [0, 1, 0], "madera2");
    const z0 = -v.L / 2 + (v.pilares > 1 ? P.pil_borde : v.L / 2);
    for (let i = 0; i < v.pilares; i++) {
      const z = z0 + i * v.largo;
      barra("pilares", v3(x, yViga - P.viga_alt - 0.6, z), v3(x, yViga - P.viga_alt, z), 0.14, 0.14, [1, 0, 0], "pilar");
    }
  }
  disco("osb_inf", C.R, -P.osb_inf, 0, "osb");
  for (const t of (C.tirantes || [])) for (const sz of (t.n === 1 ? [0] : [-1, 1]))
    barra("tirantes", v3(-t.L / 2, yTir / 2, sz * t.x), v3(t.L / 2, yTir / 2, sz * t.x), P.tir_anc, P.tir_alt, [0, 1, 0], "madera");
  anillo("anillo_piso", C.Rint, C.Rext, yTir - C.alto_an, yTir, "anillo");
  disco("osb_sup", C.R, yTir, yPiso, "osb");

  // ── el trei: dos familias de listones a 60°, sobre su radio medio ──
  const yt = yPiso + P.alto;                     // cabeza del trei
  const yA0 = yt - P.e_mad, yA = yA0 + C.alto_an;  // el anillo periférico: el trei cubre su primera capa
  const umb = P.umb_esp || 0;
  // Arriba de la abertura: hasta el anillo, o un dintel si la abertura es más baja.
  const yAbre = Math.min(yPiso + umb + (P.alt_ab || 0), yA0);
  const conDintel = yAbre < yA0 - 0.01;
  const yLibre = conDintel ? Math.min(yA0, yAbre + (P.esp_mon || 0)) : yA0;
  const rT = C.r_trei - P.e_trei;
  const mitadMon = (P.esp_mon || 0) / 2 / rT + P.anc_trei / 2 / rT;   // lo que el montante le corta al trei
  const span = P.alto / Math.tan(Math.PI / 3);    // avance horizontal de un listón
  const n = C.n_pts, tramos = 8;
  for (const fam of [-1, 1]) for (let i = 0; i < n; i++) {
    const th0 = 2 * Math.PI * i / n, dth = fam * span / rT;
    for (let k = 0; k < tramos; k++) {
      const f1 = k / tramos, f2 = (k + 1) / tramos;
      const r = rT + fam * P.e_trei / 2;
      const p = (f) => v3(r * Math.cos(th0 + f * dth), yPiso + f * P.alto, r * Math.sin(th0 + f * dth));
      const m = (th0 + (f1 + f2) / 2 * dth), ym = yPiso + (f1 + f2) / 2 * P.alto;
      // El trei se corta en los montantes y en las aberturas (debajo del dintel).
      if (mon.montantes.some(a => dentro(m, [a - mitadMon, a + mitadMon]))) continue;
      if (ym < yLibre && aberturas.some(ab => dentro(m, ab))) continue;
      barra("trei", p(f1), p(f2), P.anc_trei, P.e_trei, [Math.cos(m), 0, Math.sin(m)], "trei");
    }
  }
  // Los zócalos, cortados en las aberturas (abajo los reemplaza el piso de la abertura).
  {
    const v = [], z1 = C.r_trei_int - P.e_int, z2 = C.r_trei_int;
    for (const [ya, yb] of [[yPiso, yPiso + P.anc_int], [yt - P.anc_int, yt]]) {
      const pf = [[z1, ya], [z2, ya], [z2, yb], [z1, yb], [z1, ya]];
      const tramos = (ya < yLibre) ? tramosMuro : [[0, TAU]];
      for (const [a, b] of tramos) { revolver(v, pf, a, b); if (b - a < TAU - 1e-6) { tapar(v, pf, a); tapar(v, pf, b); } }
    }
    malla("zocalos", "madera", v);
  }
  anillo("anillo", C.Rint, C.Rext, yA0, yA, "anillo");

  // ── los montantes: del borde del plancher a la cara interior del trei, del
  //    piso (o del piso de la abertura) hasta debajo del anillo ──
  {
    const rm = (C.R + C.r_trei_int) / 2, anchoR = C.R - C.r_trei_int;
    const deAbertura = new Set(mon.grupos.flatMap(g => g.montantes));
    for (const a of mon.montantes) {
      const y0 = deAbertura.has(a) ? yPiso + umb : yPiso;
      barra("montantes", pol(rm, a, y0), pol(rm, a, yA0), P.esp_mon, anchoR, [Math.cos(a), 0, Math.sin(a)], "montante");
    }
    if (conDintel) for (const [a0, a1] of aberturas) {
      const yd = yAbre + P.esp_mon / 2, am = (a0 + a1) / 2;
      barra("montantes", pol(rm, a0, yd), pol(rm, a1, yd), anchoR, P.esp_mon, [0, 1, 0], "montante");
      void am;
    }
    // El piso de la abertura: UNA pieza por grupo, sobre la que se paran los
    // montantes, del zócalo hasta pasar el borde, con caída hacia afuera y la
    // punta redondeada para que gotee lejos del muro.
    const rIn = C.r_int_lito, rOut = C.R + (P.umb_vuelo || 0);
    const yIn = yPiso + umb, yOut = yIn - (P.umb_caida || 0);
    const rho = Math.max(0.002, (yOut - yPiso) / 2), cx = rOut - rho, cy = yPiso + rho;
    const pf = [[rIn, yPiso], [cx, yPiso]];
    for (let i = 1; i < 8; i++) { const f = -Math.PI / 2 + Math.PI * i / 8; pf.push([cx + rho * Math.cos(f), cy + rho * Math.sin(f)]); }
    pf.push([cx, yOut], [rIn, yIn], [rIn, yPiso]);
    const v = [];
    for (const g of mon.grupos) {
      const a = g.montantes[0] - mon.dm / 2, b = g.montantes[g.montantes.length - 1] + mon.dm / 2;
      revolver(v, pf, a, b); tapar(v, pf, a); tapar(v, pf, b);
    }
    malla("suelo_ab", "umbral", v);
  }

  // ── la cal (un calce por percha) y la doble cinta ──
  const rCinta = C.R - C.c;
  for (let i = 0; i < P.n_per_r; i++) {
    const th = 2 * Math.PI * i / P.n_per_r;
    out.push({ g: "cal", tipo: "calce", th, ancho: P.p_alt, mat: "cal",
      perfil: [[C.Rint, yA], [rCinta, yA], [rCinta, yA + C.tri_tr], [C.Rint, yA + C.h0]] });
  }
  anillo("cinta", rCinta, C.R, yA + C.cinta_max - P.anc_per, yA + C.cinta_max, "cinta");

  // ── la primera capa: los triángulos, y la percha radial si hace falta ──
  const yB = yt + P.tri_anc / 2;                  // centro de la madera en la base
  const beta = C.beta * Math.PI / 180, delta = Math.PI / C.nt;
  const B = C.cuerda, M = C.mediana;
  const segs = arriostramiento(B, M);
  const esq = [];                                 // las tres puntas de cada triángulo (para las capas)
  for (let k = 0; k < C.nt; k++) {
    const th = 2 * Math.PI * k / C.nt;
    const A = rotY(v3(C.Rint * Math.cos(beta), yB, C.Rint * Math.sin(beta)), th);
    const Bp = rotY(v3(C.Rint * Math.cos(beta), yB, -C.Rint * Math.sin(beta)), th);
    const Cv = rotY(v3(P.r_toono, yB + C.h_vert, 0), th);
    const mid = mul(addv(A, Bp), 0.5);
    const u = nor(sub(Bp, A)), w = nor(sub(Cv, mid));
    const nrm = nor(cross(w, u));
    const pt = (s, t) => addv(mid, addv(mul(u, s), mul(w, t)));
    for (const s of segs) barra("triangulos", pt(s.s1, s.t1), pt(s.s2, s.t2), P.tri_esp, P.tri_anc, nrm, "triangulo");
    esq.push({ A, Bp, Cv });
    if (C.con_radial) {
      const a = th + delta, yv = yB + (C.Rint - P.r_toono) * tan;
      const p1 = v3(C.Rint * Math.cos(a), yB, -C.Rint * Math.sin(a));
      const p2 = v3(P.r_toono * Math.cos(a), yv, -P.r_toono * Math.sin(a));
      const arriba = [Math.sin(rad) * Math.cos(a), Math.cos(rad), -Math.sin(rad) * Math.sin(a)];
      barra("radiales", p1, p2, P.tri_esp, P.tri_anc, arriba, "radial");
    }
  }

  // ── el toono: anillo de sujeción, coronas de relleno, anillo superior ──
  const yC = yB + C.h_vert;
  const ySuj1 = yC - P.tri_anc / 2, ySuj0 = ySuj1 - 0.02;
  const yPerchaToono = yA + C.h0 + (C.Rint - P.r_toono) * tan;  // cara de abajo de la percha
  const ySup1 = yPerchaToono + 0.02, ySup0 = ySup1 - 0.05;
  anillo("toono", P.r_toono - 0.03, P.r_toono + 0.02, ySuj0, ySuj1, "toono");
  const relleno = Math.max(0, ySup0 - ySuj1);
  const nCor = Math.max(1, Math.round(relleno / P.e_mad));
  for (let i = 0; i < nCor; i++)
    anillo("toono", P.r_toono - 0.03, P.r_toono, ySuj1 + i * relleno / nCor, ySuj1 + (i + 1) * relleno / nCor, i % 2 ? "toono" : "toono2");
  anillo("toono", P.r_toono - 0.05, P.r_toono, ySup0, ySup1, "toono");

  // ── la segunda capa: las perchas, de la cal al toono y con su desborde ──
  const rIn = P.r_toono - 0.02, rOut = C.Rp;
  const yAbajo = (r) => yA + C.h0 + (C.Rint - r) * tan;
  for (let i = 0; i < P.n_per_r; i++) {
    const th = 2 * Math.PI * i / P.n_per_r;
    const d = [Math.cos(th), 0, Math.sin(th)];
    const off = P.p_anc / 2 / cos;
    const p1 = v3(rIn * d[0], yAbajo(rIn) + off, rIn * d[2]);
    const p2 = v3(rOut * d[0], yAbajo(rOut) + off, rOut * d[2]);
    const arriba = nor([Math.sin(rad) * d[0], Math.cos(rad), Math.sin(rad) * d[2]]);
    barra("perchas", p1, p2, P.p_alt, P.p_anc, arriba, "percha");
  }

  // ── la cinta del alero: dos capas en la punta de las perchas, al ras de su
  //    canto de arriba (como la doble cinta del muro). Remata el borde del alero
  //    y la lona pasa por encima. ──
  const yTopP = (r) => yAbajo(r) + P.p_anc / cos;          // canto de arriba de la percha
  const yAl = yTopP(rOut);
  anillo("cinta_alero", rOut, rOut + P.e_per, yAl - P.anc_per, yAl, "cinta");
  anillo("cinta_alero", rOut + P.e_per, rOut + C.c, yAl - P.anc_per, yAl, "cinta");

  // ── LAS CAPAS ─────────────────────────────────────────────────────────
  // Techo, primera mitad: algodón y freno de vapor apoyados SOBRE los
  // triángulos. Siguen la cara de arriba de los triángulos y, en los canales,
  // el plano entre dos triángulos vecinos (la percha radial queda debajo):
  // es la cáscara convexa de la base y el toono, levantada. En el borde bajan
  // hasta el canto interior del anillo.
  const dzTri = P.tri_anc / 2 / Math.cos((C.dip || P.ang) * Math.PI / 180) + 0.012;
  const sube = (p, dz) => [p[0], p[1] + dz, p[2]];
  const nt = esq.length;
  const cascara = (v, dz) => {
    for (let k = 0; k < nt; k++) {
      const e = esq[k], f = esq[(k + 1) % nt];
      tri(v, sube(e.A, dz), sube(e.Bp, dz), sube(e.Cv, dz));
      quad(v, sube(e.Bp, dz), sube(f.A, dz), sube(f.Cv, dz), sube(e.Cv, dz));
    }
  };
  // De un borde de la cáscara (cuerdas) a un círculo de radio r y altura y.
  const ang = (p) => Math.atan2(p[2], p[0]);
  const faldon = (v, bordes, dz, r, y) => {
    for (const [p, q] of bordes) {
      const a = ang(p); let d = ang(q) - a; d = Math.atan2(Math.sin(d), Math.cos(d));
      const n = 6;
      for (let i = 0; i < n; i++) {
        const c1 = sube(p.map((x, j) => x + (q[j] - x) * i / n), dz), c2 = sube(p.map((x, j) => x + (q[j] - x) * (i + 1) / n), dz);
        quad(v, c1, c2, pol(r, a + d * (i + 1) / n, y), pol(r, a + d * i / n, y));
      }
    }
  };
  const bordeBase = esq.flatMap((e, k) => [[e.A, e.Bp], [e.Bp, esq[(k + 1) % nt].A]]);
  const bordeToono = esq.map((e, k) => [e.Cv, esq[(k + 1) % nt].Cv]);
  if (nt) {
    for (const [g, mat, dz] of [["algodon_techo", "algodon", dzTri], ["freno_techo", "freno", dzTri + 0.006]]) {
      const v = []; cascara(v, dz); faldon(v, bordeBase, dz, C.Rint, yA + 0.002); malla(g, mat, v);
    }
  }
  // La aislación del techo: de la cáscara al Tyvek, del toono a la cinta.
  const yTy = (r) => yAbajo(r) - 0.002;                    // el Tyvek, debajo de las perchas
  {
    const v = [], dz = dzTri + 0.010, rC = C.R - C.c, yI = (r) => yTy(r) - 0.003;
    if (nt) { cascara(v, dz); faldon(v, bordeBase, dz, C.Rint, yA + 0.004); faldon(v, bordeToono, dz, P.r_toono, yI(P.r_toono)); }
    // Llena TODO (Mauro, 2-nov: «el aislante debe llenar todos los espacios»):
    // sobre el anillo, entre calces, hasta el borde y debajo de la doble cinta.
    const yCb = yA + C.cinta_max - P.anc_per - 0.002;
    revolver(v, [[C.Rint, yA + 0.004], [C.R - 0.002, yA + 0.004], [C.R - 0.002, yCb], [rC, yCb], [rC, yI(rC)], [P.r_toono, yI(P.r_toono)]]);
    malla("aislacion_techo", "aislacion", v);
  }
  // El Tyvek: cierra el primer techo. Del toono al borde, pasando sobre la
  // cal (las perchas se atornillan encima, en sándwich), y baja por la cinta
  // del borde, donde se fija y se sella sobre la lona del muro.
  {
    const v = [];
    revolver(v, [[P.r_toono, yTy(P.r_toono)], [C.R, yTy(C.R)], [C.R + 0.006, yTy(C.R)], [C.R + 0.006, yTy(C.R) - P.anc_per - 0.03]]);
    malla("tyvek", "tyvek", v);
  }
  // La lona del techo: sobre las perchas, del toono hasta pasar la cinta del
  // alero; baja y el urlete con el cordón la cierra por debajo del alero.
  const yLona = (r) => yTopP(r) + 0.003;
  {
    const v = [], r1 = Math.max(0.05, P.r_toono - 0.05), rC = rOut + C.c + 0.003;
    const baja = Math.max(P.anc_per + 0.01, P.lona_baja || 0.1);
    revolver(v, [[r1, yLona(r1)], [rOut, yLona(rOut)], [rC, yAl + 0.003], [rC, yAl + 0.003 - baja], [rC - 0.04, yAl + 0.003 - baja]]);
    malla("lona_techo", "lona", v);
    // El cierre: la banda con las anillas baja sobre la línea de una percha, y
    // el cordón la cose en zigzag con las del borde de la lona.
    const th = 2 * Math.PI * Math.round(P.n_per_r / 8) / P.n_per_r;
    const arriba = nor([Math.sin(rad) * Math.cos(th), Math.cos(rad), Math.sin(rad) * Math.sin(th)]);
    barra("lona_techo", sube(pol(r1, th, yLona(r1)), 0.004), sube(pol(rOut, th, yLona(rOut)), 0.004), 0.08, 0.004, arriba, "lona2");
    const pasos = Math.max(2, Math.round((rOut - r1) / cos / 0.25));
    const lado = (i) => (i % 2 ? 1 : -1) * 0.035;
    for (let i = 0; i < pasos; i++) {
      const ra = r1 + (rOut - r1) * i / pasos, rb = r1 + (rOut - r1) * (i + 1) / pasos;
      const pa = pol(ra, th + lado(i) / ra, yLona(ra) + 0.008), pb = pol(rb, th + lado(i + 1) / rb, yLona(rb) + 0.008);
      barra("lona_techo", pa, pb, 0.006, 0.006, arriba, "cordon");
    }
  }
  // ── EL TOONO, arriba (3d-6, Mauro, 2-nov): el anillo de sujeción de las
  //    perchas termina en las CÁMARAS de ventilación: entre percha y percha,
  //    afuera de un DIENTE cerrado hacia adentro que sube hasta la lona y marca
  //    su límite. Trenzada la lona, se le hacen los orificios sobre las cámaras
  //    y se sella con el ANILLO TAPA, hermanado con las cámaras del toono: hace
  //    los huecos al exterior de la lona con el canal mirando hacia abajo.
  //    Encima, la pieza de cierre: una fracción de DOMO GEODÉSICO. ──
  const rD = P.r_toono - 0.05, eD = P.diente ?? 0.015;
  anillo("toono", rD, rD + eD, ySup1, yLona(rD) - 0.003, "toono2");
  {
    const yT0 = yLona(rD) + 0.003, yT1 = yT0 + (P.tapa_cam ?? 0.03), rT1 = P.r_toono + (P.tapa_vuelo ?? 0.05);
    anillo("tapa", rD, rD + eD, yT0, yT1, "tapa");                      // cerrado hacia adentro
    anillo("tapa", rD, rT1, yT1, yT1 + 0.02, "tapa");                   // la tapa
    // El faldón NO toca la lona: deja una ranura por donde sale el aire, hacia abajo.
    anillo("tapa", rT1 - 0.012, rT1, yLona(rT1) + (P.tapa_ranura ?? 0.03), yT1, "tapa");
    for (let i = 0; i < P.n_per_r; i++) {                               // los tabiques, sobre las perchas
      const th = 2 * Math.PI * i / P.n_per_r, r1 = rD + eD, r2 = rT1 - 0.012;
      barra("tapa", pol(r1, th, (yLona(r1) + yT1) / 2), pol(r2, th, (yLona(r2) + yT1) / 2 + 0), P.p_alt, 0.001 + yT1 - yLona(r1), [0, 1, 0], "tapa");
    }
    // El domo: un casquete de esfera geodésica sobre la tapa, hasta el borde
    // EXTERIOR del anillo tapa (3d-7, Mauro: «al borde exterior del anillo que
    // va a cerrar la cámara»), y bajo: un tercio de la circunferencia, la parte
    // de arriba, la de menos pendiente (dom_ang 60 = un arco de 120°).
    const phi = Math.min(Math.PI / 2, Math.max(0.2, (P.dom_ang ?? 60) * Math.PI / 180));
    const Rd = rT1 / Math.sin(phi), yc = yT1 + 0.02 + 0.03 - Rd * Math.cos(phi);
    anillo("domo", rT1 - 0.04, rT1, yT1 + 0.02, yT1 + 0.05, "domo");
    const { aristas, caras } = geodesica(Math.max(1, Math.min(6, Math.round(P.dom_frec ?? 3))));
    const cosC = Math.cos(phi), dentroC = (p) => p[1] >= cosC - 1e-9;
    const aMundo = (p) => [p[0] * Rd, yc + p[1] * Rd, p[2] * Rd];
    for (let [a, b] of aristas) {
      if (!dentroC(a) && !dentroC(b)) continue;
      if (!dentroC(a)) [a, b] = [b, a];
      if (!dentroC(b)) { const t = (a[1] - cosC) / (a[1] - b[1]); b = a.map((x, j) => x + (b[j] - x) * t); }
      const m = a.map((x, j) => (x + b[j]) / 2);
      barra("domo", aMundo(a), aMundo(b), 0.03, 0.04, m, "domo");
    }
    const vd = [];
    for (const [a, b, c] of caras) if (dentroC(a) && dentroC(b) && dentroC(c)) tri(vd, aMundo(a), aMundo(b), aMundo(c));
    malla("domo", "vidrio", vd);
  }

  // El muro: del trei hacia afuera, cortado en las aberturas (arriba de una
  // abertura más baja que el anillo, las capas siguen).
  const capaMuro = (g, mat, perfil, y0, y1, cerrado) => {
    const v = [];
    const f = (ya, yb) => perfil(ya, yb);
    const tramos = [...tramosMuro.map(t => [t, y0, y1])];
    if (aberturas.length && y1 > yLibre + 0.001) for (const ab of aberturas) tramos.push([ab, Math.max(y0, yLibre), y1]);
    for (const [[a, b], ya, yb] of tramos) {
      const pf = f(ya, yb); revolver(v, pf, a, b);
      if (cerrado && b - a < TAU - 1e-6) { tapar(v, pf, a); tapar(v, pf, b); }
    }
    malla(g, mat, v);
  };
  const rM = C.r_trei;
  capaMuro("algodon_muro", "algodon", (a, b) => [[rM + 0.003, a], [rM + 0.003, b]], yPiso, yA0);
  capaMuro("freno_muro", "freno", (a, b) => [[rM + 0.006, a], [rM + 0.006, b]], yPiso, yA0);
  // La aislación del muro sube también al costado del anillo, hasta su cara de arriba.
  capaMuro("aislacion_muro", "aislacion", (a, b) => b >= yA0 - 1e-9
    ? [[rM + 0.009, a], [C.R - 0.002, a], [C.R - 0.002, yA], [C.Rext + 0.002, yA], [C.Rext + 0.002, b], [rM + 0.009, b], [rM + 0.009, a]]
    : [[rM + 0.009, a], [C.R - 0.002, a], [C.R - 0.002, b], [rM + 0.009, b], [rM + 0.009, a]], yPiso, yA0, true);
  capaMuro("lona_muro", "lona_muro", (a, b) => [[C.R + 0.003, a], [C.R + 0.003, b]], -P.osb_inf - 0.02, yA + C.cinta_max);

  return { piezas: out, alto: yPerchaToono + 0.1, suelo: yViga - P.viga_alt - 0.6, yt, yA, yC, nCor, relleno, yAbre, conDintel };
}

const COLORES = {
  madera: 0xd9b27c, madera2: 0xc49a62, pilar: 0x8a6a4a, osb: 0xd8bf8a, anillo: 0xc8874a,
  trei: 0xe0b98a, cal: 0xb98a4f, cinta: 0x6fa8dc, triangulo: 0xe2a95c, radial: 0xb5481c,
  toono: 0xa86a3a, toono2: 0xc08050, percha: 0x9c6b3c,
  montante: 0xb07a44, umbral: 0x8f5a2e, tapa: 0x7a4a2a, domo: 0xeadfcf, vidrio: 0xbfe3f2,
  algodon: 0xf1e9d8, freno: 0x7f9fb8, aislacion: 0xf0cf73, tyvek: 0xf6f6f2,
  lona: 0x5f6b5a, lona2: 0x4b5547, cordon: 0x1e1e1e, lona_muro: 0x8f8a72,
};
// Las membranas finas se ven a través: el freno y el Tyvek dejan ver lo de abajo.
const OPACIDAD = { osb: 0.55, freno: 0.6, tyvek: 0.75, vidrio: 0.3 };

// El dibujo. Devuelve { actualizar, ver, resaltar, encuadrar, destruir } o
// tira si three.js no bajó: quien llama lo ataja y lo dice en la página.
export async function montar(caja, P, C, visibles) {
  const THREE = await import(THREE_URL);
  const { OrbitControls } = await import(ORBIT_URL);
  const ancho = () => Math.max(260, caja.clientWidth);
  const alto = () => Math.max(220, caja.clientHeight || Math.round(ancho() * 0.75));
  const ren = new THREE.WebGLRenderer({ antialias: true });
  ren.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  ren.setSize(ancho(), alto());
  caja.innerHTML = ""; caja.appendChild(ren.domElement);
  const esc = new THREE.Scene();
  esc.background = new THREE.Color(0x1d1a17);
  const cam = new THREE.PerspectiveCamera(40, ancho() / alto(), 0.05, 200);
  esc.add(new THREE.HemisphereLight(0xfff4e0, 0x3a3028, 1.1));
  const sol = new THREE.DirectionalLight(0xffffff, 1.4); sol.position.set(6, 10, 4); esc.add(sol);
  const ctl = new OrbitControls(cam, ren.domElement);
  ctl.enableDamping = true;
  // Un material por parte y por color: resaltar una parte no puede tocar a otra.
  const mats = {};
  const opacidadBase = (k) => OPACIDAD[k] || 1;
  const mat = (parte, k) => mats[parte + "|" + k] || (mats[parte + "|" + k] =
    Object.assign(new THREE.MeshLambertMaterial({ color: COLORES[k] || 0xcccccc,
      transparent: opacidadBase(k) < 1, opacity: opacidadBase(k), side: THREE.DoubleSide }), { userData: { k, parte } }));
  let grupos = {}, rejilla = null, resaltadas = [];
  const caja1 = new THREE.BoxGeometry(1, 1, 1);

  function aplicarResalte() {
    const hay = resaltadas.length > 0;
    for (const m of Object.values(mats)) {
      const { k, parte } = m.userData, si = resaltadas.includes(parte);
      m.transparent = (hay && !si) || opacidadBase(k) < 1;
      m.opacity = hay && !si ? 0.1 : opacidadBase(k);
      m.depthWrite = !(hay && !si);
      m.emissive.setHex(hay && si ? 0x3a2408 : 0x000000);
      m.needsUpdate = true;
    }
  }

  function construir(P, C) {
    for (const g of Object.values(grupos)) { esc.remove(g); g.traverse(o => { if (o.geometry && o.geometry !== caja1) o.geometry.dispose(); }); }
    grupos = {};
    const { piezas, alto: H, suelo } = piezas3d(P, C);
    const porParteMat = {};
    for (const p of piezas) {
      const g = grupos[p.g] || (grupos[p.g] = new THREE.Group());
      if (p.tipo === "barra") { (porParteMat[p.g + "|" + p.mat] ||= []).push(p); continue; }
      let geo;
      if (p.tipo === "anillo" || p.tipo === "disco") {
        const sh = new THREE.Shape(); sh.absarc(0, 0, p.tipo === "disco" ? p.r : p.r2, 0, Math.PI * 2, false);
        if (p.tipo === "anillo") { const h = new THREE.Path(); h.absarc(0, 0, p.r1, 0, Math.PI * 2, true); sh.holes.push(h); }
        geo = new THREE.ExtrudeGeometry(sh, { depth: p.y2 - p.y1, bevelEnabled: false, curveSegments: 96 });
        geo.rotateX(-Math.PI / 2); geo.translate(0, p.y1, 0);
      } else if (p.tipo === "malla") {
        geo = new THREE.BufferGeometry();
        geo.setAttribute("position", new THREE.Float32BufferAttribute(p.v, 3));
        geo.computeVertexNormals();
      } else if (p.tipo === "calce") {
        const sh = new THREE.Shape(p.perfil.map(([r, y]) => new THREE.Vector2(r, y)));
        geo = new THREE.ExtrudeGeometry(sh, { depth: p.ancho, bevelEnabled: false });
        geo.translate(0, 0, -p.ancho / 2); geo.rotateY(-p.th);
      }
      if (geo) g.add(new THREE.Mesh(geo, mat(p.g, p.mat)));
    }
    // Las barras van en InstancedMesh (el trei solo son más de mil piezas),
    // cada una con su sección real: largo × alto × ancho en metros.
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Matrix4();
    for (const [clave, lista] of Object.entries(porParteMat)) {
      const [g, mk] = clave.split("|");
      const im = new THREE.InstancedMesh(caja1, mat(g, mk), lista.length);
      lista.forEach((p, i) => {
        const a = new THREE.Vector3(...p.a), b = new THREE.Vector3(...p.b);
        const x = b.clone().sub(a); const L = x.length(); x.normalize();
        const y = new THREE.Vector3(...p.arriba); y.sub(x.clone().multiplyScalar(y.dot(x))).normalize();
        const z = new THREE.Vector3().crossVectors(x, y);
        e.makeBasis(x, y, z); q.setFromRotationMatrix(e);
        m4.compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(L, p.alto, p.ancho));
        im.setMatrixAt(i, m4);
      });
      grupos[g].add(im);
    }
    for (const [k, g] of Object.entries(grupos)) { g.visible = visibles[k] !== false; esc.add(g); }
    // La cuadrícula de 1 m, en el suelo: la escala a la vista.
    if (rejilla) { esc.remove(rejilla); rejilla.geometry.dispose(); }
    const lado = 2 * Math.ceil((C.Rp || C.R || 4) + 1);
    rejilla = new THREE.GridHelper(lado, lado, 0x6a5a48, 0x3a3229);
    rejilla.position.y = suelo; esc.add(rejilla);
    aplicarResalte();
    return { H, suelo };
  }

  let medida = construir(P, C);
  const encuadrar = () => {
    const R = C.Rp || 4, H = medida.H;
    cam.position.set(R * 1.9, H * 1.3 + 1, R * 1.9);
    ctl.target.set(0, (H + medida.suelo) * 0.45, 0); ctl.update();
  };
  encuadrar();
  let vivo = true, pide = true;
  ctl.addEventListener("change", () => { pide = true; });
  (function loop() {
    if (!vivo) return;
    requestAnimationFrame(loop);
    if (ctl.update() || pide) { ren.render(esc, cam); pide = false; }
  })();
  const ro = new ResizeObserver(() => {
    ren.setSize(ancho(), alto()); cam.aspect = ancho() / alto(); cam.updateProjectionMatrix(); pide = true;
  });
  ro.observe(caja);
  return {
    actualizar(P2, C2) { C = C2; medida = construir(P2, C2); pide = true; },
    ver(k, on) { visibles[k] = on; if (grupos[k]) grupos[k].visible = on; pide = true; },
    resaltar(partes) { resaltadas = partes || []; aplicarResalte(); pide = true; },
    encuadrar() { encuadrar(); pide = true; },
    mirar(desde, hacia) { cam.position.set(...desde); ctl.target.set(...hacia); ctl.update(); pide = true; },
    destruir() { vivo = false; ro.disconnect(); ren.dispose(); },
  };
}

// calculo-geo.js — la geometría de la yurta, sin navegador y sin Firebase.
// Sello: geo-4 (2-nov-2026): la lona plana es el círculo entero (la lengüeta
// lleva todo el sobrante). geo-3: los montantes y las aberturas en el
// perímetro, y la lona del techo cortada plana. geo-2 (1-nov-2026): la percha radial.
//
// Sale de calculo.html para que el banco (`node pruebas-calculo.mjs`) pueda
// correr las mismas cuentas que la página, sin DOM. La página la importa y
// sólo pinta. La autoridad de las reglas es el manual técnico del plancher
// («CasaYourte · Manual técnico · 1. El plancher», versión Christine, lo que
// Mauro dijo el 1-nov-2026); acá están en código.
//
// LA CADENA DE RADIOS, del borde hacia adentro:
//   D/2  borde del piso = borde exterior de la doble cinta (la lona baja a plomo)
//   A    espacio del aislante del muro, comprimido = ais_nom × rel. Lo llenan la
//        cal y la doble cinta: la cinta va ADENTRO de A.
//   rt   cara exterior del trei = D/2 − A = radio interior del anillo
//   E    ancho del anillo (de rt a rt + E), dos capas coladas de e_mad
//   c    doble cinta = 2 × e_per; la cal va de rt a D/2 − c
//   T    separación del anillo al trei: 0 en la versión de Christine (el trei
//        apoya contra el anillo); los casos viejos la traen.
//
// TODO lo que se elige por diseño es un campo de la página: si cambia una
// medida, cambian los números y el dibujo.

export const SELLO_GEO = "geo-4";

// El tirante, la viga: cuerdas paralelas del círculo de radio R, con una en el
// centro y cada `paso` a los dos lados. Devuelve [{x, L, n}] con n = 1 para la
// central y 2 para las demás (una a cada lado).
export function cuerdas(R, paso) {
  const out = [];
  if (!(R > 0) || !(paso > 0)) return out;
  for (let i = 0; i * paso < R - 1e-9; i++) {
    const x = i * paso;
    out.push({ x, L: 2 * Math.sqrt(R * R - x * x), n: i === 0 ? 1 : 2 });
  }
  return out;
}

// Los pilares de una viga de largo L: el primero y el último entran `borde`
// desde cada punta, y entre esos dos el resto se divide en la menor cantidad de
// tramos iguales que no pase de `max`. Una viga más corta que dos bordes lleva
// un pilar, en el medio.
export function pilares(L, borde, max) {
  const interior = L - 2 * borde;
  if (!(interior > 1e-9) || !(max > 0)) return { tramos: 0, largo: 0, pilares: 1 };
  const tramos = Math.max(1, Math.ceil(interior / max - 1e-9));
  return { tramos, largo: interior / tramos, pilares: tramos + 1 };
}

// LOS MONTANTES Y LAS ABERTURAS, en el perímetro (geo-3, Mauro, 2-nov-2026:
// «uno cada 3 m de perímetro si no hay aberturas; si hay, son parte de las
// aberturas»). Las aberturas van en `n_gr` grupos repartidos parejo, y en un
// grupo dos aberturas seguidas comparten el montante del medio: un grupo de k
// aberturas lleva k + 1 montantes. El ancho libre se mide en la cara interior
// del trei (por donde se pasa). En el arco libre entre dos grupos van los
// montantes sueltos que hagan falta para que ninguno quede a más de `sep_mon`.
// Ángulos en radianes, con el punto en (r cos θ, r sen θ); el primer grupo,
// centrado en θ = 0.
export function montaje(P, R, rIn) {
  const da = (P.anc_ab || 0) / rIn, dm = (P.esp_mon || 0) / rIn;
  const nab = Math.max(0, Math.round(P.n_ab || 0));
  const ngr = nab ? Math.max(1, Math.min(nab, Math.round(P.n_gr || 1))) : 0;
  const grupos = [];
  for (let g = 0; g < ngr; g++) {
    const k = Math.floor(nab / ngr) + (g < nab % ngr ? 1 : 0);
    const c = 2 * Math.PI * g / ngr, paso = da + dm, ini = c - k * paso / 2;
    const montantes = [], aberturas = [];
    for (let i = 0; i <= k; i++) montantes.push(ini + i * paso);
    for (let i = 0; i < k; i++) aberturas.push([ini + i * paso + dm / 2, ini + (i + 1) * paso - dm / 2]);
    grupos.push({ k, c, montantes, aberturas });
  }
  const sueltos = [];
  const sep = P.sep_mon > 0 ? P.sep_mon : Infinity;
  if (!ngr) {
    const n = Math.max(3, Math.ceil(2 * Math.PI * R / sep - 1e-9));
    for (let i = 0; i < n; i++) sueltos.push(2 * Math.PI * i / n);
  } else for (let g = 0; g < ngr; g++) {
    const a = grupos[g].montantes[grupos[g].montantes.length - 1];
    const b = grupos[(g + 1) % ngr].montantes[0] + (g + 1 === ngr ? 2 * Math.PI : 0);
    const n = Math.max(0, Math.ceil((b - a) * R / sep - 1e-9) - 1);
    for (let j = 1; j <= n; j++) sueltos.push(a + (b - a) * j / (n + 1));
  }
  const de_ab = grupos.reduce((s, g) => s + g.k + 1, 0);
  return { grupos, sueltos, de_ab, n_mon: de_ab + sueltos.length, dm,
    aberturas: grupos.flatMap(g => g.aberturas), montantes: grupos.flatMap(g => g.montantes).concat(sueltos),
    max_sep: (() => { const t = grupos.flatMap(g => g.montantes).concat(sueltos).map(x => ((x % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)).sort((x, y) => x - y);
      let m = 0; for (let i = 0; i < t.length; i++) m = Math.max(m, ((i + 1 < t.length ? t[i + 1] : t[0] + 2 * Math.PI) - t[i]) * R); return m; })() };
}

export function calc(P) {
  const rad = P.ang * Math.PI / 180;
  const cos = Math.cos(rad), sen = Math.sin(rad), tan = Math.tan(rad);
  const R = P.D / 2;
  const A = P.ais_nom * P.rel;            // espacio del aislante del muro
  const H = P.ais_techo * P.rel;          // ⊥ a la pendiente del techo
  const c = 2 * P.e_per;                  // doble cinta
  const Rint = R - A, Rext = Rint + P.E;  // el anillo
  const r_trei = Rint - P.T, r_trei_int = r_trei - 2 * P.e_trei;
  const r_int_lito = r_trei_int - P.e_int;      // el zócalo interior
  // La cal: alto contra el trei (a plomo) y en la punta truncada, que está a
  // A − c del trei. Encima apoya la percha; la cinta va arriba, en la parte de
  // arriba de la cal, debajo de la percha.
  const h0 = H / cos;
  const tri_ap = h0;
  const tri_tr = h0 - (A - c) * tan;
  const cinta_max = h0 - A * tan;               // percha en el borde exterior
  const barrido = c * tan;
  const per_med = 2 * Math.PI * (Rint + P.E / 2);
  const alto_an = P.e_mad * P.n_cap;
  const r_trei_med = r_trei - P.e_trei;
  const alfa = 2 * Math.asin(Math.min(1, P.bul / (2 * r_trei_med)));
  const n_pts = Math.round(2 * Math.PI / alfa);  // puntos de abajo (y de arriba) del trei
  const Rp = R + P.desb;

  // ── PRIMERA capa · los triángulos (ver el comentario largo en la versión
  //    anterior de calculo.html: β = δ − asen((r toono / R int) · sen δ)).
  const nt = P.n_tri;
  const delta = Math.PI / nt;
  const beta = delta - Math.asin(Math.min(1, (P.r_toono / Rint) * Math.sin(delta)));
  const bx = Rint * Math.cos(beta), by = Rint * Math.sin(beta);
  const plan_lado = Math.hypot(bx - P.r_toono, by);
  const h_vert = plan_lado * tan;
  const lado_tri = plan_lado / cos;
  const sep_tri = 2 * P.r_toono * Math.sin(delta);
  const n_nec = Math.ceil(Math.PI / Math.asin(Math.min(1, P.sep_max / (2 * P.r_toono))));
  // Si el canal entre dos triángulos pasa del límite para el aislante, va una
  // percha radial en el medio (Mauro, 1-nov): el canal es simétrico respecto
  // del radio que pasa entre los dos, así que su línea media ES radial.
  const con_radial = sep_tri > P.sep_max;
  const largo_radial = (Rint - P.r_toono) / cos;
  const hueco_radial = (sep_tri - P.tri_esp) / 2;
  const sep_capas = H / cos;
  const slant = (Rp - P.r_toono) / cos;

  // ── EL PLANCHER en obra (versión Christine) ──
  const tirantes = cuerdas(R, P.paso_t);
  const n_tir = tirantes.reduce((s, t) => s + t.n, 0);
  const m_tir = tirantes.reduce((s, t) => s + t.n * t.L, 0);
  const vigas = cuerdas(R, P.paso_v).map(v => ({ ...v, ...pilares(v.L, P.pil_borde, P.pil_max) }));
  const n_vig = vigas.reduce((s, v) => s + v.n, 0);
  const m_vig = vigas.reduce((s, v) => s + v.n * v.L, 0);
  const n_pil = vigas.reduce((s, v) => s + v.n * v.pilares, 0);
  const area = Math.PI * R * R;
  const placa = P.placa_a * P.placa_l;
  const placas_capa = placa > 0 ? Math.ceil(area * P.desp / placa - 1e-9) : 0;
  const vol_anillo_piso = per_med * P.E * alto_an;
  const cel_bruto = area * P.tir_alt;
  const cel_neto = cel_bruto - m_tir * P.tir_alt * P.tir_anc - vol_anillo_piso;
  const alto_piso = P.osb_inf + P.tir_alt + P.osb_sup;
  const por_placa = P.paso_t > 0 ? P.placa_a / P.paso_t : 0;
  const placa_ok = Math.abs(por_placa - Math.round(por_placa)) < 0.01;
  const encastre = alto_an;                    // el anillo del piso, al ras del tirante
  const bajo_encastre = P.tir_alt - encastre;

  // ── EL TREI · herrajes y zócalos ──
  const zocalo = 2 * Math.PI * (r_trei_int - P.e_int / 2);
  const grip_cruce = 2 * P.e_trei;
  const grip_abajo = 2 * P.e_trei + P.e_int;   // la escuadra (< 2 mm) no se cuenta

  // ── LOS MONTANTES y las aberturas ──
  const mon = montaje(P, R, r_trei_int);

  // ── LA LONA DEL TECHO, cortada plana (Mauro, 2-nov-2026): un círculo con el
  //    agujero del toono, cortado en un radio y acordonado en zigzag como una
  //    zapatilla; la lengüeta que queda lleva todo el sobrante del cono. Cada
  //    punto del techo a r del centro queda, en la pieza plana, a r ÷ cos del
  //    centro; el cono cerrado ocupa 360° × cos, y la lengüeta se queda con
  //    TODO el resto del círculo (geo-4, Mauro: «deja el total del material para
  //    la lengüeta»): la pieza es el círculo entero, sin recorte. Pasa la cinta del alero (c) y baja `lona_baja` para el
  //    urlete con el cordón que la cierra debajo del alero y la tensa.
  const lona_r_ext = (Rp + c) / cos + (P.lona_baja || 0);
  const lona_r_int = Math.max(0, P.r_toono - 0.05) / cos;
  const lona_ang_cono = 360 * cos;
  const lona_ang = 360;
  const lona_area = Math.PI * (lona_r_ext ** 2 - lona_r_int ** 2);

  return { R, A, H, c, Rint, Rext, r_trei, r_trei_int, r_int_lito,
    h0, tri_base: A - c, tri_ap, tri_tr, cinta_max, barrido,
    tri_hip: Math.hypot(A - c, tri_ap - tri_tr),
    vuelo: R - Rext, per_med, alto_an, vol_an: per_med * P.E * alto_an,
    largo_parte: per_med / P.n_partes,
    alfa: alfa * 180 / Math.PI, n_lados: 2 * Math.PI / alfa, n_pts,
    largo_lito_trei: Math.hypot(P.alto, P.alto / Math.tan(Math.PI / 3)),
    n_lito_trei: n_pts * 2,
    vol_trei: n_pts * 2 * Math.hypot(P.alto, P.alto / Math.tan(Math.PI / 3)) * P.anc_trei * P.e_trei,
    Rp, p_largo: slant, paso_p: 2 * Math.PI * R / P.n_per_r,
    nt, beta: beta * 180 / Math.PI, delta: delta * 180 / Math.PI,
    r_med: bx, cuerda: 2 * Rint * Math.sin(beta), flecha: Rint - bx,
    h_vert, lado_tri, sep_tri, n_nec, sep_capas, con_radial, largo_radial, hueco_radial,
    mediana: Math.hypot(bx - P.r_toono, h_vert),
    dip: Math.atan(h_vert / (bx - P.r_toono)) * 180 / Math.PI,
    vol_tri: nt * (2 * lado_tri + 2 * Rint * Math.sin(beta)) * P.tri_anc * P.tri_esp,
    slant, area_techo: Math.PI * (Rp + P.r_toono) * slant,
    area_muro: 2 * Math.PI * R * P.alto,
    mon, n_mon: mon.n_mon, n_mon_ab: mon.de_ab, n_mon_sueltos: mon.sueltos.length, mon_max_sep: mon.max_sep,
    lona_r_ext, lona_r_int, lona_ang_cono, lona_ang, lona_area,
    sobrante_cono: 2 * Math.PI * lona_r_ext * (1 - cos),       // la lengüeta, medida en el borde
    lengueta_ang: 360 - lona_ang_cono,
    mon_ancho: A + 2 * P.e_trei,
    vol_perchas: P.n_per_r * slant * P.p_anc * P.p_alt,
    per_lito_ext: 2 * Math.PI * R * 2,
    per_lito_int: 2 * Math.PI * r_int_lito,
    // plancher
    tirantes, n_tir, m_tir, vol_tir: m_tir * P.tir_alt * P.tir_anc,
    vigas, n_vig, m_vig, n_pil, vol_vig: m_vig * P.viga_alt * P.viga_anc,
    area, placas_capa, vol_anillo_piso, cel_bruto, cel_neto, alto_piso,
    por_placa, placa_ok, encastre, bajo_encastre,
    circ_trazo: 2 * Math.PI * r_trei,
    // trei
    zocalo, grip_cruce, grip_abajo,
  };
}

// ── EL CORTE DEL BORDE, a escala y con los valores cargados ──
// Dos dibujos: la cabeza del muro y el pie. Cada uno con TODAS sus piezas a la
// misma escala, y la escala se calcula para que el dibujo entre en `ancho`
// píxeles: cambiar una medida cambia la forma y se reacomoda solo.
// Devuelve el texto de un <svg>; los colores son variables de estilos.css.
export function corte(P, C, ancho = 680) {
  const tan = Math.tan(P.ang * Math.PI / 180);
  const rt = C.Rint, R = C.R, A = C.A, c = C.c;
  // Supuesto escrito en el manual: la altura del muro va del piso terminado a
  // la cabeza del trei, que tapa la primera capa del anillo.
  const zt = P.alto;                                 // cabeza del trei
  const za = zt - P.e_mad + C.alto_an;               // cara de arriba del anillo
  const techo = r => za + C.h0 - (r - rt) * tan;     // cara de abajo de la percha
  const pv = P.p_anc / Math.cos(P.ang * Math.PI / 180);
  const r0 = rt - 2 * P.e_trei - P.e_int - 0.12, r9 = R + Math.min(P.desb, 0.08);
  const zLo = zt - P.e_mad - 0.06, zHi = techo(r0) + pv + 0.01;
  const izq = 190, der = 250;                        // lugar para los rótulos
  const S = (ancho - izq - der) / (r9 - r0);
  const X = r => izq + (r - r0) * S;
  const f = v => v.toFixed(1);
  const n = v => v.toFixed(3).replace(".", ",");
  const rect = (r1, r2, z1, z2, cls, Y) =>
    `<rect class="${cls}" x="${f(X(r1))}" y="${f(Y(z2))}" width="${f((r2 - r1) * S)}" height="${f((z2 - z1) * S)}"/>`;
  const txt = (x, y, t, anc = "start") => `<text x="${f(x)}" y="${f(y)}" text-anchor="${anc}">${t}</text>`;
  // Rótulos de una columna: se ordenan por altura y se separan, para que no
  // se pisen cuando dos piezas quedan cerca (pasa al cambiar las medidas).
  const columna = (x, filas, anc, yMin, yMax) => {
    const o = filas.slice().sort((p, q) => p[0] - q[0]);
    for (let i = 1; i < o.length; i++) if (o[i][0] < o[i - 1][0] + 19) o[i][0] = o[i - 1][0] + 19;
    const sobra = o.length ? o[o.length - 1][0] - yMax : 0;
    if (sobra > 0) o.forEach(r => { r[0] = Math.max(yMin, r[0] - sobra); });
    return o.map(([y, t]) => txt(x, y, t, anc)).join("");
  };

  // Cabeza del muro
  const h1 = (zHi - zLo) * S + 50;
  const Y = z => 30 + (zHi - z) * S;
  const zc = za + C.cinta_max;
  let s = "";
  s += `<g class="pz">`;
  s += `<polygon class="percha" points="${f(X(r0))},${f(Y(techo(r0)))} ${f(X(r9))},${f(Y(techo(r9)))} ${f(X(r9))},${f(Y(techo(r9) + pv))} ${f(X(r0))},${f(Y(techo(r0) + pv))}"/>`;
  s += `<polygon class="cal" points="${f(X(rt))},${f(Y(za))} ${f(X(R - c))},${f(Y(za))} ${f(X(R - c))},${f(Y(za + C.tri_tr))} ${f(X(rt))},${f(Y(techo(rt)))}"/>`;
  s += rect(rt, C.Rext, za - C.alto_an, za - C.alto_an + P.e_mad, "anillo", Y);
  s += rect(rt, C.Rext, za - C.alto_an + P.e_mad, za, "anillo", Y);
  s += rect(R - c, R - c / 2, zc - P.anc_per, zc, "cinta", Y);
  s += rect(R - c / 2, R, zc - P.anc_per, zc, "cinta", Y);
  s += rect(rt - 2 * P.e_trei, rt, zLo, zt, "trei", Y);
  s += rect(rt - 2 * P.e_trei - P.e_int, rt - 2 * P.e_trei, zt - P.e_mad, zt, "zocalo", Y);
  s += `<line class="tornillo" x1="${f(X(rt - 2 * P.e_trei - P.e_int))}" x2="${f(X(rt - 2 * P.e_trei - P.e_int + 0.09))}" y1="${f(Y(zt - P.e_mad / 2))}" y2="${f(Y(zt - P.e_mad / 2))}"/>`;
  s += `<line class="lona" x1="${f(X(R))}" x2="${f(X(R))}" y1="${f(Y(zc - P.anc_per))}" y2="${f(Y(zLo))}"/>`;
  const ax = X(rt - P.e_trei), ay = Y(zt);
  s += `<line class="apoyo" x1="${f(ax - 40)}" y1="${f(ay - 46)}" x2="${f(ax)}" y2="${f(ay - 3)}"/><circle class="apoyo-p" cx="${f(ax)}" cy="${f(ay)}" r="3"/>`;
  s += `</g>`;
  s += `<g class="rot">`;
  const xr = ancho - der + 12;
  s += columna(izq - 10, [[ay - 40, "apoyo de los"], [ay - 21, "triángulos"],
    [Y(zt - P.e_mad / 2) + 5, "zócalo · 6×90"]], "end", 20, h1 - 30);
  s += columna(xr, [[Y(techo(r9) + pv) - 6, `percha ${n(P.p_anc)} × ${n(P.p_alt)}`],
    [Y(zc) + 5, `cinta 2×${n(P.e_per)} × ${n(P.anc_per)}`],
    [Y(za + C.tri_tr / 2) + 5, `cal ${n(C.h0)} · punta ${n(C.tri_tr)}`],
    [Y(za - C.alto_an / 2) + 5, `anillo ${n(P.E)} × ${n(C.alto_an)}`],
    [Y(zLo + 0.03), `trei ${n(2 * P.e_trei)} · r ${n(rt)}`]], "start", 20, h1 - 30);
  s += `</g>`;
  // barra de 0,1 m
  s += `<g class="barra"><line x1="${izq}" x2="${f(izq + 0.1 * S)}" y1="${f(h1 - 12)}" y2="${f(h1 - 12)}"/>${txt(izq + 0.1 * S + 6, h1 - 8, "0,1 m")}</g>`;
  const svg1 = `<svg class="corte" viewBox="0 0 ${ancho} ${f(h1)}" role="img" aria-label="Corte de la cabeza del muro, a escala">${s}</svg>`;

  // Pie del muro y piso
  const zb0 = -(P.osb_inf + P.tir_alt + P.osb_sup) - 0.03, zb1 = 0.10;
  const h2 = (zb1 - zb0) * S + 50;
  const Y2 = z => 20 + (zb1 - z) * S;
  const zt0 = -P.osb_sup, zt1 = zt0 - P.tir_alt;
  let t = `<g class="pz">`;
  t += rect(r0, R, zt1 - P.osb_inf, zt1, "osb", Y2);
  t += rect(r0, R, zt1, zt0, "tirante", Y2);
  t += rect(rt, C.Rext, zt0 - C.alto_an, zt0 - C.alto_an + P.e_mad, "anillo", Y2);
  t += rect(rt, C.Rext, zt0 - C.alto_an + P.e_mad, zt0, "anillo", Y2);
  t += rect(r0, R, zt0, 0, "osb", Y2);
  t += rect(rt - 2 * P.e_trei, rt, 0, zb1, "trei", Y2);
  t += rect(rt - 2 * P.e_trei - P.e_int, rt - 2 * P.e_trei, 0, P.e_mad, "zocalo", Y2);
  t += `<path class="escuadra" d="M${f(X(rt))} ${f(Y2(0.05))}V${f(Y2(0))}H${f(X(rt + 0.05))}"/>`;
  t += `<line class="tornillo" x1="${f(X(rt - 2 * P.e_trei - P.e_int))}" x2="${f(X(rt + 0.004))}" y1="${f(Y2(P.b_borde))}" y2="${f(Y2(P.b_borde))}"/>`;
  t += `<line class="tornillo" x1="${f(X(rt + 0.035))}" x2="${f(X(rt + 0.035))}" y1="${f(Y2(0))}" y2="${f(Y2(-0.04))}"/>`;
  t += `<line class="lona" x1="${f(X(R))}" x2="${f(X(R))}" y1="${f(Y2(zb1))}" y2="${f(Y2(0))}"/>`;
  t += `</g><g class="rot">`;
  t += columna(izq - 10, [[Y2(P.b_borde) + 5, "zócalo · bulón"]], "end", 20, h2 - 30);
  t += columna(xr, [[Y2(0.04), "escuadra · 6×40"],
    [Y2(-P.osb_sup / 2) + 5, `OSB ${Math.round(P.osb_sup * 1000)} mm`],
    [Y2(zt0 - C.alto_an / 2) + 5, `anillo encastrado ${n(C.alto_an)}`],
    [Y2(zt1 + 0.03), `tirante ${n(P.tir_alt)} × ${n(P.tir_anc)}`],
    [Y2(zt1 - P.osb_inf / 2) + 5, `OSB ${Math.round(P.osb_inf * 1000)} mm`]], "start", 20, h2 - 30);
  t += `</g><g class="barra"><line x1="${izq}" x2="${f(izq + 0.1 * S)}" y1="${f(h2 - 10)}" y2="${f(h2 - 10)}"/>${txt(izq + 0.1 * S + 6, h2 - 6, "0,1 m")}</g>`;
  const svg2 = `<svg class="corte" viewBox="0 0 ${ancho} ${f(h2)}" role="img" aria-label="Corte del pie del muro y el piso, a escala">${t}</svg>`;

  return { svg1, svg2, escala: S };
}

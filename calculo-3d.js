// calculo-3d.js — el modelo en 3D de la estructura, con las medidas del cálculo.
// Sello: 3d-2 (1-nov-2026). 3d-1: «un primer render 3d de la estructura total».
// 3d-2: el 3D pasa a la pestaña de las MEDIDAS, con cada parte por separado
// (prender y apagar), y la parte que se está midiendo se resalta (Mauro: «para
// tener noción clara de qué se está modificando»). Todo a escala real: cada
// barra tiene su sección y su largo en metros, y el piso lleva una cuadrícula
// de 1 m para tener la medida a la vista.
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

export const SELLO_3D = "3d-3";
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
  r_toono: ["toono", "triangulos", "radiales"], sep_max: ["radiales"],
};

// El arriostramiento de un triángulo, en su plano: s = lateral desde la
// mediana, t = a lo largo de la mediana desde la base. Es el de Christine
// (1-nov-2026, n = 8: base 1,817, mediana 2,586), llevado a proporción de la
// base B y la mediana M para que otro triángulo lo herede con la misma forma:
//   paralelas a 0,30 B de la mediana, de la base hasta los lados (0,40 M);
//   tres Λ con los pies sobre las paralelas cada 0,189 M, que suben 0,116 M;
//   una V con el vértice a 0,567 M y los brazos a los lados a 0,700 M.
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
  const paso = 0.18917 * M, sube = 0.11601 * M;
  for (let i = 0; i < 3; i++) for (const g of [-1, 1]) add(g * sp, i * paso, 0, i * paso + sube, "lambda");
  const tv = 3 * paso, tb = 0.69992 * M;
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

export function piezas3d(P, C) {
  const out = [];
  const rad = P.ang * Math.PI / 180, tan = Math.tan(rad), cos = Math.cos(rad);
  const barra = (g, a, b, ancho, alto, arriba, mat) => out.push({ g, tipo: "barra", a, b, ancho, alto, arriba, mat });
  const anillo = (g, r1, r2, y1, y2, mat) => out.push({ g, tipo: "anillo", r1, r2, y1, y2, mat });
  const disco = (g, r, y1, y2, mat) => out.push({ g, tipo: "disco", r, y1, y2, mat });

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
  const rT = C.r_trei - P.e_trei;
  const span = P.alto / Math.tan(Math.PI / 3);    // avance horizontal de un listón
  const n = C.n_pts, tramos = 8;
  for (const fam of [-1, 1]) for (let i = 0; i < n; i++) {
    const th0 = 2 * Math.PI * i / n, dth = fam * span / rT;
    for (let k = 0; k < tramos; k++) {
      const f1 = k / tramos, f2 = (k + 1) / tramos;
      const r = rT + fam * P.e_trei / 2;
      const p = (f) => v3(r * Math.cos(th0 + f * dth), yPiso + f * P.alto, r * Math.sin(th0 + f * dth));
      const m = (th0 + (f1 + f2) / 2 * dth);
      barra("trei", p(f1), p(f2), P.anc_trei, P.e_trei, [Math.cos(m), 0, Math.sin(m)], "trei");
    }
  }
  anillo("zocalos", C.r_trei_int - P.e_int, C.r_trei_int, yPiso, yPiso + P.anc_int, "madera");
  anillo("zocalos", C.r_trei_int - P.e_int, C.r_trei_int, yt - P.anc_int, yt, "madera");
  const yA0 = yt - P.e_mad, yA = yA0 + C.alto_an;  // el anillo periférico: el trei cubre su primera capa
  anillo("anillo", C.Rint, C.Rext, yA0, yA, "anillo");

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

  return { piezas: out, alto: yPerchaToono + 0.1, suelo: yViga - P.viga_alt - 0.6, yt, yA, yC, nCor, relleno };
}

const COLORES = {
  madera: 0xd9b27c, madera2: 0xc49a62, pilar: 0x8a6a4a, osb: 0xd8bf8a, anillo: 0xc8874a,
  trei: 0xe0b98a, cal: 0xb98a4f, cinta: 0x6fa8dc, triangulo: 0xe2a95c, radial: 0xb5481c,
  toono: 0xa86a3a, toono2: 0xc08050, percha: 0x9c6b3c,
};

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
  const opacidadBase = (k) => k === "osb" ? 0.55 : 1;
  const mat = (parte, k) => mats[parte + "|" + k] || (mats[parte + "|" + k] =
    Object.assign(new THREE.MeshLambertMaterial({ color: COLORES[k] || 0xcccccc,
      transparent: k === "osb", opacity: opacidadBase(k), side: THREE.DoubleSide }), { userData: { k, parte } }));
  let grupos = {}, rejilla = null, resaltadas = [];
  const caja1 = new THREE.BoxGeometry(1, 1, 1);

  function aplicarResalte() {
    const hay = resaltadas.length > 0;
    for (const m of Object.values(mats)) {
      const { k, parte } = m.userData, si = resaltadas.includes(parte);
      m.transparent = (hay && !si) || k === "osb";
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
    destruir() { vivo = false; ro.disconnect(); ren.dispose(); },
  };
}

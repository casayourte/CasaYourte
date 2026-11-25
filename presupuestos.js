// ─────────────────────────────────────────────────────────────────────────────
// presupuestos.js — Pedir precio de materiales a proveedores y compararlos.
// Sello: presupuestos-js-4 (25-nov-2026: entra el REAL (BRL) y el COSTO DE MATERIALES por sección:
//   lo cotizado por un proveedor, y si no hay, un precio de referencia; lo que no tiene ninguno, a la vista)
// presupuestos-js-3 (17-nov-2026: entra el rubro «vidrios», para la vidriería del sobrealto)
//
// 3-nov-2026, Mauro: «hacer un envío de mails consultando precios para los
// materiales… busquemos un presupuesto para una yurta de 5 m de diámetro… haz en
// el sitio una lista que sea presupuestos y proveedores contando el estado del
// pedido, lo que fue solicitado y esperando, seguir ahí la línea de la respuesta
// para establecer un precio de cada material por proveedor».
//
// Tres colecciones, las tres PRIVADAS (permiso `presupuestos`): llevan precios y
// proveedores, que el CLAUDE.md del proyecto prohíbe subir al repositorio.
//   presupuestos/{id}         una obra a cotizar: sus MATERIALES (mapa por id)
//   proveedores/{id}          quién vende qué: nombre, rubros, mail, teléfono
//   presupuesto_pedidos/{id}  UN pedido de precio a UN proveedor: qué materiales
//                             se le pidieron, el estado, el HILO (lo que se le
//                             mandó y lo que contestó) y los PRECIOS por material
//
// Cada moneda es un sistema aparte (como en remate y Tiempos): UYU y USD no se
// suman nunca y no se comparan entre sí. Un precio en otra unidad que la del
// material se muestra pero no entra en el total: sería comparar metros con
// tirantes.
//
// Sin Firebase y sin DOM: lo prueba `node pruebas-presupuestos.mjs`.
// ─────────────────────────────────────────────────────────────────────────────

export const VERSION_PRESUPUESTOS = "presupuestos-js-4";

export const ESTADOS = [
  ["por_pedir", "Por pedir: el mail está listo y sin mandar"],
  ["pedido", "Pedido: esperamos la respuesta"],
  ["respondido", "Respondió: falta anotar los precios"],
  ["cotizado", "Cotizado: precios anotados"],
  ["sin_respuesta", "No contestó"],
  ["descartado", "Descartado"],
];
export const ESTADO_IDS = ESTADOS.map((e) => e[0]);
// BRL desde presupuestos-js-4 (25-nov-2026, la primera obra en Brasil). Es un sistema aparte, como las otras dos.
export const MONEDAS = ["UYU", "USD", "BRL"];
export const IVA = ["incluido", "mas_iva", "no_dice"];

export const RUBROS = [
  ["madera", "Madera estructural"],
  ["tableros", "Tableros (OSB)"],
  ["aislacion", "Aislación"],
  ["membranas", "Membranas y freno de vapor"],
  ["lonas", "Lonas y telas exteriores"],
  ["telas", "Telas interiores"],
  ["policarbonato", "Policarbonato y domo"],
  ["vidrios", "Vidrios (vidriería)"],
  ["fijaciones", "Bulones, tornillos y herrajes"],
  ["otros", "Otros"],
];
export const RUBRO_IDS = RUBROS.map((r) => r[0]);

const txt = (x, n = 300) => (typeof x === "string" ? x.trim().slice(0, n) : "");

/** Un precio leído con desconfianza: número positivo y moneda conocida, o null. */
export function leerPrecio(p) {
  if (!p || typeof p !== "object") return null;
  const precio = typeof p.precio === "number" ? p.precio : Number(String(p.precio ?? "").replace(/\./g, "").replace(",", "."));
  if (!(precio > 0) || !isFinite(precio)) return null;
  const moneda = String(p.moneda || "").toUpperCase();
  if (!MONEDAS.includes(moneda)) return null;
  return {
    precio, moneda,
    unidad: txt(p.unidad, 30),
    iva: IVA.includes(p.iva) ? p.iva : "no_dice",
    nota: txt(p.nota),
    en: txt(p.en, 40),
  };
}

const ordenMat = (a, b) => (RUBRO_IDS.indexOf(a.rubro) - RUBRO_IDS.indexOf(b.rubro)) || ((a.orden || 0) - (b.orden || 0)) || String(a.nombre).localeCompare(String(b.nombre));

/** Los materiales de un presupuesto, como lista ordenada por rubro. */
export function materialesDe(pres) {
  return Object.entries((pres && pres.materiales) || {})
    .map(([id, m]) => ({ id, ...m, cantidad: Number(m.cantidad) || 0 }))
    .sort(ordenMat);
}

const mismaUnidad = (a, b) => !a || !b || String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

/**
 * Para cada material, las ofertas de cada proveedor y la mejor POR MONEDA.
 * Sólo entran pedidos de este presupuesto que no estén descartados.
 */
export function comparativa(pres, pedidos, proveedores) {
  const nombre = Object.fromEntries((proveedores || []).map((p) => [p.id, p.nombre || p.id]));
  const mios = (pedidos || []).filter((x) => x.presupuesto === pres.id && x.estado !== "descartado");
  return materialesDe(pres).map((m) => {
    const ofertas = [];
    for (const ped of mios) {
      const p = leerPrecio((ped.precios || {})[m.id]);
      if (!p) continue;
      const comparable = mismaUnidad(p.unidad, m.unidad);
      ofertas.push({ pedido: ped.id, proveedor: ped.proveedor, nombre: nombre[ped.proveedor] || ped.proveedor,
        ...p, comparable, total: comparable ? p.precio * m.cantidad : null });
    }
    const mejor = {};
    for (const o of ofertas) if (o.comparable && (!mejor[o.moneda] || o.precio < mejor[o.moneda].precio)) mejor[o.moneda] = o;
    return { material: m, ofertas, mejor };
  });
}

/** Cuánto saldría lo cotizado a cada proveedor, por moneda (nunca sumadas). */
export function totalesPorProveedor(pres, pedidos, proveedores) {
  const t = {};
  for (const fila of comparativa(pres, pedidos, proveedores)) {
    for (const o of fila.ofertas) {
      if (o.total == null) continue;
      const x = (t[o.proveedor] ||= { nombre: o.nombre, porMoneda: {}, materiales: 0 });
      x.porMoneda[o.moneda] = (x.porMoneda[o.moneda] || 0) + o.total;
      x.materiales++;
    }
  }
  return t;
}

/** Lo que falta cotizar: materiales sin ningún precio comparable. */
export function sinCotizar(pres, pedidos, proveedores) {
  return comparativa(pres, pedidos, proveedores).filter((f) => !Object.keys(f.mejor).length).map((f) => f.material);
}

/** Qué estado sigue al sumar un renglón al hilo (no retrocede nunca). */
export function estadoTrasHilo(estado, quien) {
  if (quien === "nosotros" && (!estado || estado === "por_pedir")) return "pedido";
  if (quien === "proveedor" && ["por_pedir", "pedido", "sin_respuesta"].includes(estado)) return "respondido";
  return estado || "por_pedir";
}

/** El estado al anotar precios: con alguno válido pasa a cotizado. */
export function estadoTrasPrecios(estado, precios) {
  const alguno = Object.values(precios || {}).some((p) => leerPrecio(p));
  return alguno && estado !== "descartado" ? "cotizado" : (estado || "por_pedir");
}

const fmtCant = (n) => (Math.round(n * 100) / 100).toLocaleString("es-UY");

/** El mail de pedido de precio, en castellano rioplatense, para UN proveedor. */
export function mailDePedido(pres, proveedor, ids, { firma = "Mauro Gastaldello · CasaYourte" } = {}) {
  const mats = materialesDe(pres).filter((m) => ids.includes(m.id));
  const renglones = mats.map((m) =>
    `- ${m.nombre}${m.especificacion ? ` (${m.especificacion})` : ""}: ${fmtCant(m.cantidad)} ${m.unidad || ""}`.trimEnd());
  const asunto = `Pedido de precio · ${pres.titulo || "materiales"}`;
  const cuerpo = [
    `Hola${proveedor && proveedor.nombre ? `, ${proveedor.nombre}` : ""}:`,
    "",
    "Les escribo de CasaYourte: construimos yurtas (casas circulares de madera y lona) y estamos armando el presupuesto de una de 5 m de diámetro en Uruguay.",
    "",
    "¿Nos podrían pasar precio y disponibilidad de lo siguiente?",
    "",
    ...renglones,
    "",
    "Si alguna medida no la tienen, nos sirve que nos digan la más parecida. Nos ayuda saber también si el precio incluye IVA, el plazo de entrega y si hacen envío (y a qué costo).",
    "",
    "Muchas gracias.",
    firma,
  ].join("\n");
  return { asunto, cuerpo };
}

/* ── Respuestas nuevas (presupuestos-js-2, 4-nov-2026) ───────────────────────
   Mauro: «cuando se agregan respuestas tienen que marcarse en la vista al
   inicio para poder ir a leer y ordenar las últimas respuestas». La respuesta
   es el último renglón del hilo que escribió el PROVEEDOR (lo que mandamos
   nosotros o una nota no es novedad). Visto es de CADA persona:
   `vistoPor.<uid>` = cuándo abrió el pedido por última vez, y lo escribe la
   página al abrirlo. Nuevo = hay una respuesta posterior a ese momento. */
export function ultimaRespuesta(pedido) {
  let u = null;
  for (const x of (pedido && pedido.hilo) || []) {
    if (x && x.quien === "proveedor" && x.en && (!u || String(x.en) > String(u.en))) u = x;
  }
  return u;
}
export function esNueva(pedido, uid) {
  const u = ultimaRespuesta(pedido);
  if (!u) return false;
  const visto = ((pedido && pedido.vistoPor) || {})[uid];
  return !visto || String(u.en) > String(visto);
}
/** Los pedidos con alguna respuesta, la más nueva primero; las sin leer arriba. */
export function respuestasRecientes(pedidos, uid) {
  return (pedidos || [])
    .map((p) => ({ pedido: p, respuesta: ultimaRespuesta(p), nueva: esNueva(p, uid) }))
    .filter((x) => x.respuesta)
    .sort((a, b) => (b.nueva - a.nueva) || String(b.respuesta.en).localeCompare(String(a.respuesta.en)));
}

/* ── El COSTO DE MATERIALES (presupuestos-js-4, 25-nov-2026) ─────────────────
   Mauro: «visibles todos los materiales por los cuales se tiene y se pide
   presupuesto… con un resalte en los que falta conseguir presupuesto; un total
   por sección o por partes, y aclarar que es costo de materiales».
   Cada material cuesta, en este orden:
     1. lo COTIZADO: el mejor precio comparable de un pedido (en la moneda de la
        referencia si la hay; si no, la primera que aparezca);
     2. si no hay cotización, su REFERENCIA (`material.ref` = {total, moneda,
        fuente}: un precio de lista o de tabla, no una oferta);
     3. si no tiene ninguno, FALTA: no entra en ningún total y se marca.
   Los totales son por sección (rubro) y por moneda: nunca se suman monedas. */
export function leerRef(r) {
  if (!r || typeof r !== "object") return null;
  const total = typeof r.total === "number" ? r.total : Number(String(r.total ?? "").replace(/\./g, "").replace(",", "."));
  if (!(total > 0) || !isFinite(total)) return null;
  const moneda = String(r.moneda || "").toUpperCase();
  if (!MONEDAS.includes(moneda)) return null;
  return { total, moneda, fuente: txt(r.fuente) };
}

export function costoDe(fila) {
  const m = fila.material, ref = leerRef(m.ref);
  const monedas = Object.keys(fila.mejor || {});
  if (monedas.length) {
    const mo = ref && monedas.includes(ref.moneda) ? ref.moneda : monedas[0];
    const o = fila.mejor[mo];
    return { tipo: "cotizado", moneda: mo, total: o.total, fuente: o.nombre };
  }
  if (ref) return { tipo: "referencia", moneda: ref.moneda, total: ref.total, fuente: ref.fuente };
  return { tipo: "falta" };
}

export function costoDeMateriales(pres, pedidos, proveedores) {
  const secciones = [];
  const total = {}, cuenta = { cotizado: 0, referencia: 0, falta: 0 };
  for (const fila of comparativa(pres, pedidos, proveedores)) {
    const costo = costoDe(fila);
    cuenta[costo.tipo]++;
    let sec = secciones[secciones.length - 1];
    if (!sec || sec.rubro !== fila.material.rubro) {
      sec = { rubro: fila.material.rubro, filas: [], total: {}, faltan: 0 };
      secciones.push(sec);
    }
    sec.filas.push({ material: fila.material, costo });
    if (costo.tipo === "falta") { sec.faltan++; continue; }
    sec.total[costo.moneda] = (sec.total[costo.moneda] || 0) + costo.total;
    total[costo.moneda] = (total[costo.moneda] || 0) + costo.total;
  }
  return { secciones, total, cuenta, faltan: secciones.flatMap((x) => x.filas.filter((f) => f.costo.tipo === "falta").map((f) => f.material)) };
}

// ─────────────────────────────────────────────────────────────────────────────
// presupuestos.js — Pedir precio de materiales a proveedores y compararlos.
// Sello: presupuestos-js-2
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

export const VERSION_PRESUPUESTOS = "presupuestos-js-2";

export const ESTADOS = [
  ["por_pedir", "Por pedir: el mail está listo y sin mandar"],
  ["pedido", "Pedido: esperamos la respuesta"],
  ["respondido", "Respondió: falta anotar los precios"],
  ["cotizado", "Cotizado: precios anotados"],
  ["sin_respuesta", "No contestó"],
  ["descartado", "Descartado"],
];
export const ESTADO_IDS = ESTADOS.map((e) => e[0]);
export const MONEDAS = ["UYU", "USD"];
export const IVA = ["incluido", "mas_iva", "no_dice"];

export const RUBROS = [
  ["madera", "Madera estructural"],
  ["tableros", "Tableros (OSB)"],
  ["aislacion", "Aislación"],
  ["membranas", "Membranas y freno de vapor"],
  ["lonas", "Lonas y telas exteriores"],
  ["telas", "Telas interiores"],
  ["policarbonato", "Policarbonato y domo"],
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

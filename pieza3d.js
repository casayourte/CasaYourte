// pieza3d.js — el 3D de UNA pieza de la lista de materiales (pieza3d-1, 27-nov-2026, Mauro).
// pieza3d-2 (28-nov-2026, Mauro: «hay materiales mal referenciados al dibujo»): un material puede ser VARIAS piezas
// (una lista de claves: «Doble cinta del muro y cinta del alero»); «Sola» muestra sólo esas piezas (las de su `sub`)
// y la cámara va a ellas, no a la yurta entera.
// El render es el del proyecto (calculo-3d.js): acá sólo se elige qué parte mostrar. Las telas, además, se ven
// DESPLEGADAS en el piso (la forma que se corta en el taller), con sus medidas.
import { calc, materiales, NOMBRES_MAT, renglonMat, desplegados } from "./calculo-geo.js";
import { montar, GRUPOS_MAT, planoDe } from "./calculo-3d.js";

export const SELLO_PIEZA3D = "pieza3d-2";
const f = (n, k = 2) => n.toLocaleString("es-UY", { minimumFractionDigits: k, maximumFractionDigits: k });
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

// Las medidas de una tela desplegada, en líneas para leer en el taller.
export function medidasTela(d) {
  if (d.forma === "rect") return [`Ancho ${f(d.ancho)} m (2π × radio)`, `Alto ${f(d.alto)} m`];
  const l = [`Radio exterior ${f(d.rExt)} m`];
  if (d.rInt > 0.05) l.push(`Radio del agujero ${f(d.rInt)} m`);
  if (d.cono) l.push(`Cono cerrado ${f(d.cono, 1)}° · lengüeta ${f(d.ang - d.cono, 1)}°`);
  else l.push(`Abre ${f(d.ang, 1)}° (360° × cos del ángulo del techo)`);
  l.push(`Borde exterior ${f(d.arcoExt)} m`);
  if (d.panos) l.push("En paños de la bobina: se cuentan en tiras");
  return l;
}

// La ficha de una pieza: qué partes del modelo es, sus medidas y, si es tela, su forma plana. `claves` es una clave de
// materiales() o una lista de ellas (un material que es varias piezas).
// la misma pieza en otra forma: el anillo del piso (sándwich o listones) y cada capa de OSB (en la lista van juntas)
const PAR = { anillo_piso: "anillo_piso_lis", anillo_piso_lis: "anillo_piso", osb_inf: "osb", osb_sup: "osb" };
export function fichaPieza(datos, claves) {
  const ks = (Array.isArray(claves) ? claves : [claves]).filter((k) => GRUPOS_MAT[k]);
  if (!ks.length) return { ok: false, motivo: "Este material no es una pieza dibujada en el 3D del proyecto." };
  let P, C;
  try { P = { ...datos }; C = calc(P); } catch (e) { return { ok: false, motivo: "No se pudo calcular el cálculo vinculado." }; }
  if (!isFinite(C.R) || !isFinite(C.lona_area)) return { ok: false, motivo: "Al cálculo vinculado le faltan medidas: abrilo en Cálculos y guardalo." };
  const lista = materiales(P, C), desp = desplegados(P, C);
  const grupos = [], medidas = [], nombres = [], telas = [];
  for (const k of ks) {
    const x = lista.find((e) => e.k === k) || lista.find((e) => e.k === PAR[k]);
    if (!x) continue;                                   // esa pieza no va en este cálculo (p. ej. el cable con anillo)
    const gs = x.k === k ? GRUPOS_MAT[k] : (GRUPOS_MAT[k] || GRUPOS_MAT[x.k]);   // osb_sup: sólo su capa
    for (const g of gs) if (!grupos.includes(g)) grupos.push(g);
    const r = renglonMat(x, NOMBRES_MAT, f);
    nombres.push(r.nombre);
    medidas.push([r.nombre, [r.cant, r.detalle].filter(Boolean).join(" · ")]);
  }
  if (!grupos.length) return { ok: false, motivo: "Esta pieza no va en el cálculo vinculado (su configuración no la lleva)." };
  for (const g of grupos) if (desp[g]) { telas.push(desp[g]); medidas.push([desp[g].nombre + " · desplegada", medidasTela(desp[g]).join(" · ")]); }
  return { ok: true, P, C, claves: ks, grupos, telas, medidas, nombre: nombres.join(" + ") };
}

// Arma el visor dentro de `raiz`. Devuelve { destruir }.
export async function mostrar(raiz, ficha) {
  raiz.innerHTML = `<div class="tabs" id="z-modos"></div>
    <div id="z-caja" style="height:52vh;min-height:260px;border-radius:8px;overflow:hidden;background:#1d1a17"></div>
    <table class="t" style="margin-top:.7rem">${ficha.medidas.map(([k, v]) => `<tr><td class="gris">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>`;
  const modos = [["sola", "Sola"], ["conjunto", "En el conjunto"]];
  for (const d of ficha.telas) modos.push(["plano:" + d.g, ficha.telas.length > 1 ? "Desplegada · " + d.nombre.replace(/ del (techo|muro)$/, "").split(",")[0] + (d.forma === "rect" ? " (muro)" : " (techo)") : "Desplegada en el piso"]);
  const barra = raiz.querySelector("#z-modos");
  barra.innerHTML = modos.map(([k, t], i) => `<button data-m="${esc(k)}" class="${i ? "" : "on"}">${esc(t)}</button>`).join("");
  const caja = raiz.querySelector("#z-caja");
  const planos = {}; for (const d of ficha.telas) planos[d.g] = planoDe(d, f);
  let vista;
  try {
    vista = await montar(caja, ficha.P, ficha.C, Object.fromEntries(Object.keys(planos).map((g) => ["plano:" + g, false])), planos);
  } catch (e) { caja.innerHTML = `<div class="empty" style="padding:1rem">No se pudo cargar el 3D (¿sin conexión?). Las medidas están abajo.</div>`; return { destruir() {} }; }
  const aplicar = (m) => {
    const plano = m.startsWith("plano:") ? m.slice(6) : null;
    vista.solo(plano ? [] : m === "conjunto" ? null : ficha.grupos);
    for (const g of Object.keys(planos)) vista.ver("plano:" + g, g === plano);
    vista.resaltar(!plano && m === "conjunto" ? ficha.grupos : []);
    if (plano) vista.arriba(Math.max(planos[plano].ancho, planos[plano].alto));
    else if (m === "sola") vista.encuadrarA(ficha.grupos); else vista.encuadrar();
  };
  aplicar("sola");
  barra.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-m]"); if (!b) return;
    barra.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    aplicar(b.dataset.m);
  });
  return { destruir() { try { vista.destruir(); } catch (e) { /* ya estaba */ } } };
}

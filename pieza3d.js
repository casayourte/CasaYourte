// pieza3d.js — el 3D de UNA pieza de la lista de materiales (pieza3d-1, 27-nov-2026, Mauro).
// El render es el del proyecto (calculo-3d.js): acá sólo se elige qué parte mostrar. Las telas, además, se ven
// DESPLEGADAS en el piso (la forma que se corta en el taller), con sus medidas.
import { calc, materiales, NOMBRES_MAT, renglonMat, desplegados } from "./calculo-geo.js";
import { montar, PARTES, GRUPOS_MAT, planoDe } from "./calculo-3d.js";

export const SELLO_PIEZA3D = "pieza3d-1";
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

// La ficha de una pieza: qué partes del modelo es, sus medidas y, si es tela, su forma plana.
export function fichaPieza(datos, clave) {
  const grupos = GRUPOS_MAT[clave];
  if (!grupos) return { ok: false, motivo: "Esta pieza todavía no tiene dibujo en el 3D del proyecto." };
  let P, C;
  try { P = { ...datos }; C = calc(P); } catch (e) { return { ok: false, motivo: "No se pudo calcular el cálculo vinculado." }; }
  if (!isFinite(C.R) || !isFinite(C.lona_area)) return { ok: false, motivo: "Al cálculo vinculado le faltan medidas: abrilo en Cálculos y guardalo." };
  const lista = materiales(P, C);
  const x = lista.find((e) => e.k === clave) || lista.find((e) => (GRUPOS_MAT[e.k] || []).some((g) => grupos.includes(g)));
  const r = x ? renglonMat(x, NOMBRES_MAT, f) : null;
  const desp = desplegados(P, C);
  const telas = grupos.filter((g) => desp[g]).map((g) => desp[g]);
  const medidas = [];
  if (r) { medidas.push(["Pieza", r.nombre]); if (r.cant != null) medidas.push(["Cantidad", String(r.cant)]); if (r.detalle) medidas.push(["Medidas", r.detalle]); }
  for (const d of telas) medidas.push([d.nombre + " · desplegada", medidasTela(d).join(" · ")]);
  return { ok: true, P, C, clave, grupos, telas, medidas, nombre: r ? r.nombre : clave };
}

// Arma el visor dentro de `raiz`. Devuelve { destruir }.
export async function mostrar(raiz, ficha) {
  raiz.innerHTML = `<div class="tabs" id="z-modos"></div>
    <div id="z-caja" style="height:52vh;min-height:260px;border-radius:8px;overflow:hidden;background:#1d1a17"></div>
    <table class="t" style="margin-top:.7rem">${ficha.medidas.map(([k, v]) => `<tr><td class="gris" style="white-space:nowrap">${esc(k)}</td><td>${esc(v)}</td></tr>`).join("")}</table>`;
  const modos = [["conjunto", "En el conjunto"], ["sola", "Sola"]];
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
    for (const [k] of PARTES) vista.ver(k, !plano && (m === "conjunto" || ficha.grupos.includes(k)));
    for (const g of Object.keys(planos)) vista.ver("plano:" + g, g === plano);
    vista.resaltar(!plano && m === "conjunto" ? ficha.grupos : []);
    if (plano) vista.arriba(Math.max(planos[plano].ancho, planos[plano].alto)); else vista.encuadrar();
  };
  aplicar("conjunto");
  barra.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-m]"); if (!b) return;
    barra.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
    aplicar(b.dataset.m);
  });
  return { destruir() { try { vista.destruir(); } catch (e) { /* ya estaba */ } } };
}

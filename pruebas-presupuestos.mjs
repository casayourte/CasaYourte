// pruebas-presupuestos.mjs — banco de presupuestos.js y de su página.
// Sin npm y sin navegador: `node pruebas-presupuestos.mjs`.
import fs from "node:fs";
import { leerPrecio, materialesDe, comparativa, totalesPorProveedor, sinCotizar,
         estadoTrasHilo, estadoTrasPrecios, mailDePedido, ESTADO_IDS, RUBRO_IDS } from "./presupuestos.js";

let bien = 0, mal = 0;
const ok = (n, c) => { if (c) bien++; else { mal++; console.log("  ✗ " + n); } };
const leer = (f) => fs.readFileSync(new URL("./" + f, import.meta.url), "utf8");

const pres = { id: "y5", titulo: "Yurta Ø 5 m", materiales: {
  tir: { rubro: "madera", nombre: "Tirante pino 2×6", cantidad: 13, unidad: "u" },
  osb: { rubro: "tableros", nombre: "OSB 18 mm", cantidad: 9, unidad: "placa" },
  lona: { rubro: "lonas", nombre: "Lona PVC", cantidad: 40, unidad: "m²" },
} };
const provs = [{ id: "a", nombre: "Barraca A" }, { id: "b", nombre: "Barraca B" }];
const peds = [
  { id: "pa", presupuesto: "y5", proveedor: "a", estado: "cotizado", precios: {
      tir: { precio: 500, moneda: "UYU" }, osb: { precio: 40, moneda: "USD", unidad: "placa" } } },
  { id: "pb", presupuesto: "y5", proveedor: "b", estado: "cotizado", precios: {
      tir: { precio: 450, moneda: "UYU", unidad: "u" }, osb: { precio: 1600, moneda: "UYU", unidad: "placa" },
      lona: { precio: 9, moneda: "USD", unidad: "metro lineal" } } },
  { id: "px", presupuesto: "y5", proveedor: "a", estado: "descartado", precios: { tir: { precio: 1, moneda: "UYU" } } },
  { id: "otro", presupuesto: "zz", proveedor: "b", estado: "cotizado", precios: { tir: { precio: 2, moneda: "UYU" } } },
];

console.log("1 · un precio se lee con desconfianza");
ok("número y moneda válidos", leerPrecio({ precio: 10, moneda: "uyu" }).moneda === "UYU");
ok("texto con coma decimal", leerPrecio({ precio: "1.234,5", moneda: "UYU" }).precio === 1234.5);
ok("cero no es un precio", leerPrecio({ precio: 0, moneda: "UYU" }) === null);
ok("negativo no es un precio", leerPrecio({ precio: -3, moneda: "UYU" }) === null);
ok("una moneda desconocida no se adivina", leerPrecio({ precio: 5, moneda: "EUR" }) === null);
ok("IVA desconocido queda en no_dice", leerPrecio({ precio: 5, moneda: "USD", iva: "x" }).iva === "no_dice");

console.log("2 · comparar");
const c = comparativa(pres, peds, provs);
const fila = (id) => c.find((f) => f.material.id === id);
ok("los materiales salen ordenados por rubro", materialesDe(pres).map((m) => m.rubro).join() === "madera,tableros,lonas");
ok("un pedido descartado no entra", !fila("tir").ofertas.some((o) => o.pedido === "px"));
ok("un pedido de otra obra no entra", !fila("tir").ofertas.some((o) => o.pedido === "otro"));
ok("la mejor oferta en UYU es la más barata", fila("tir").mejor.UYU.proveedor === "b");
ok("UYU y USD tienen cada uno su mejor, no se cruzan", fila("osb").mejor.UYU && fila("osb").mejor.USD);
ok("otra unidad se muestra pero no compara", fila("lona").ofertas.length === 1 && !fila("lona").ofertas[0].comparable && !fila("lona").mejor.USD);
const t = totalesPorProveedor(pres, peds, provs);
ok("los totales van por moneda", t.a.porMoneda.UYU === 500 * 13 && t.a.porMoneda.USD === 40 * 9);
ok("y nunca suman UYU con USD", Object.keys(t.b.porMoneda).join() === "UYU" && t.b.porMoneda.UYU === 450 * 13 + 1600 * 9);
ok("lo que falta cotizar es la lona (sólo tiene otra unidad)", sinCotizar(pres, peds, provs).map((m) => m.id).join() === "lona");

console.log("3 · el estado no retrocede");
ok("mandar el mail pasa a pedido", estadoTrasHilo("por_pedir", "nosotros") === "pedido");
ok("que conteste pasa a respondido", estadoTrasHilo("pedido", "proveedor") === "respondido");
ok("una nota no cambia nada", estadoTrasHilo("pedido", "nota") === "pedido");
ok("cotizado no vuelve a respondido", estadoTrasHilo("cotizado", "proveedor") === "cotizado");
ok("con un precio válido queda cotizado", estadoTrasPrecios("respondido", { a: { precio: 3, moneda: "UYU" } }) === "cotizado");
ok("sin precios válidos no cambia", estadoTrasPrecios("respondido", { a: { precio: 0, moneda: "UYU" } }) === "respondido");
ok("descartado se queda descartado", estadoTrasPrecios("descartado", { a: { precio: 3, moneda: "UYU" } }) === "descartado");

console.log("4 · el mail");
const m = mailDePedido(pres, provs[0], ["tir", "lona"]);
ok("lleva sólo lo pedido", /Tirante/.test(m.cuerpo) && /Lona/.test(m.cuerpo) && !/OSB/.test(m.cuerpo));
ok("pide IVA, plazo y envío", /IVA/.test(m.cuerpo) && /plazo/.test(m.cuerpo) && /envío/.test(m.cuerpo));
ok("el asunto nombra la obra", /Yurta Ø 5 m/.test(m.asunto));
ok("no promete compra ni da precios nuestros", !/\$|US\$|compramos|confirmamos/.test(m.cuerpo));

console.log("5 · la página, las reglas y el menú dicen lo mismo");
const h = leer("presupuestos.html"), r = leer("REGLAS.txt"), n = leer("nucleo.js"), sw = leer("sw.js");
ok("la página entra con el permiso presupuestos", /CY\.arrancar\([^)]*"presupuestos", "presupuestos"\)/.test(h));
for (const col of ["presupuestos", "proveedores", "presupuesto_pedidos"]) {
  ok(`la regla de ${col} pide el permiso`, new RegExp(`match /${col}/\\{id\\} \\{\\s*allow read, create, update, delete: if con\\('presupuestos'\\);\\s*allow create, update: if esAgente\\(\\);`).test(r));
  ok(`la página usa ${col}`, h.includes(`"${col}"`));
}
ok("el agente no borra (ningún delete con esAgente)", !/delete[^;]*esAgente\(\)|esAgente\(\)[^;]*delete/.test(r.split("presupuestos y proveedores (3-nov-2026)")[1].split("// ---------- el sitio")[0]));
ok("el permiso existe en CY.PERMISOS", /id:'presupuestos', label:'Presupuestos y proveedores'/.test(n));
ok("y en el menú, con su permiso", /href:'\.\/presupuestos\.html', grupo:'clientes', permiso:'presupuestos'/.test(n));
ok("los dos archivos están en el SHELL", sw.includes("'./presupuestos.html'") && sw.includes("'./presupuestos.js'"));
ok("los estados de la página salen del módulo", ESTADO_IDS.length === 6 && /ESTADOS\.map/.test(h));
ok("los rubros también", RUBRO_IDS.includes("madera") && /RUBROS\.map/.test(h));
ok("los catálogos y capturas: regla con forma fija, sólo imagen, 900 KB, el agente sólo crea",
  /match \/presupuesto_pedidos\/\{id\} \{[\s\S]*?match \/adjuntos\/\{aid\} \{\s*allow read, delete: if con\('presupuestos'\);\s*allow create: if \(con\('presupuestos'\) \|\| esAgente\(\)\)[\s\S]*?tipo == 'imagen'[\s\S]*?size\(\) <= 900000;/.test(r));
ok("la página guarda los adjuntos donde dice la regla, achicados y con dos inputs",
  h.includes('"presupuesto_pedidos", pedido.id, "adjuntos"') && /capture="environment" id="a-camara"/.test(h) && /id="a-archivo"[^>]*multiple/.test(h) && /const MAXIMO = 900000/.test(h));
ok("el hilo anota por dónde fue (mail, WhatsApp…)", /id="h-canal"/.test(h) && /x\.canal = \$\("h-canal"\)\.value/.test(h));
ok("el JS de la página no lleva precios escritos", !/precio:\s*\d/.test(h));

console.log(`\n${bien} pasadas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);

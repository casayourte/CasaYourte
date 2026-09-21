/* ═══════════════════════════════════════════════════════════════
   PRUEBAS · los dos modos de la hoja de reportes

   Se corre con node a secas, sin npm y sin navegador:

       node pruebas-reportes.mjs

   No prueba una copia de la lógica: extrae el MODOS_REPORTE REAL de
   nucleo.js y lo corre. Si alguien lo toca, esto se entera.

   Lo que de verdad cuida, y es el motivo por el que existe: que una
   falla y un pedido NO terminen escribiendo el mismo campo. Es un
   error que no rompe nada visible —el formulario anda, el documento
   se guarda— y que sólo se descubre meses después, leyendo reportes
   donde un pedido dice tener «gravedad: molesta». Este ecosistema ya
   lo pagó dos veces: `perm` contra `permiso` en el menú, y la palabra
   «bóveda» nombrando dos cosas.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));
const nucleo = readFileSync(join(aca, "nucleo.js"), "utf8");
const sw = readFileSync(join(aca, "sw.js"), "utf8");

// ── Se extrae el objeto real, no una copia ────────────────
const desde = nucleo.indexOf("const MODOS_REPORTE = {");
const hasta = nucleo.indexOf("\n};", desde);
if (desde < 0 || hasta < 0) throw new Error("no se encontró MODOS_REPORTE en nucleo.js");
const MODOS = eval("(" + nucleo.slice(desde + "const MODOS_REPORTE = ".length, hasta + 2) + ")");

let bien = 0, mal = 0;
const ok = (t, c) => { if (c) { bien++; console.log("  ok  " + t); }
                       else { mal++; console.log("  MAL " + t); } };
const titulo = (t) => console.log("\n" + t);

titulo("1 · existen los dos modos, y sólo los que se esperan");
ok("está 'falla'", !!MODOS.falla);
ok("está 'pedido'", !!MODOS.pedido);
ok("no hay un tercero sin querer", Object.keys(MODOS).length === 2);

titulo("2 · LA PRUEBA QUE IMPORTA: no comparten el campo");
ok("una falla escribe 'gravedad'", MODOS.falla.campo === "gravedad");
ok("un pedido escribe 'urgencia'", MODOS.pedido.campo === "urgencia");
ok("y no son el mismo campo", MODOS.falla.campo !== MODOS.pedido.campo);

titulo("3 · cada modo trae todo lo que la hoja le va a pedir");
const CLAVES = ["titulo","que","quePh","esp","espPh","seg","campo","ops","falta","gracias"];
for (const [nombre, m] of Object.entries(MODOS)) {
  const faltan = CLAVES.filter((k) => m[k] === undefined || m[k] === "");
  ok(`${nombre}: no le falta ninguna clave${faltan.length ? " (faltan: " + faltan + ")" : ""}`,
     faltan.length === 0);
}

titulo("4 · las opciones de la tira de botones");
for (const [nombre, m] of Object.entries(MODOS)) {
  ok(`${nombre}: son al menos dos`, Array.isArray(m.ops) && m.ops.length >= 2);
  ok(`${nombre}: cada una tiene valor y texto`,
     m.ops.every((o) => Array.isArray(o) && o.length === 2 && o[0] && o[1]));
  ok(`${nombre}: los valores no se repiten`,
     new Set(m.ops.map((o) => o[0])).size === m.ops.length);
}

titulo("5 · los textos de los dos modos son distintos de verdad");
ok("el título no es el mismo", MODOS.falla.titulo !== MODOS.pedido.titulo);
ok("la primera pregunta no es la misma", MODOS.falla.que !== MODOS.pedido.que);
ok("el aviso de falta no es el mismo", MODOS.falla.falta !== MODOS.pedido.falta);

titulo("6 · lo que nucleo.js escribe en la base");
ok("guarda el campo `tipo`", /\btipo:\s*CY\._modoReporte\b/.test(nucleo));
ok("el campo de la tira sale del modo, no está clavado",
   /\[m\.campo\]:\s*hoja\.querySelector/.test(nucleo));
ok("ya no escribe `gravedad:` fijo",
   !/^\s*gravedad:\s*hoja\.querySelector/m.test(nucleo));
ok("el estado nace en 'nuevo', que es lo que exige la regla",
   /estado:\s*'nuevo'/.test(nucleo));
ok("el uid sale de la sesión y no de un campo del formulario",
   /uid:\s*u\.uid\s*\|\|\s*''/.test(nucleo));

titulo("7 · la entrada existe en el ÚNICO lugar que dibuja la navegación");
ok("hay un botón 'cy-pedir'", /id="cy-pedir"/.test(nucleo));
ok("y llama al modo pedido", /CY\.reportar\('pedido'\)/.test(nucleo));
ok("el de la falla quedó explícito", /CY\.reportar\('falla'\)/.test(nucleo));

titulo("8 · los sellos, que es lo que hace que esto llegue a un teléfono");
const sello = (nucleo.match(/CY\.VERSION = 'nucleo-(\d+)'/) || [])[1];
ok("nucleo.js tiene sello y es nucleo-20 o más nuevo", Number(sello) >= 20);
ok("nucleo.js está en el SHELL del service worker", /'\.\/nucleo\.js'/.test(sw));
const v = (sw.match(/const VERSION = 'cy-shell-v(\d+)'/) || [])[1];
ok("y la VERSION del sw subió a v41 o más", Number(v) >= 41);

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

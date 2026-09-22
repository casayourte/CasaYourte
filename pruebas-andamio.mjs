/* ═══════════════════════════════════════════════════════════════
   PRUEBAS · el andamio del taller

       node pruebas-andamio.mjs

   Sin npm y sin navegador. Extrae el ÁRBOL real de `taller.html` y lo
   corre, y comprueba sobre el texto de los archivos las garantías que,
   al romperse, no rompen nada visible:

   · que estas páginas NO se puedan alcanzar desde el sitio público,
   · que se pueda navegar aunque el JavaScript de la navegación falle,
   · y que la transición no se le imponga a quien pidió menos movimiento.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));
const T = readFileSync(join(aca, "taller.html"), "utf8");
const portada = readFileSync(join(aca, "index.html"), "utf8");
const editor = readFileSync(join(aca, "editar.html"), "utf8");

const trozo = (txt, desde, hasta) => txt.slice(txt.indexOf(desde), txt.indexOf(hasta, txt.indexOf(desde)));
const ARBOL = eval("(" + trozo(T, "var ARBOL = [", "];").replace("var ARBOL = ", "") + "])");
const SEMILLA = eval("(" + trozo(T, "var SEMILLA = {", "};").replace("var SEMILLA = ", "") + "})");

let bien = 0, mal = 0;
const ok = (t, c) => { if (c) { bien++; console.log("  ok  " + t); }
                       else { mal++; console.log("  MAL " + t); } };
const titulo = (t) => console.log("\n" + t);

titulo("1 · el árbol es el que se pidió");
ok("cuatro páginas hijas", ARBOL.length === 4);
ok("dos nietas en cada una", ARBOL.every((n) => n.hijas.length === 2));
ok("doce páginas en total", ARBOL.length + ARBOL.reduce((a, n) => a + n.hijas.length, 0) === 12);

titulo("2 · los identificadores");
const todos = ARBOL.flatMap((n) => [n.id, ...n.hijas]);
ok("no se repite ninguno", new Set(todos).size === todos.length);
ok("todos tienen nombre de arranque", todos.every((id) => !!SEMILLA[id]));
ok("y no sobra ninguna semilla", Object.keys(SEMILLA).length === todos.length);
ok("son cortos y sin caracteres raros: van adentro de la clave del texto",
   todos.every((id) => /^[a-z][a-z0-9]{0,3}$/.test(id)));

titulo("3 · LO QUE NO TIENE QUE PASAR: llegar acá desde el sitio público");
/* El andamio se alcanza SÓLO desde la barra del taller, que se dibuja dentro
   de `if (TALLER)`. Si un enlace se escapara fuera de ese bloque, estas
   páginas a medio escribir quedarían colgando del sitio de verdad. */
const bloqueTaller = trozo(portada, "if (TALLER) {", "function valor(v)");
ok("la portada enlaza el andamio SÓLO dentro del bloque del taller",
   bloqueTaller.includes("taller.html")
   && portada.split("taller.html").length - 1 === bloqueTaller.split("taller.html").length - 1);
ok("el andamio lleva noindex", /name="robots"[^>]*noindex/.test(T));
ok("y dice con todas las letras que no es el sitio",
   /NO es casayourte\.com/.test(T));

titulo("4 · se puede navegar aunque falle el JavaScript de la navegación");
/* Los enlaces son `href` de verdad y la navegación sin recarga es un adorno
   encima. Si `startViewTransition` o `pushState` no existieran, o el listener
   fallara, el navegador sigue el enlace y la página carga igual. */
ok("las tarjetas son <a href>, no botones", /<a href="\?p=/.test(T));
ok("la vuelta al índice también", /href="\.\/taller\.html"/.test(T));
ok("si no hay pushState, el enlace navega solo",
   /if \(!window\.history \|\| !window\.history\.pushState\) return;/.test(T));
ok("y la transición es opcional: hay camino sin ella",
   /if \(document\.startViewTransition\)[\s\S]{0,80}else pintar\(\);/.test(T));

titulo("5 · la transición no se le impone a nadie");
ok("respeta prefers-reduced-motion", /prefers-reduced-motion:\s*reduce/.test(T));
const red = trozo(T, "@media (prefers-reduced-motion:reduce)", "</style>");
ok("y ahí apaga las tres: la entrada, las tarjetas y la view-transition",
   /\.env\{animation:none\}/.test(red) && /\.hijas a\{transition:none\}/.test(red)
   && /view-transition-(old|new)/.test(red));

titulo("6 · el vacío se dice, no se calla");
/* Una página en blanco no se distingue de una rota, y la gracia del andamio
   es que se vea dónde falta escribir. */
ok("hay una clase para lo vacío", /\.vacio\{/.test(T));
ok("y los bloques sin texto la usan", /'<p class="bloque' \+ \(v \? '' : ' vacio'\)/.test(T));

titulo("7 · el contrato con el editor");
ok("expone window.CY_SITIO, el mismo nombre que index.html", /window\.CY_SITIO = \{/.test(T));
ok("con la misma version que el contrato del sitio",
   (T.match(/version: 2/) || []).length === 1 && /version:2|version: 2/.test(portada));
/* Lo que no aplica devuelve vacío en vez de faltar: un contrato con agujeros
   obliga a quien lo usa a preguntar dónde está parado. */
for (const k of ["GRUPOS", "aplicarOrden", "aplicarSecciones", "ids", "idsSecciones",
                 "ocultasAhora", "tituloDe"]) {
  ok(`responde a ${k}, aunque acá no aplique`, new RegExp(`\\b${k}\\s*:`).test(T));
}
ok("y puede repintar con textos nuevos sin recargar", /aplicarTextos: function/.test(T));

titulo("8 · el enganche en el editor");
ok("está en PAGS, que es donde se suma una página", /andamio: \{ archivo: "taller\.html"/.test(editor));
ok("usa data-i sin prefijo, igual que el sitio",
   /andamio: \{[^}]*attr: "data-i"[^}]*prefijo: ""/.test(editor));
ok("está marcado como SÓLO taller", /andamio: \{[^}]*soloTaller: true/.test(editor));
ok("su chip existe y arranca oculto", /data-p="andamio"[^>]*hidden/.test(editor));
ok("y si alguien está ahí y pasa a «En vivo», se lo devuelve al sitio",
   /soloTaller && !enTaller\(\)\) \{ pag = "index"/.test(editor));

titulo("9 · el sello");
const sello = (T.match(/var SELLO = "andamio-(\d+)"/) || [])[1];
ok("existe y se ve en la página", Number(sello) >= 1 && /esc\(SELLO\)/.test(T));

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

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
const ARBOL = eval("(" + trozo(T, "var ARBOL_BASE = [", "];").replace("var ARBOL_BASE = ", "") + "])");
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

/* ── LO QUE ENTRÓ CON `andamio-2` ──────────────────────────────
   Nombrar, ordenar, repartir el contenido y enlazar. Lo pidió Mauro el
   24-sep-2026 y las cuatro cosas tienen la misma trampa: fallan callado.
   Una página que desaparece de una lista, un bloque que se muda y deja su
   texto en francés en la página vieja, un botón que lleva a ninguna parte:
   nada de eso tira un error. */

titulo("10 · el orden sale del documento, no del archivo");
ok("`orden` es el mismo mapa donde ya viven los grupos del sitio",
   /orden\.pgs/.test(T) && /"pg_" \+ id/.test(T));
ok("una lista guardada NO puede hacer desaparecer una página (§3.35)",
   /if \(lista\.indexOf\(id\) < 0\) lista\.push\(id\)/.test(T));
ok("y lo mismo con las nietas", /if \(hijas\.indexOf\(h\) < 0\) hijas\.push\(h\)/.test(T));
ok("el árbol se rearma en cada pintado, no una sola vez",
   /function pintar\(\) \{\s*\n\s*armarArbol\(\);/.test(T));

titulo("11 · el enlace: el rótulo es texto, el destino no");
ok("el destino vive en `enlaces`, fuera del diccionario", /ENLACES\[k\]/.test(T));
ok("el rótulo vive en el diccionario y se traduce", /"pg\." \+ id \+ "\.l" \+ p\[1\]/.test(T));
/* Si el destino viajara adentro del rótulo, traducir el botón al francés
   podría romper adónde lleva. */
ok("el `data-i` va en un hijo y no en el <a>",
   /'<a class="salto"[\s\S]{0,200}<span data-i="/.test(T));
ok("un destino que ya no existe NO dibuja el botón",
   /if \(!ES_PAGINA\(destino\)\) return;/.test(T));

titulo("12 · la vuelta se DEDUCE, no se guarda");
ok("hay una función que la calcula recorriendo los enlaces", /function vueltasA\(id\)/.test(T));
ok("no se guarda ningún campo de vuelta", !/vuelta[s]?\s*[:=]\s*\{/.test(T));
ok("y no se repite el mismo origen dos veces", /vistos\[origen\]/.test(T));

titulo("13 · el editor recablea cuando el andamio se repinta");
/* El andamio se dibuja con `innerHTML`: cada cambio de página tira todas las
   marcas de edición. Sin este aviso, tocar una tarjeta adentro del editor
   dejaba la página siguiente intocable — y parecía que el editor se rompió. */
ok("el andamio avisa después de pintar", /CY_SITIO\.alPintar\(id\)/.test(T));
ok("y no lo puede tumbar el editor", /try \{ window\.CY_SITIO\.alPintar/.test(T));
ok("el editor engancha ese aviso y recablea", /c0\.alPintar = \(\) => \{ cablear\(\)/.test(editor));

titulo("14 · las claves del andamio pueden nacer al escribirlas");
/* El 24-sep-2026 `sitio/taller` tenía CERO claves `pg.*`: las doce páginas se
   veían y no se podía tocar ni un nombre. `cablear()` sólo vuelve tocable una
   clave que YA exista en el idioma fuente. */
ok("el editor hace la excepción, y sólo para `pg.`",
   /!\(esAndamio\(\) && \/\^pg\\\.\/\.test\(clave\)\)/.test(editor));

titulo("15 · `enlaces` viaja con el contenido");
/* `setDoc` reemplaza el documento entero: un campo que no viaje se pierde. */
ok("se lee al cargar el taller", /enlaces: \{ \.\.\.\(x\.enlaces \|\| \{\}\) \}/.test(editor));
ok("se escribe al guardar", /enlaces: CONT\.enlaces \|\| \{\}/.test(editor));
ok("y el contador lo mira, o Guardar no se encendería",
   /ORIG\.enlaces \|\| \{\}\), \.\.\.\(CONT\.enlaces/.test(editor));

titulo("16 · los bloques se cuentan mirando TODOS los idiomas");
/* Un bloque escrito sólo en francés existe igual. Contarlo de menos lo haría
   desaparecer de la página en español, con su texto adentro y sin avisar. */
const cuenta = trozo(T, "function cuantosBloques(id)", "\n  }");
ok("recorre los idiomas, no sólo el que se está mirando",
   /Object\.keys\(T\)\.forEach/.test(cuenta) && !/T\[LANG\] \|\| \{\}\)\.forEach/.test(cuenta));
ok("y hay un piso, para que el andamio no se vea vacío", /MINIMO_BLOQUES/.test(T));

titulo("17 · las operaciones sobre el contenido, corridas de verdad");
/* Acá no se mira el texto del archivo: se EXTRAEN las funciones reales del
   editor y se corren. Mover un bloque de página es la operación que, si sale
   mal, pierde lo único que no se puede reconstruir. */
function sacar(txt, nombre) {
  const i = txt.indexOf("function " + nombre + "(");
  if (i < 0) throw new Error("no se encontró " + nombre);
  let j = txt.indexOf("{", i), n = 0;
  for (let k = j; k < txt.length; k++) {
    if (txt[k] === "{") n++;
    else if (txt[k] === "}") { n--; if (!n) return txt.slice(i, k + 1); }
  }
  throw new Error("no cierra " + nombre);
}

let CONT, avisos;
const IDIOMAS = () => ["es", "fr"];
const aviso = (t) => avisos.push(t);
let confirmar = true;
const confirm = () => confirmar;
const refrescarAndamio = () => {};
const paginasAndamio = () => {
  const l = [{ id: "", nombre: "índice", nivel: 0 }];
  ["a", "b", "c"].forEach((x) => {
    l.push({ id: x, nombre: x, nivel: 1 });
    l.push({ id: x + "1", nombre: x + "1", nivel: 2 });
    l.push({ id: x + "2", nombre: x + "2", nivel: 2 });
  });
  return l;
};
const padreDe = (id) => (/^[a-z]\d$/.test(id) ? id[0] : "");
const contrato = () => ({
  bloquesDe: (p) => {
    let max = 3;
    IDIOMAS().forEach((l) => Object.keys(CONT[l] || {}).forEach((k) => {
      const m = new RegExp("^pg\\." + p + "\\.b(\\d+)$").exec(k);
      if (m) max = Math.max(max, Number(m[1]));
    }));
    return max;
  },
  // El primer hueco libre, que es lo que promete el contrato del andamio.
  proximoBloque: function (p) {
    const cuantos = this.bloquesDe(p);
    for (let n = 1; n <= cuantos; n++) {
      if (IDIOMAS().every((l) => (CONT[l] || {})["pg." + p + ".b" + n] === undefined)) return n;
    }
    return cuantos + 1;
  },
  proximoEnlace: (p) => {
    let max = 0;
    Object.keys(CONT.enlaces || {}).forEach((k) => {
      if (k.split(".")[0] === p) max = Math.max(max, Number(k.split(".")[1]) || 0);
    });
    return max + 1;
  },
});
const lista_ = (v) => String(v || "").split(",").map((x) => x.trim()).filter(Boolean);

const fuente = ["textoBloque", "compactarBloques", "moverBloqueA", "moverBloqueEn",
                "enlazarHacia", "quitarEnlace", "moverPagina"]
  .map((n) => sacar(editor, n)).join("\n");
const ops = new Function("CONT_", "IDIOMAS", "aviso", "confirm", "refrescarAndamio",
  "paginasAndamio", "padreDe", "contrato", "lista_", "paginaAbierta", "pintarPaginas",
  fuente + "\n; var CONT = CONT_;"
  + "\n return { compactarBloques, moverBloqueA, moverBloqueEn, enlazarHacia, quitarEnlace, moverPagina,"
  + " ver: () => CONT };");

let abierta = "";
function montar(datos, pagina) {
  CONT = JSON.parse(JSON.stringify(datos));
  avisos = []; abierta = pagina || "";
  return ops(CONT, IDIOMAS, aviso, confirm, refrescarAndamio, paginasAndamio, padreDe,
             contrato, lista_, () => abierta, () => {});
}

let o = montar({
  es: { "pg.a.b1": "uno", "pg.a.b2": "dos", "pg.a.b3": "tres" },
  fr: { "pg.a.b1": "un", "pg.a.b2": "deux", "pg.a.b3": "trois" },
  orden: {}, enlaces: {},
});
o.moverBloqueA("a", 2, "b1");
ok("el bloque llega al destino en los dos idiomas",
   CONT.es["pg.b1.b1"] === "dos" && CONT.fr["pg.b1.b1"] === "deux");
ok("y se va del origen en los dos", CONT.es["pg.a.b2"] !== "dos" && CONT.fr["pg.a.b2"] !== "deux");
ok("el origen se compacta: no queda hueco",
   CONT.es["pg.a.b1"] === "uno" && CONT.es["pg.a.b2"] === "tres" && CONT.es["pg.a.b3"] === undefined);
ok("y el francés queda igual de compactado",
   CONT.fr["pg.a.b1"] === "un" && CONT.fr["pg.a.b2"] === "trois" && CONT.fr["pg.a.b3"] === undefined);
ok("no se perdió ni un texto",
   ["uno", "tres", "dos"].every((x) => JSON.stringify(CONT.es).includes(x)));

o = montar({ es: { "pg.a.b1": "uno" }, fr: { "pg.a.b1": "un", "pg.a.b2": "seulement en français" },
             orden: {}, enlaces: {} });
o.moverBloqueA("a", 2, "c");
ok("un bloque que sólo existe en francés también se muda",
   CONT.fr["pg.c.b1"] === "seulement en français" && CONT.fr["pg.a.b2"] === undefined);
ok("y el español, que no lo tenía, no se inventa nada", CONT.es["pg.c.b1"] === undefined);

o = montar({ es: { "pg.a.b1": "uno", "pg.a.b2": "dos" }, fr: {}, orden: {}, enlaces: {} });
o.moverBloqueEn("a", 1, 1);
ok("subir y bajar intercambia los dos", CONT.es["pg.a.b1"] === "dos" && CONT.es["pg.a.b2"] === "uno");

o = montar({ es: { "pg.a.b1": "uno" }, fr: {}, orden: {}, enlaces: {} });
o.moverBloqueA("a", 3, "b");
ok("mudar un bloque vacío no rompe y lo dice", avisos.some((x) => /nada escrito/.test(x)));
ok("y no dejó basura en el destino", CONT.es["pg.b.b1"] === undefined);

o = montar({ es: {}, fr: {}, orden: {}, enlaces: {} });
o.enlazarHacia("c2");
ok("enlazar sin estar parado en una página lo dice",
   avisos.some((x) => /Entrá primero/.test(x)) || Object.keys(CONT.enlaces).length === 0);

// Y ahora parado en la página `a`.
let o2 = montar({ es: {}, fr: {}, orden: {}, enlaces: {} }, "a");
o2.enlazarHacia("c2");
ok("el enlace se guarda fuera del diccionario", CONT.enlaces["a.1"] === "c2");
ok("y el rótulo adentro, en los dos idiomas",
   CONT.es["pg.a.l1"] && CONT.fr["pg.a.l1"]);
ok("el rótulo nace escrito: un botón vacío no se puede tocar con el pulgar",
   String(CONT.es["pg.a.l1"]).trim().length > 2);
o2.enlazarHacia("b1");
ok("el segundo enlace no pisa al primero",
   CONT.enlaces["a.1"] === "c2" && CONT.enlaces["a.2"] === "b1");
o2.quitarEnlace("a", 1);
ok("sacar un enlace se lleva el destino y el rótulo",
   CONT.enlaces["a.1"] === undefined && CONT.es["pg.a.l1"] === undefined
   && CONT.fr["pg.a.l1"] === undefined);
ok("y no toca el otro", CONT.enlaces["a.2"] === "b1");

o = montar({ es: {}, fr: {}, orden: {}, enlaces: {} });
o.moverPagina("b", -1);
ok("mover una sección escribe la lista ENTERA, no sólo lo movido",
   CONT.orden.pgs === "b,a,c");
o.moverPagina("a2", -1);
ok("y las nietas van a su propio campo", CONT.orden.pg_a === "a2,a1");
// `b` ya quedó primera: subirla otra vez no tiene que hacer nada.
o.moverPagina("b", -1);
ok("no se puede mover más allá del borde", CONT.orden.pgs === "b,a,c");
o.moverPagina("c", 1);
ok("ni más allá del otro borde", CONT.orden.pgs === "b,a,c");
o.moverPagina("a", -1);
ok("y una que sí se puede mover, se mueve", CONT.orden.pgs === "a,b,c");

titulo("18 · mudar un bloque tiene que poder BORRAR una clave");
/* `aplicarTextos` suma claves porque lo que llega de la base puede ser
   parcial. El editor, en cambio, manda el contenido entero: mezclando, el
   bloque mudado se quedaba también en la página de donde salió hasta
   recargar — o sea que la pantalla decía que la mudanza no había pasado. */
ok("el andamio ofrece un camino que reemplaza", /reemplazarTextos: function/.test(T));
ok("y ése SÍ pisa el diccionario entero", /T = nuevo;/.test(T));
ok("`aplicarTextos` sigue mezclando, que es lo que necesita la base",
   /aplicarTextos: function[\s\S]{0,400}T\[l\]\[k\] = d\[l\]\[k\]/.test(T));
ok("el editor usa el que reemplaza", /c\.reemplazarTextos\(porIdioma/.test(editor));
ok("y tiene camino para un taller.html viejo", /else if \(c && typeof c\.aplicarTextos/.test(editor));

titulo("19 · el sello");
const sello = (T.match(/var SELLO = "andamio-(\d+)"/) || [])[1];
ok("existe y se ve en la página", Number(sello) >= 1 && /esc\(SELLO\)/.test(T));

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

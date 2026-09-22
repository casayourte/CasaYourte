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
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));
const nucleo = readFileSync(join(aca, "nucleo.js"), "utf8");
const sw = readFileSync(join(aca, "sw.js"), "utf8");
const editor = readFileSync(join(aca, "editar.html"), "utf8");
const estilos = readFileSync(join(aca, "estilos.css"), "utf8");
const portada = readFileSync(join(aca, "index.html"), "utf8");

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
const CLAVES = ["titulo","que","quePh","esp","espPh","seg","campo","ops","falta","gracias","img","nota"];
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
ok("nucleo.js tiene sello y es nucleo-23 o más nuevo", Number(sello) >= 23);
ok("nucleo.js está en el SHELL del service worker", /'\.\/nucleo\.js'/.test(sw));
const v = (sw.match(/const VERSION = 'cy-shell-v(\d+)'/) || [])[1];
ok("y la VERSION del sw subió a v45 o más", Number(v) >= 45);
const se = (editor.match(/EDITOR = "editar-(\d+)"/) || [])[1];
ok("editar.html subió a editar-10 o más", Number(se) >= 10);
ok("editar.html y estilos.css también están en el SHELL",
   /'\.\/editar\.html'/.test(sw) && /'\.\/estilos\.css'/.test(sw));

titulo("9 · la nota dice quién contesta — es un requisito, no un detalle");
/* Se pidió explícitamente que quien manda un pedido sepa ANTES de mandarlo
   que lo que vuelve lo escribe una IA, y por dónde seguir cuando el ida y
   vuelta no alcanza. Eso no es una cadena decorativa: si alguien la acorta
   «para que entre mejor», la persona se entera después. */
const np = MODOS.pedido.nota.toLowerCase();
ok("avisa que el cambio lo hace una IA", /\bia\b|inteligencia artificial/.test(np));
ok("nombra a Claude Code, que es quién lo recoge", /claude/.test(np));
ok("dice que se ejecuta en el TALLER y no en el sitio", /taller/.test(np));
ok("avisa que NO es un chat en vivo", /no es un chat en vivo/.test(np));
ok("manda a coordinar con Mauro", /mauro/.test(np));
ok("la de una falla es distinta", MODOS.falla.nota !== MODOS.pedido.nota);

titulo("10 · la imagen");
ok("se sube ANTES de escribir el documento",
   nucleo.indexOf("CY.subirImagen") < nucleo.indexOf("fb.addDoc"));
ok("el identificador va al documento", /^\s*imagen,$/m.test(nucleo));
ok("se guarda vacío y no ausente cuando no hay",
   /let imagen = '';/.test(nucleo));
ok("se limpia al abrir, al quitar y al enviar (la hoja se reusa)",
   (nucleo.match(/quitarImagen\(hoja\)/g) || []).length >= 3);
ok("el blob se revoca, si no es memoria que no vuelve",
   /revokeObjectURL/.test(nucleo));

titulo("10 bis · DOS inputs, que es lo que ningún input solo resuelve");
/* Con `accept="image/*"` a secas el sistema decide qué ofrecer, y en iPad
   —sobre todo dentro de la PWA— abre el explorador SIN ofrecer la cámara.
   `capture` hace lo contrario: fuerza cámara y esconde los archivos. Casa
   Verde pagó esto en julio de 2026. Si alguien «simplifica» a un input solo,
   en la mitad de los teléfonos deja de poder sacar una foto — y no falla
   nada, simplemente no aparece la opción. Por eso tiene prueba. */
ok("hay un input de CÁMARA, con capture",
   /id="rep-img-cam-in"[^>]*capture="environment"/.test(nucleo));
ok("y uno de ARCHIVOS, sin capture",
   /id="rep-img-gal-in"(?![^>]*capture)[^>]*accept="image\/\*"/.test(nucleo));
ok("los dos aceptan sólo imágenes",
   (nucleo.match(/id="rep-img-(cam|gal)-in"[^>]*accept="image\/\*"/g) || []).length === 2);
ok("hay un botón para cada uno",
   /id="rep-img-cam"/.test(nucleo) && /id="rep-img-gal"/.test(nucleo));
ok("un solo manejador para los dos: lo que cambia es qué ofrece el sistema",
   (nucleo.match(/addEventListener\('change', alElegir\)/g) || []).length === 2);
ok("al limpiar se vacían LOS DOS, o uno vuelve a mostrar la foto vieja",
   /#rep-img-cam-in'\)\.value = ''/.test(nucleo) && /#rep-img-gal-in'\)\.value = ''/.test(nucleo));
ok("no quedó el input viejo de una sola vía", !/rep-img-arch/.test(nucleo));
/* Acotado a la hoja de reportes: `showModal` existe en otra parte del núcleo,
   legítimamente. Lo que no puede pasar es que ELEGIR una imagen abra una
   segunda hoja encima de ésta — dos hojas abiertas dejan dos capas en la pila
   del Atrás, y el primer Atrás cerraría la de abajo dejando la de arriba
   flotando sobre nada. Ese error ya está descrito en `CY.renderNav`. */
const bloqueImagen = nucleo.slice(nucleo.indexOf("const alElegir"),
                                  nucleo.indexOf("CY._hojaReporte = { tapa, hoja }"));
ok("elegir una imagen no abre una segunda hoja",
   bloqueImagen.length > 0 && !/showModal|\.click\(\)[\s\S]*showModal/.test(bloqueImagen));

titulo("11 · el globo del editor");
ok("existe en editar.html", /id="globo"/.test(editor));
ok("abre la hoja en modo pedido", /CY\.reportar\("pedido"\)/.test(editor));
ok("tiene su clase en estilos.css", /\.cy-globo\{/.test(estilos));
ok("dibuja un SVG y no depende de Material Icons",
   /cy-globo[\s\S]{0,400}<svg/.test(editor) && !/cy-globo[\s\S]{0,400}material-icons/.test(editor));
ok("dice para qué es, también a un lector de pantalla",
   /id="globo"[\s\S]{0,200}aria-label="Pedir un cambio"/.test(editor));

titulo("12 · LO QUE NO TIENE QUE PASAR: el globo en el sitio público");
/* `index.html` es la página que ve cualquiera, sin sesión y sin SDK. Escribir
   un pedido pide sesión activa, así que un globo ahí sería un botón que falla
   siempre — y meterle sesión a la portada desharía lo que aseguró `init-2`. */
ok("no hay globo en index.html", !/cy-globo|id="globo"/.test(portada));
ok("index.html sigue sin importar el SDK de Firebase al nivel superior",
   !/^import .*gstatic/m.test(portada));

titulo("13 · el contexto del reporte");
ok("nucleo lo pide de forma opcional", /CY\.contextoReporte/.test(nucleo));
ok("y un contexto roto no impide mandar", /catch \(e\) \{ \/\* un contexto roto/.test(nucleo));
ok("el editor dice si mira el taller o el sitio en vivo",
   /contextoReporte = \(\) => \(enTaller\(\) \? "taller" : "en vivo"\)/.test(editor));

titulo("14 · QUE PARSEE COMO MÓDULO, que es como lo carga el navegador");
/* LA PRUEBA QUE FALTABA, y su ausencia costó el panel entero el 22-sep-2026.
   `node --check archivo.js` parsea como SCRIPT. El navegador carga `nucleo.js`
   con `<script type="module">`, o sea como MÓDULO, y las dos gramáticas no son
   la misma: un acento grave suelto adentro de un template literal cerraba la
   cadena, el módulo no parseaba, `CY` quedaba sin definir y NINGÚN botón del
   panel enganchaba. La pantalla de login se veía perfecta y Entrar no hacía
   nada — que es el peor de los síntomas, porque no parece un error de sintaxis.

   `node --check` daba verde. Por eso esta prueba no mira el texto: le pide a
   node que lo parse de verdad, con la gramática correcta. */
const comoModulo = (nombre, src) => {
  try {
    execFileSync(process.execPath, ["--input-type=module", "--check"],
                 { input: src, stdio: ["pipe", "ignore", "pipe"] });
    return "";
  } catch (e) { return String(e.stderr || e).split("\n").find((l) => /Error/.test(l)) || "no parsea"; }
};
for (const [nombre, src] of [["nucleo.js", nucleo], ["editar.html (su módulo)",
      (editor.match(/<script[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/) || [])[1] || ""]]) {
  const err = comoModulo(nombre, src);
  ok(`${nombre} parsea como módulo${err ? " — " + err : ""}`, !err);
}

titulo("15 · y el acento grave que lo causó, donde no puede estar");
/* El comentario que rompió todo vive DENTRO del template literal de la hoja.
   La prueba de arriba ya lo atraparía, pero ésta dice POR QUÉ falla, que es la
   diferencia entre arreglarlo en un minuto y buscarlo media hora. */
/* Se ancla en `hoja rep` y no en `hoja.innerHTML`: eso último aparece antes,
   en `CY.elegirImagen`, y el trozo se comía medio archivo. */
const plantillaHoja = nucleo.slice(nucleo.indexOf("hoja.className = 'hoja rep'"),
                                   nucleo.indexOf("document.body.appendChild(tapa)"));
ok("el template de la hoja no lleva acentos graves adentro",
   (plantillaHoja.match(/`/g) || []).length === 2);

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

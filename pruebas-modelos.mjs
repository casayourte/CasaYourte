/* ═══════════════════════════════════════════════════════════════
   PRUEBAS · el cuadro de modelos y la medida del sitio

       node pruebas-modelos.mjs

   Sin npm y sin navegador.

   POR QUÉ EXISTE. Dos tandas del 24-sep-2026 y los cuatro errores que
   costaron, todos de la misma familia: cosas que NO ROMPEN NADA VISIBLE
   y por eso nadie las ve hasta que alguien mira los números.

   1 · Los rombos del fondo se dibujaban con `viewBox` y
       `preserveAspectRatio="none"`, o sea estirados hasta llenar la
       caja: ×1,125 en un teléfono y ×8 en un monitor, con los trazos
       ocho veces más gruesos. El dibujo aparecía, así que parecía andar.

   2 · `.hero-body` tenía `max-width:22ch` calculado con la letra del
       CUERPO —244 px— y adentro un h1 de 118 px. De 820 px para arriba
       el título se desbordaba y empujaba el encabezado a 1256 px, más
       alto que la pantalla.

   3 · Un `aspect-ratio` con `min-height` deja que el navegador
       recalcule el ANCHO desde el alto: la foto de portada se iba a
       684 px en una pantalla de 360 y aparecía barra horizontal.

   4 · El `data-i` de una pestaña puesto en el BOTÓN hacía que `paint()`
       le escribiera el textContent y borrara el <small> de adentro. El
       dato técnico desaparecía en el primer pintado.

   Ninguno de los cuatro tira un error en la consola.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));
const leer = (f) => readFileSync(join(aca, f), "utf8");
const index = leer("index.html");
const editar = leer("editar.html");

let bien = 0, mal = 0;
const ok = (t, c) => { if (c) { bien++; console.log("  ok  " + t); }
                       else { mal++; console.log("  MAL " + t); } };
const titulo = (t) => console.log("\n" + t);

// El código, sin los comentarios: un comentario nombra los errores viejos a
// propósito, y eso no puede hacer fallar ni pasar una prueba.
const sinComentarios = (s) => s.replace(/\/\*[\s\S]*?\*\//g, " ")
                               .replace(/(^|[\s;{}()])\/\/[^\n]*/g, "$1");
const codigo = sinComentarios(index);
const marcado = index.replace(/<!--[\s\S]*?-->/g, " ");

/* ── 1 · el grupo `mod` ─────────────────────────────────── */
titulo("1 · el grupo de modelos");
const grupo = /mod:\s*\{\s*prefijo:"m",\s*slot:"mod",\s*claves:\[([^\]]*)\]/.exec(codigo);
ok("GRUPOS trae `mod` con prefijo m y lugar de imagen mod", !!grupo);
const CLAVES = grupo ? grupo[1].split(",").map(x => x.trim().replace(/"/g, "")) : [];
ok("sus claves son p, s, t, b", JSON.stringify(CLAVES) === JSON.stringify(["p","s","t","b"]));

/* ── 2 · un nombre, un lugar, un archivo ────────────────── */
titulo("2 · cada bloque y su imagen llevan el mismo número");
const bloques = [...marcado.matchAll(/data-bloque="(m\d+)"([\s\S]*?)<\/article>/g)];
ok("hay al menos cuatro modelos en el HTML", bloques.length >= 4);
for (const [, id, cuerpo] of bloques) {
  const n = id.slice(1);
  ok(id + " usa el lugar de imagen mod" + n, cuerpo.includes('data-slot="mod' + n + '"'));
  const claves = [...cuerpo.matchAll(/data-i="([^"]+)"/g)].map(x => x[1]);
  ok(id + ": todas sus claves empiezan con " + id + ".",
     claves.length > 0 && claves.every(k => k.startsWith(id + ".")));
  ok(id + ": no usa ninguna clave fuera del grupo",
     claves.every(k => CLAVES.includes(k.split(".")[1])));
  // Un src a un archivo que no existe son 404 en una página pública.
  ok(id + ": su imagen nace con el pixel transparente, no con un archivo que falta",
     /src="data:image\/gif;base64,/.test(cuerpo));
}

/* ── 3 · el error del data-i en el botón ────────────────── */
titulo("3 · el rótulo de la pestaña va en un HIJO del botón");
const arma = codigo.slice(codigo.indexOf("function modelosTabs"),
                          codigo.indexOf("function modelosElegir"));
ok("se encontró modelosTabs", arma.length > 100);
ok("el botón NO lleva data-i propio", !/\bb\.dataset\.i\s*=/.test(arma));
ok("el rótulo corto va en un hijo con clase mod-tab-n", /n\.dataset\.i\s*=\s*id\s*\+\s*"\.p"/.test(arma));
ok("el dato técnico va en el <small>", /s\.dataset\.i\s*=\s*id\s*\+\s*"\.s"/.test(arma));

/* ── 4 · el orden dentro de paint() ─────────────────────── */
titulo("4 · las pestañas se arman antes de pintar y se cierran después");
const pinta = codigo.slice(codigo.indexOf("function paint(lang)"));
const iTabs = pinta.indexOf("modelosTabs()");
const iData = pinta.indexOf('querySelectorAll("[data-i]")');
const iFin  = pinta.indexOf("modelosFin()");
ok("modelosTabs() corre antes del pintado de [data-i]", iTabs > -1 && iData > -1 && iTabs < iData);
ok("modelosFin() corre después", iFin > iData);

/* ── 5 · la tira no puede vivir dentro del grupo ─────────── */
titulo("5 · la tira de pestañas está FUERA del contenedor del grupo");
// `aplicarOrden` borra todo hijo directo del grupo que no esté en la lista
// guardada: una tira adentro desaparecería en cuanto el editor guardara.
const conten = /<div class="mod-cuerpo" data-grupo="mod">([\s\S]*?)<\/div>\s*<\/div>/.exec(marcado);
ok("se encontró el contenedor del grupo", !!conten);
ok("la tira no está adentro", conten ? !conten[1].includes("mod-tabs") : false);
ok("la tira está antes, en el mismo bloque",
   marcado.indexOf('class="mod-tabs"') < marcado.indexOf('data-grupo="mod"'));

/* ── 6 · la sección se apaga sola si no hay contenido ────── */
titulo("6 · sin un solo modelo escrito, la sección no se muestra");
ok("existe la regla .mods-vacia{display:none}", /\.mods-vacia\{display:none\}/.test(index));
const fin = codigo.slice(codigo.indexOf("function modelosFin"), codigo.indexOf("function paint(lang)"));
ok("modelosFin la enciende y la apaga", /classList\.toggle\("mods-vacia"/.test(fin));
ok("la decide mirando si algún h3 tiene texto", /querySelector\("h3"\)/.test(fin));
// Si el archivo trajera textos semilla, el sitio PUBLICADO mostraría el cuadro
// con contenido que Mauro no aprobó. El taller los tiene; el archivo no.
const semillas = [...index.matchAll(/"(m\d+\.[psbt]|mo\.[a-z]+)"\s*:\s*"([^"]*)"/g)]
  .filter(x => x[2].trim());
ok("el archivo NO trae textos de modelos: el cuadro nace apagado", semillas.length === 0);

/* ── 7 · la semilla del editor ──────────────────────────── */
titulo("7 · un modelo nuevo nace con algo escrito en cada campo");
const sem = /mod:\s*\{\s*es:\{([^}]*)\},\s*\n?\s*fr:\{([^}]*)\}/.exec(editar);
ok("editar.html trae la semilla del grupo mod", !!sem);
if (sem) for (const k of CLAVES) {
  ok("la semilla en español trae `" + k + "`", new RegExp("\\b" + k + ":").test(sem[1]));
  ok("la semilla en francés trae `" + k + "`", new RegExp("\\b" + k + ":").test(sem[2]));
}

/* ── 8 · los rombos ─────────────────────────────────────── */
titulo("8 · los rombos se dibujan en píxeles y no estirados");
ok("no queda un solo preserveAspectRatio", !index.includes("preserveAspectRatio"));
const lat = codigo.slice(codigo.indexOf("function lattice(svg"), codigo.indexOf("const PASO="));
ok("lattice() no pone viewBox", !/setAttribute\("viewBox"/.test(lat));
ok("no se inventa un tamaño cuando la caja mide cero", /if\(W<2\|\|H<2\)\s*return/.test(lat));
ok("no volvió el piso Math.max que congelaba la geometría", !/Math\.max\(r\.(width|height)/.test(lat));
ok("se redibuja cuando cambia SU caja, no sólo la ventana", /new ResizeObserver/.test(codigo));

/* ── 9 · la medida del texto ────────────────────────────── */
titulo("9 · la medida va en la letra de cada texto, y hay un ancho máximo");
ok("existe --medida", /--medida:\s*\d+rem/.test(index));
ok("existe la sangría que centra sin recortar el fondo",
   /--sangria:\s*max\(var\(--pad\)/.test(index));
for (const r of [".wrap{", "header.hero{", ".foot{"]) {
  const i = index.indexOf(r);
  ok(r + " usa la sangría", i > -1 && index.slice(i, i + 260).includes("var(--sangria)"));
}
ok(".hero-body ya no mide en `ch` del cuerpo",
   !/\.hero-body\{[^}]*max-width:\d+ch/.test(index));
ok("el h1 lleva su propia medida", /h1\{[^}]*max-width:\d+ch/.test(index));

/* ── 10 · el recorte de la portada ──────────────────────── */
titulo("10 · la foto de portada");
const bleed = /\.bleed\{([^}]*)\}/.exec(index);
ok("se encontró la regla .bleed", !!bleed);
// aspect-ratio + min-height le deja al navegador recalcular el ANCHO desde el
// alto, y eso fue barra horizontal en una pantalla de 360.
ok("no combina aspect-ratio con min-height",
   bleed ? !(bleed[1].includes("aspect-ratio") && bleed[1].includes("min-height")) : false);
ok("su forma sale del ancho", bleed ? /height:clamp\([^)]*vw/.test(bleed[1]) : false);

/* ── 11 · el cuadro REEMPLAZA a la tabla de diámetros ───────── */
titulo("11 · el cuadro de modelos reemplaza a la tabla, sin un día sin ninguna");
/* Pedido de Mauro, 26-sep-2026: «en lugar de este cuadro, las fichas». La
   tabla no se borra: se esconde sola cuando el cuadro tiene contenido. Si se
   borrara del HTML, el sitio publicado —que todavía no tiene el cuadro—
   quedaría sin ninguna de las dos hasta que alguien lleve el taller. */
ok("la tabla está marcada como reemplazable por el cuadro",
   /<details[^>]*data-reemplaza-con="modelos"[^>]*>\s*<summary><span data-i="ui\.tabla">/.test(marcado));
ok("y existe la clase que la esconde", /\.reemplazado\{display:none!important\}/.test(index));
ok("modelosFin la esconde sólo si el cuadro tiene contenido Y está encendido",
   /const reemplaza = hay && !sec\.classList\.contains\("cy-oculta"\)/.test(fin));
ok("y la clase se aplica de verdad sobre la tabla",
   /querySelectorAll\('\[data-reemplaza-con="modelos"\]'\)\.forEach\(el=>\s*el\.classList\.toggle\("reemplazado", reemplaza\)\)/.test(fin));
ok("apagar secciones desde el editor lo recalcula, aunque no repinte",
   /function aplicarSecciones[\s\S]{0,700}typeof modelosFin === "function"\) modelosFin\(\)/.test(codigo));
ok("la tabla sigue en el archivo: el publicado la necesita hasta la mudanza",
   /data-rows="ficha\.rows"/.test(marcado));

console.log("\n" + bien + " bien · " + mal + " mal");
process.exit(mal ? 1 : 0);

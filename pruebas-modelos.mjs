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
ok("sus claves son p, s, t, b y c (la comparación)", JSON.stringify(CLAVES) === JSON.stringify(["p","s","t","b","c"]));

/* ── 2 · un nombre, un lugar, un archivo ────────────────── */
titulo("2 · cada bloque y su imagen llevan el mismo número");
const bloques = [...marcado.matchAll(/data-bloque="(m\d+)"([\s\S]*?)<\/article>/g)];
ok("hay tres modelos en el HTML: mongol, contemporánea, doble techo", bloques.length === 3);
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

/* ── 12 · dentro del editor ─────────────────────────────────── */
titulo("12 · en el editor el cuadro se decide DESPUÉS de escribir los textos");
/* Con ?edit=1 la página no busca su contenido: lo escribe el editor. El
   26-sep-2026 el cuadro se evaluaba una sola vez, con la página vacía, y se
   quedaba apagado —con la tabla a la vista— aunque `?taller=1` lo mostraba. */
const editar_ = leer("editar.html");
ok("la página ofrece los dos avisos en su contrato",
   /antesDeEscribir:\(\)=>\{ modelosTabs\(\); lineasArmar\(\);[^}]*\}/.test(codigo)
   && /despuesDeEscribir:\(\)=>\{ modelosFin\(\); lineasFin\(\);[^}]*\}/.test(codigo));
const pinta_ = editar_.slice(editar_.indexOf("function pintarEnIframe()"), editar_.indexOf("function aplicarImagenes()"));
const iA = pinta_.indexOf("c.antesDeEscribir()"), iE = pinta_.indexOf('querySelectorAll("[" + cfg.attr'), iD = pinta_.indexOf("c.despuesDeEscribir()");
ok("el editor avisa ANTES de escribir", iA > -1 && iA < iE);
ok("y DESPUÉS", iD > iE);

/* ── 13 · el cuadro de las líneas de trabajo ─────────────────── */
titulo("13 · las cuatro líneas: los mismos textos que sus páginas, y sin camino al andamio desde el publicado");
/* Pedido de Mauro, 27-sep-2026: después de los modelos, un cuadro que presente
   las cuatro páginas de Romina con una bajada y un enlace a cada una. */
ok("existe la sección, con su lugar para las tarjetas",
   /<section class="wrap" data-seccion="lineas">[\s\S]{0,400}data-lineas/.test(marcado));
ok("va inmediatamente después del cuadro de modelos",
   marcado.indexOf('data-seccion="lineas"') > marcado.indexOf('data-seccion="modelos"')
   && marcado.indexOf('data-seccion="lineas"') < marcado.indexOf('data-seccion="proceso"'));
// Del texto CRUDO: el filtro de comentarios de arriba confunde un `image/*` del
// marcado con el principio de un comentario y se come código de verdad.
const lin = index.slice(index.indexOf("const LINEAS_BASE"), index.indexOf("let modSel"));
ok("cada pestaña usa el nombre de SU página, no un texto propio", /n\.dataset\.i="pg\."\+id\+"\.t"/.test(lin));
ok("y la bajada de su página", /p\.dataset\.i="pg\."\+id\+"\.d"/.test(lin));
ok("el orden sale de orden.pgs, el mismo con el que se ordenan las páginas",
   /if\(orden && typeof orden\.pgs==="string"\) ORDEN_PGS=orden\.pgs;/.test(index));
ok("una lista guardada no hace desaparecer una línea (§3.35)",
   /LINEAS_BASE\.forEach\(x=>\{ if\(!l\.includes\(x\)\) l\.push\(x\); \}\)/.test(lin));
ok("sin ninguna línea con nombre, la sección se apaga", /classList\.toggle\("lineas-vacia",!hay\)/.test(lin));
/* 27-sep-2026: «la misma presentación en pestañas». Mismas clases que los
   modelos, para que los dos cuadros no se desparejen nunca. */
ok("las líneas son pestañas con las MISMAS clases que los modelos",
   /<div class="mod-tabs" role="tablist" aria-label="Formas de trabajo" data-lineas-tabs><\/div>\s*<div class="mod-cuerpo" data-lineas>/.test(marcado)
   && /b\.className="mod-tab"/.test(lin));
ok("se ve una sola línea por vez", /el\.hidden=!suyo/.test(lin) && /\.linea\[hidden\]\{display:none\}/.test(index));
ok("el escuchador del teclado se ata una sola vez", /if\(tira\.dataset\.teclado\) return;/.test(lin));
ok("el enlace SÓLO se pone si existe CY_ANDAMIO", /if\(window\.CY_ANDAMIO\) ir\.setAttribute\("href"/.test(lin));
ok("y CY_ANDAMIO se define SÓLO dentro del bloque del taller",
   /if \(TALLER\) \{[\s\S]{0,400}window\.CY_ANDAMIO = "\.\/taller\.html";/.test(index)
   && (index.match(/window\.CY_ANDAMIO\s*=/g) || []).length === 1);
ok("el archivo no trae textos semilla de líneas: el cuadro nace apagado",
   ![...index.matchAll(/"(ln\.[a-z]+|pg\.[a-z0-9]+\.[td])"\s*:\s*"([^"]+)"/g)].length);

/* ── 14 · la vista previa ───────────────────────────────────── */
titulo("14 · la vista previa muestra el taller como lo vería el público, ni más ni menos");
/* Pedido de Mauro, 27-sep-2026. Una vista previa que mostrara algo que el
   publicado no va a tener —los botones al andamio— sería una promesa falsa. */
ok("existe el modo, y sólo dentro del taller", /var VISTA = TALLER && \/\[\?&\]vista=1\/\.test\(location\.search\);/.test(index));
ok("en la vista previa NO se define la dirección del andamio",
   /if \(!VISTA\) window\.CY_ANDAMIO = "\.\/taller\.html";/.test(index));
ok("sin la barra bordó: la barra se arma sólo fuera de la vista previa",
   /if \(VISTA\) document\.addEventListener[\s\S]{0,900}else document\.addEventListener\("DOMContentLoaded", function \(\) \{\s*document\.body\.classList\.add\("cy-en-taller"\)/.test(index));
ok("pero con un botón para volver, que no deje la página sin salida", /v\.id = "cy-vista"; v\.href = conVista\(false\);/.test(index));
ok("la barra del taller ofrece «ver como publicado»", /ver como publicado<\/a>/.test(index) && /conVista\(true\)/.test(index));
ok("el noindex se pone igual: la vista previa tampoco es para Google",
   /if \(TALLER\) \{[\s\S]{0,1200}m\.name = "robots"; m\.content = "noindex, nofollow";/.test(index)
   && index.indexOf('m.name = "robots"') < index.indexOf("if (VISTA) document.addEventListener"));
ok("el editor tiene su botón, y avisa si hay cambios sin guardar",
   /id="vista-previa"/.test(editar_) && /u\.searchParams\.set\("vista", "1"\)/.test(editar_)
   && /if \(sucio\(\)\) aviso\("Ojo: la vista previa muestra lo GUARDADO/.test(editar_));

/* ── 15 · el ícono y el nombre en Google ───────────────────── */
titulo("15 · Google encuentra el ícono y el nombre del sitio");
/* 27-sep-2026: en los resultados salía el globito genérico y «casayourte.com»
   en vez de «CasaYourte». La portada no declaraba ningún ícono y en la raíz no
   había favicon.ico. */
ok("la portada declara el favicon.ico", /<link rel="icon" href="\/favicon\.ico"/.test(marcado));
ok("y un PNG de 192 px, múltiplo de 48 como pide Google", /<link rel="icon" href="\/favicon\.png" type="image\/png" sizes="192x192">/.test(marcado));
ok("los dos archivos existen en la raíz", (() => { try { leer("favicon.ico"); leer("favicon.png"); return true; } catch (e) { return false; } })());
const ldw = [...index.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
ok("declara el sitio con su nombre (WebSite · CasaYourte)", ldw.some((x) => x["@type"] === "WebSite" && x.name === "CasaYourte"));
ok("el logo del negocio NO es el blanco sobre transparente (en fondo claro no se ve)",
   ldw.some((x) => x["@type"] === "LocalBusiness" && x.logo && !/assets\/logo\.png/.test(x.logo)));
const robots = leer("robots.txt");
ok("robots.txt no bloquea los íconos", !/Disallow: \/favicon/.test(robots) && /Allow: \/favicon\.ico/.test(robots));

/* ── 16 · el sitio limpio ──────────────────────────────── */
titulo("16 · El sitio limpio: vistas que elige el dato, no el archivo");
/* 27-sep-2026, pedido de Mauro: menos contenido a la vista, la evolución
   técnica en pestañas y una página de obras con su pase automático. Todo
   eso lo PRUEBA el taller: si una vista dependiera del archivo y no del
   dato, el sitio publicado cambiaría el mismo día sin que nadie lo apruebe. */
const album = leer("album.html");
const codAlbum = sinComentarios(album);
ok("la trayectoria puede ir en pestañas, con su renglón «yr» como rótulo",
   /const PESTANAS = \{ traj:\{ rotulo:"yr" \}/.test(codigo));
ok("la vista sale de `orden.<grupo>_vista`, leída en aplicarOrden",
   /VISTAS\[g\]=String\(\(orden\|\|\{\}\)\[g\+"_vista"\]\|\|""\)/.test(codigo)
   && codigo.indexOf("VISTAS[g]=") > codigo.indexOf("function aplicarOrden"));
ok("sin «pestanas», el grupo vuelve a la vista de siempre (el editor puede cambiarlo en vivo)",
   /if\(VISTAS\[g\]!=="pestanas"\)\{[\s\S]{0,200}tira\.remove\(\)[\s\S]{0,200}el\.hidden=false/.test(codigo));
ok("la tira va AFUERA del grupo (aplicarOrden borra lo que no es un bloque)",
   /cont\.parentNode\.insertBefore\(tira,cont\)/.test(codigo));
ok("el rótulo va en un HIJO del botón, como en los modelos",
   /n\.dataset\.i=id\+"\."\+PESTANAS\[g\]\.rotulo/.test(codigo));
ok("un paso escondido en una pestaña se da por visto (si no, quedaba invisible)",
   /el\.classList\.add\("in"\)/.test(codigo.slice(codigo.indexOf("function pestanasArmar"))));
ok("se arma antes de escribir y se elige después, en paint() y en el contrato",
   /pestanasArmar\(\);[\s\S]{0,400}querySelectorAll\("\[data-i\]"\)[\s\S]*pestanasFin\(\);\s*\}/.test(codigo.slice(codigo.indexOf("function paint(lang)")))
   && /antesDeEscribir:\(\)=>\{[^}]*pestanasArmar\(\)/.test(codigo)
   && /despuesDeEscribir:\(\)=>\{[^}]*pestanasFin\(\)/.test(codigo));
ok("y se rehace con la estructura, al final de aplicarOrden",
   /pestanasArmar\(\);\s*\}\s*\/\*/.test(index.slice(index.indexOf("function aplicarOrden"))));
ok("la portada corta de álbumes la pide `orden.alb_vista`",
   /classList\.toggle\("alb-corta", \(orden\|\|\{\}\)\.alb_vista==="obras"\)/.test(codigo)
   && /\.alb-corta \.alb-lista\{display:none\}/.test(index));
ok("y en ella la portada NO baja las tiras (ni antes ni después de pedirlas)",
   (codigo.match(/seccion\.classList\.contains\("alb-corta"\)/g) || []).length === 2);
ok("el enlace al álbum conserva el taller y la vista previa",
   /\["taller","vista"\]\.forEach\(k=>\{ if\(aqui\.get\(k\)==="1"\) q\.set\(k,"1"\); \}\)/.test(codigo)
   && /enlazarAlbum\(idiomaInicial\(\)\)/.test(codigo));
ok("album.html lee el TALLER cuando se lo pide la dirección",
   /"sitio\/" \+ \(TALLER \? "taller" : "publicado"\)/.test(codAlbum));
ok("y en el taller no entra a Google y lleva el cartel",
   /if \(TALLER\) \{[\s\S]{0,160}noindex, nofollow/.test(codAlbum) && /id = "cy-taller"/.test(codAlbum));
ok("la vista de obras la elige el dato",
   /orden\.alb_vista === "obras"/.test(codAlbum) && /if \(OBRAS\) return pintarObras\(\)/.test(codAlbum));
ok("una obra es un álbum que no es producto (la yurta mongol no es un proyecto)",
   /albumes\.filter\(\(a\) => a\.tipo !== "producto"\)/.test(codAlbum));
ok("la descripción es el texto `alb.obra.<id>`, por idioma",
   /desc\.dataset\.t = "obra\." \+ a\.id/.test(codAlbum) && /d\["obra\." \+ a\.id\]/.test(codAlbum));
ok("el pase no corre en el editor, ni con el visor abierto, ni fuera de pantalla",
   /const debe = this\.visible && !this\.manual && !abiertas\[a\.id\] && !visorAbierto\s*&& !EDITANDO/.test(codAlbum));
ok("quien pidió menos movimiento recibe el pase quieto",
   /prefers-reduced-motion: reduce/.test(codAlbum) && /manual: QUIETO/.test(codAlbum));
ok("sin deslizar con el dedo (pelea con el desplazamiento de la página)",
   !/touchstart|pointerdown|swipe/i.test(codAlbum));
ok("el editor se entera cuando llegan las fotos",
   /window\.CY_SITIO = \{ version: 2, GRUPOS: \{\}/.test(codAlbum) && (codAlbum.match(/avisar\(\)/g) || []).length >= 4);
ok("el visor recibe el NOMBRE de la etapa, no el id (decía «undefined»)",
   /etapaTxt: etapa \? nombreEtapa\(etapa\) : d\.sinEtapa/.test(codAlbum)
   && !/nombreEtapa\(f\.etapa\)/.test(codAlbum));
// El orden del pase y el de la rejilla tienen que ser el mismo: la foto N del
// pase abre la foto base+N del visor. Se corre la función de verdad.
const trozo = (ini, fin) => codAlbum.slice(codAlbum.indexOf(ini), codAlbum.indexOf(fin, codAlbum.indexOf(ini)));
const fuente = trozo("const ETAPAS", "const idiomaDeducido") + trozo("const legible", "function nombreEtapa")
  + trozo("function enOrdenDeObra", "const CADA");
const enOrden = new Function("CY_IDIOMAS", fuente + "; return enOrdenDeObra;")({ fuente: () => "es" });
const prueba = { etapas: [{ id: "b", es: "b" }, { id: "a", es: "a" }],
  fotos: [{ id: 1, etapa: "a", orden: 1 }, { id: 2, etapa: "x", orden: 0 },
          { id: 3, etapa: "b", orden: 5 }, { id: 4, etapa: "b", orden: 2 }] };
ok("el pase va en el orden de la obra: etapa del álbum, después `orden`, lo suelto al final",
   enOrden(prueba).map((f) => f.id).join() === "4,3,1,2");
ok("que es el orden en que la rejilla las dibuja y las suma al visor",
   /const cats = etapasDe\(a\)[\s\S]{0,400}if \(sueltas\.length\) grupos\.push\(\[null, sueltas\]\)/.test(codAlbum)
   && /pintarEtapas\(etapas, a\)/.test(codAlbum) && /abrirVisor\(base \+ pase\.cur\)/.test(codAlbum));
ok("el editor deja escribir la descripción de una obra aunque no exista todavía",
   /!\/\^\(pg\|alb\\\.obra\)\\\.\/\.test\(clave\)/.test(editar));
ok("y vuelve a escribir y cablear cuando la página de álbumes se repinta",
   /if \(c0 && pag === "album"\) c0\.alPintar = \(\) => \{ pintarEnIframe\(\); cablear\(\); \}/.test(editar));
ok("mover un paso en pestañas rehace la tira",
   /cont\.classList\.contains\("en-pestanas"\)\) \{ pintarEnIframe\(\); cablear\(\); \}/.test(editar));

console.log("\n" + bien + " bien · " + mal + " mal");
process.exit(mal ? 1 : 0);

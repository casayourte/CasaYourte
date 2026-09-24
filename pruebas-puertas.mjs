/* ═══════════════════════════════════════════════════════════════
   PRUEBAS · las puertas del panel

       node pruebas-puertas.mjs

   Sin npm y sin navegador.

   POR QUÉ EXISTE. El 22-sep-2026 Romina tenía `albumes: true` y
   `taller: true` en su ficha, y aun así el panel le decía «Tu cuenta no
   tiene el permiso de álbumes» y el editor la echaba con «Hace falta rol
   de administrador o editor». El dato estaba bien; las pantallas
   mentían.

   La causa: `admin.html` tenía SU PROPIA copia de `puede()` que decidía
   por ROL —admin, editor, fotografo— del modelo viejo, y nunca miraba
   `permisos`; y `editar.html` cortaba por rol antes de llegar a su
   propia lógica del taller. Las dos son las únicas pantallas que NO
   pasan por `CY.arrancar`, que sí decide por permiso — y por eso fueron
   las dos que se quedaron atrás.

   Este error no rompe nada visible: la pantalla carga, no hay un solo
   mensaje en la consola, y simplemente le niega a alguien lo que su
   ficha dice que puede. Por eso tiene banco.
   ═══════════════════════════════════════════════════════════════ */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const aca = dirname(fileURLToPath(import.meta.url));
const leer = (f) => readFileSync(join(aca, f), "utf8");
const nucleo = leer("nucleo.js");
const paginas = readdirSync(aca).filter((f) => f.endsWith(".html"));

let bien = 0, mal = 0;
const ok = (t, c) => { if (c) { bien++; console.log("  ok  " + t); }
                       else { mal++; console.log("  MAL " + t); } };
const titulo = (t) => console.log("\n" + t);

/* Se mira sólo el código: un comentario puede nombrar el error viejo —de hecho
   lo hace, a propósito— sin que eso signifique que el código lo comete. */
const sinComentarios = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, "").replace(/<!--[\s\S]*?-->/g, "")
  .split("\n").map((l) => l.replace(/(^|[^:])\/\/.*$/, "$1")).join("\n");

titulo("1 · NADIE decide un permiso por el rol");
/* `admin` sí puede mirarse: está en `CY.esAdmin` y en `CY.puede`, y es por
   definición «los tiene todos». Lo que no puede volver es decidir por
   `editor` o `fotografo`, que son roles viejos sin permisos detrás. */
for (const f of paginas) {
  const src = sinComentarios(leer(f));
  const viejos = (src.match(/rol *[!=]== *["'](editor|fotografo)["']/g) || []);
  ok(`${f}: no decide por rol viejo${viejos.length ? " — " + viejos.join(", ") : ""}`,
     viejos.length === 0);
}

titulo("2 · el núcleo es el único que sabe decidir");
ok("CY.puede existe y mira `permisos`", /CY\.puede = function[\s\S]{0,400}permisos/.test(nucleo));
ok("y el administrador los tiene todos por definición",
   /CY\.puede = function[\s\S]{0,300}rol === 'admin'\) return true/.test(nucleo));
const admin = sinComentarios(leer("admin.html"));
ok("admin.html NO tiene una segunda copia de puede()",
   !/const puede = \(q\) => \{/.test(admin));
ok("admin.html delega en CY.puede", /const puede = \(q\) => CY\.puede\(q\)/.test(admin));

titulo("3 · el editor deja pasar a quien puede escribir ALGO");
const editor = sinComentarios(leer("editar.html"));
ok("no echa por rol", !/rol !== "admin" && /.test(editor) || !/Hace falta rol de/.test(editor));
ok("la puerta es contenido O taller",
   /!CY\.puede\("contenido"\) && !CY\.puede\("taller"\)/.test(editor));
/* La contradicción concreta que había: el propio archivo dice, tres líneas más
   abajo, que una cuenta sin permiso de publicar entra directo al taller. Con la
   puerta por rol eso no podía correr nunca. */
ok("y sigue existiendo el camino que esa puerta bloqueaba",
   /if \(!puedePublicar\(\)\) destino = "taller"/.test(editor));

titulo("4 · las pantallas que SÍ pasan por el núcleo no cambiaron");
for (const [f, permiso] of [["calculo.html", "calculo"], ["traducir.html", "contenido"]]) {
  ok(`${f} entra por CY.arrancar con su permiso`,
     new RegExp(`CY\\.arrancar\\([^)]*["']${permiso}["']`).test(leer(f)));
}
ok("usuarios.html sigue siendo sólo del administrador",
   /if \(!CY\.esAdmin\(\)\) \{ location\.replace/.test(leer("usuarios.html")));
ok("y CY.arrancar decide por permiso, no por rol",
   /if \(permiso && !CY\.puede\(permiso\)\)/.test(nucleo));

titulo("5 · la orientación del taller");
ok("existe el panel", /id="guia"/.test(leer("editar.html")));
ok("se le muestra SÓLO a quien no puede publicar",
   /if \(puedePublicar\(\)\) return;/.test(editor));
ok("nombra las cuatro cosas que no se deducen mirando",
   ["Secciones", "Andamio", "globo", "piloto"].every((x) => leer("editar.html").includes(x)));
ok("la marca de «ya la vi» va en localStorage y no en la ficha",
   /localStorage\.setItem\(VISTA_GUIA/.test(editor) && !/updateDoc[\s\S]{0,80}VISTA_GUIA/.test(editor));
ok("y si localStorage tira, el editor arranca igual",
   (editor.match(/try \{[^}]*localStorage[^}]*\} catch/g) || []).length >= 2);

titulo("6 · LAS TRES PUERTAS PONEN EL `uid`, o el servidor rechaza en silencio");
/* El documento `usuarios/{uid}` NO tiene un campo `uid`: el identificador es el
   nombre del documento. Una pantalla que guarde `d.data()` a secas deja
   `CY.usuario.uid` en `undefined`, y eso NO falla acá: falla del lado del
   servidor, donde la regla de `reportes/` exige que el `uid` del documento sea
   el de quien escribe.

   El 24-sep-2026 Romina no podía mandar un pedido desde el globo y el mensaje
   la mandaba a revisar su ficha de usuarios, que estaba perfecta. `editar.html`
   era la única de las tres que no lo agregaba. */
for (const [f, pista] of [["admin.html", /yo = \{ uid: u\.uid, \.\.\.d\.data\(\) \}/],
                          ["editar.html", /yo = \{ uid: u\.uid, \.\.\.d\.data\(\) \}/]]) {
  ok(`${f} arma el usuario CON el uid`, pista.test(leer(f)));
}
ok("CY.arrancar también", /CY\.usuario = \{ uid: u\.uid, \.\.\.d\.data\(\) \}/.test(nucleo));
ok("y ninguna guarda `d.data()` pelado",
   !/(yo|CY\.usuario) = d\.data\(\);/.test(leer("admin.html") + leer("editar.html") + nucleo));

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

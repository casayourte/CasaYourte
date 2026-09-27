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

titulo("EL MANUAL DEL EDITOR — que exista, que se llegue, y que no mienta");
/* Pedido de Mauro, 27-sep-2026: «todo documentado y explicado para que Romina
   al acceder pueda comprender cómo editar cada aspecto». Un manual que nombra
   un botón que ya no existe es peor que no tener manual, porque se le cree:
   por eso estas pruebas atan cada tema del manual a lo que el editor tiene. */
{
  const ed = leer("editar.html");
  const man = ed.slice(ed.indexOf('<div id="manual"'), ed.indexOf('<div id="aviso">'));
  ok("existe el manual", man.length > 1000);
  ok("se abre con el «?» de la barra de arriba, para todos",
     /id="ayuda"/.test(ed) && /\$\("ayuda"\)\.addEventListener\("click", abrirManual\)/.test(ed));
  ok("la orientación del primer ingreso lleva al manual", /id="guia-manual"/.test(ed));
  const temas = [
    ["Taller y Guardar", /Guardar/, /id="guardar"/],
    ["Vista previa", /Vista previa/, /id="vista-previa"/],
    ["Al sitio", /Al sitio/, /id="migrar"/],
    ["Idiomas", /ES · FR · EN/, /id="idiomas"/],
    ["Fotos y «Volver a la original»", /Volver a la original/, /id="h-repo"/],
    ["Secciones", /<b>Secciones<\/b>/, /id="secciones"/],
    ["Páginas del andamio", /<b>Páginas<\/b>/, /id="paginas-taller"/],
    ["Mudar un bloque (→)", /<b>→<\/b>/, /class="muda"/],
    ["Enlazar (🔗)", /🔗/, /liga\.textContent = "🔗"/],
    ["El globo de pedidos", /globo/, /id="globo"/],
    ["La página de obras", /<b>Álbumes<\/b> abre la página de las obras/, /data-p="album"/],
    ["Cómo se muestra", /<b>Cómo se muestra<\/b>/, /id="v-lista"/],
    ["Volver a copiar el sitio", /<b>Volver a copiar el sitio<\/b>/, /id="s-reset"/],
  ];
  for (const [t, enManual, enEditor] of temas)
    ok("el manual explica «" + t + "» y el editor lo tiene", enManual.test(man) && enEditor.test(ed));
  ok("dice que quitar un bloque es definitivo, y ya no la trampa vieja",
     /Quitar es definitivo/.test(man) && !/vuelven a\s+aparecer/.test(man));
  ok("explica que Guardar avisa si otro cambió el taller", /<b>Guardar te avisa<\/b>/.test(man));
  ok("el reporte de fallas se hace desde el manual, porque el editor no tiene menú de cuenta",
     /id="manual-falla"/.test(man) && /\$\("manual-falla"\)[\s\S]{0,120}CY\.reportar\("falla"\)/.test(ed)
     && !/renderNav/.test(ed));
}

titulo("EL MANUAL ES COHERENTE — con el editor, con el sitio y consigo mismo");
/* 27-sep-2026, pedido de Mauro al revisar el manual: «que todos los procesos
   sean coherentes». Cada cosa que el manual promete se ata acá a lo que el
   código hace, y lo que se dice en dos lugares tiene que decir lo mismo. */
{
  const ed = leer("editar.html");
  const idx = leer("index.html"), alb = leer("album.html");
  const man = ed.slice(ed.indexOf('<div id="manual"'), ed.indexOf('<div id="aviso">'));
  const guia = ed.slice(ed.indexOf('<div id="guia"'), ed.indexOf('id="globo"'));
  const sacar = (n) => {
    const i = ed.indexOf("function " + n + "("); if (i < 0) throw new Error("no está " + n);
    let j = ed.indexOf("{", i), k = j, d = 0;
    for (; k < ed.length; k++) { if (ed[k] === "{") d++; else if (ed[k] === "}" && !--d) break; }
    return ed.slice(i, k + 1);
  };
  // «Cómo se muestra»: cada vista que ofrece el editor la tiene que saber
  // dibujar el sitio. Un botón que escribe un valor que nadie lee no cambia
  // nada y parece roto.
  const vistas = /const VISTAS = (\[[\s\S]*?\n\]);/.exec(ed);
  const V = vistas ? new Function("return " + vistas[1])() : [];
  ok("el editor ofrece tres formas de mostrar", V.length === 3);
  const pest = /const PESTANAS = \{([^}]*\}[^}]*\}[^}]*)\}/.exec(idx);
  for (const v of V) {
    const valores = v.opciones.map((o) => o[0]);
    const g = v.campo.replace(/_vista$/, "");
    const entiende = valores.includes("pestanas")
      ? !!pest && new RegExp("\\b" + g + ":\\{").test(pest[1])
      : /alb_vista==="obras"/.test(idx) && /orden\.alb_vista === "obras"/.test(alb);
    ok("«" + v.nombre + "»: el sitio sabe dibujar sus dos formas, y una es la de siempre ('')",
       entiende && valores.includes("") && valores.length === 2);
    ok("«" + v.nombre + "» nombra una sección que existe", idx.includes('data-seccion="' + v.seccion + '"'));
  }
  // Corrido con un DOM de juguete: tocar una forma escribe `orden` y repinta.
  // `innerHTML = ""` vacía, como en un navegador: si no, el repintado sumaría
  // filas nuevas debajo de las viejas y la prueba miraría las viejas.
  const el = () => ({ ch: [], attr: {}, className: "", textContent: "", onclick: null, _h: "",
    get innerHTML() { return this._h; }, set innerHTML(v) { this._h = v; if (v === "") this.ch = []; },
    append(...x) { this.ch.push(...x); }, appendChild(x) { this.ch.push(x); },
    setAttribute(k, v) { this.attr[k] = v; } });
  const lista = el();
  const CONT = { orden: { traj_vista: "pestanas" }, ocultas: "diferencial" };
  let repintes = 0;
  const f = new Function("$", "document", "CY", "enLista", "CONT", "refrescarVista",
    vistas[0] + sacar("pintarVistas") + sacar("ponerVista") + "; return { pintarVistas };");
  const api = f(() => lista, { createElement: el }, { esc: (x) => x },
    (v) => String(v || "").split(",").filter(Boolean), CONT, () => repintes++);
  api.pintarVistas();
  const botones = (i) => lista.ch[i].ch[1].ch;
  ok("marca la forma que está puesta", botones(0)[0].attr["aria-pressed"] === "true"
     && botones(0)[1].attr["aria-pressed"] === "false" && botones(2)[1].attr["aria-pressed"] === "true");
  ok("avisa cuando la sección está apagada", /apagada/.test(lista.ch[1].ch[0].innerHTML) && !/apagada/.test(lista.ch[0].ch[0].innerHTML));
  botones(2)[0].onclick();
  ok("tocar «Una página por obra» escribe orden.alb_vista y repinta la vista",
     CONT.orden.alb_vista === "obras" && repintes === 1 && botones(2)[0].attr["aria-pressed"] === "true");
  botones(0)[1].onclick();
  ok("y «Uno abajo del otro» vuelve a la forma de siempre", CONT.orden.traj_vista === "");
  // El contador: sin esto, mover o apagar una sección dejaba Guardar apagado.
  const contar = sacar("contar");
  ok("el contador suma las secciones (si no, Guardar quedaba apagado)",
     /\["secciones", "ocultas"\]\.filter/.test(contar) && /n \+ im \+ or \+ en \+ se/.test(contar));
  ok("y en el taller dice «sin guardar», con la palabra del botón",
     /enTaller\(\) \? " sin guardar" : " sin publicar"/.test(contar)
     && /textContent = enTaller\(\) \? "Guardar" : "Publicar"/.test(ed));
  // Lo que se dice en dos lugares dice lo mismo.
  const nota = /nota:\s*'([^']*)'\s*\+\s*'([^']*)'/.exec(nucleo);
  ok("la nota del pedido, el manual y la bienvenida dicen lo mismo del plazo",
     !!nota && /hasta un día/.test(nota[2]) && /hasta un\s+día/.test(man) && /hasta un\s+día/.test(guia)
     && !/una vez por día/.test(man + guia));
  ok("la bienvenida no llama «vacías» a las páginas del andamio", !/páginas vacías/.test(guia));
  ok("Secciones: el manual dice dónde aparece, y es donde aparece",
     /aparece en el <b>Taller<\/b>, en la\s+página <b>Sitio<\/b>/.test(man)
     && /\$\("secciones"\)\.hidden = !enTaller\(\) \|\| pag !== "index"/.test(ed));
  ok("«Volver a copiar el sitio» avisa que reemplaza TODO, y no se guarda solo",
     /Se reemplaza TODO/.test(ed) && /reemplaza <b>todo<\/b>/.test(man));
  ok("en el editor el pase de las obras está quieto, como dice el manual",
     /pase está <b>quieto<\/b>/.test(man) && /!visorAbierto\s*&& !EDITANDO/.test(alb));
  ok("la descripción vacía dice lo que el manual promete",
     /Tocá para escribir…/.test(man) && /content:"Tocá para escribir de qué se trata esta obra\."/.test(alb));
  ok("el ejemplo de pestaña de las decisiones es un renglón real del sitio",
     /«Doble anillo periférico»/.test(man) && /data-i="d2\.s"/.test(idx));
}

titulo("GUARDAR AVISA SI OTRO CAMBIÓ EL DOCUMENTO — corrido de verdad");
/* 27-sep-2026. Guardar es un setDoc del documento ENTERO: lo que otro haya
   guardado mientras el editor estaba abierto se pierde. Se extraen las
   funciones reales y se corren contra documentos de juguete. */
{
  const ed = leer("editar.html");
  const sacar = (n) => {
    const i = ed.indexOf("function " + n + "("); if (i < 0) throw new Error("no está " + n);
    let j = ed.indexOf("{", i), k = j, d = 0;
    for (; k < ed.length; k++) { if (ed[k] === "{") d++; else if (ed[k] === "}" && !--d) break; }
    return ed.slice(i, k + 1);
  };
  const milisSrc = ed.match(/const milis = [^\n]+\n/)[0];
  const f = new Function(sacar("estable") + "\n" + milisSrc + sacar("referencia") + "\n" + sacar("conflicto")
    + "\nreturn { referencia, conflicto };")();
  const ts = (n) => ({ toMillis: () => n });                 // una fecha de Firestore, de juguete
  const base = { es: { a: "uno", b: "dos" }, orden: { mod: "m1,m2" }, guardado: ts(1000), guardadoPor: "romina@x" };
  const ref = f.referencia(base);
  const r0 = f.conflicto(ref, { ...base });
  ok("el mismo documento no avisa" + (r0 ? " — dio " + JSON.stringify(r0) : ""), r0 === null);
  ok("las claves en otro orden NO son un cambio",
     f.conflicto(ref, { guardadoPor: "romina@x", guardado: ts(1000), orden: { mod: "m1,m2" }, es: { b: "dos", a: "uno" } }) === null);
  let c = f.conflicto(ref, { ...base, es: { a: "UNO", b: "dos" }, guardado: ts(2000), guardadoPor: "mauro@x" }, "romina@x");
  ok("si otra persona guardó, dice quién y cuándo", c && c.quien === "mauro@x" && c.cuando === 2000);
  c = f.conflicto(ref, { ...base, es: { a: "UNO", b: "dos" }, guardado: ts(2000), guardadoPor: "romina@x" }, "romina@x");
  ok("si fue ella misma desde otra pestaña, se lo dice así", c && /otra pestaña/.test(c.quien));
  c = f.conflicto(ref, { ...base, es: { a: "uno", b: "dos", c: "tres" } }, "romina@x");
  ok("si cambió el contenido SIN cambiar la fecha, fue Claude — y se avisa igual", c && /Claude/.test(c.quien) && c.cuando === null);
  ok("sin referencia (no se llegó a cargar) no inventa un aviso", f.conflicto(null, base) === null);
  c = f.conflicto(f.referencia(null), base, "romina@x");
  ok("si el documento no existía al abrir y ahora sí, avisa", !!c);
  ok("Guardar pregunta ANTES del setDoc",
     ed.indexOf("const c = conflicto(REF") > -1 && ed.indexOf("const c = conflicto(REF") < ed.indexOf('await setDoc(doc(db, "sitio", destino)'));
  ok("y después de guardar la referencia se renueva, o se avisaría a sí mismo",
     /REF = referencia\(nuevo\.exists\(\) \? nuevo\.data\(\) : null\);/.test(ed));
  ok("la referencia se toma al cargar el contenido", /const d = await getDoc\(doc\(db, "sitio", destino\)\);\s*REF = referencia/.test(ed));
}

titulo("QUITAR UN BLOQUE DURA — corrido de verdad");
/* 27-sep-2026. La unión con el archivo (§3.35) volvía a sumar los bloques que
   alguien quitó, si estaban escritos en el HTML: pasó con la yurta gemela. */
{
  const ed = leer("editar.html");
  const sacar = (n) => {
    const i = ed.indexOf("function " + n + "("); if (i < 0) throw new Error("no está " + n);
    let j = ed.indexOf("{", i), k = j, d = 0;
    for (; k < ed.length; k++) { if (ed[k] === "{") d++; else if (ed[k] === "}" && !--d) break; }
    return ed.slice(i, k + 1);
  };
  const fueraSrc = ed.slice(ed.indexOf("const fueraDe = "), ed.indexOf("function unirBloquesDelHtml"));
  const armar = (enHtml, orden) => {
    const CONT = { orden: { ...orden } }, ORIG = { orden: { ...orden } }, avisos = [];
    const f = new Function("CONT", "ORIG", "contrato", "confirm", "rehacer", "aviso",
      fueraSrc + sacar("unirBloquesDelHtml") + "\n" + sacar("quitarBloque")
      + "\nreturn { unirBloquesDelHtml, quitarBloque };")(
      CONT, ORIG, () => ({ GRUPOS: { traj: {} }, ids: () => enHtml.slice() }),
      () => true, () => {}, (t) => avisos.push(t));
    return { ...f, CONT, avisos };
  };
  // s1..s5 escritos en el archivo, y la lista guardada igual.
  let t = armar(["s1","s2","s3","s4","s5"], { traj: "s1,s2,s3,s4,s5" });
  t.quitarBloque("traj", "s3");
  ok("quitar saca el bloque de la lista", t.CONT.orden.traj === "s1,s2,s4,s5");
  ok("y lo anota como quitado a propósito", t.CONT.orden.traj_fuera === "s3");
  t.unirBloquesDelHtml();               // lo que pasa al volver a abrir el editor
  ok("al volver a abrir, el quitado NO vuelve aunque esté en el archivo", t.CONT.orden.traj === "s1,s2,s4,s5");
  t = armar(["s1","s2","s3","s4","s5","s6"], { traj: "s1,s2,s4,s5", traj_fuera: "s3" });
  t.unirBloquesDelHtml();
  ok("pero un bloque NUEVO en el archivo se suma igual (§3.35 sigue valiendo)", t.CONT.orden.traj === "s1,s2,s4,s5,s6");
  t = armar(["s1","s2","s3"], { traj: "s1,s2,s3" });
  t.quitarBloque("traj", "s2"); t.quitarBloque("traj", "s2");
  ok("quitar dos veces el mismo no lo anota dos veces", t.CONT.orden.traj_fuera === "s2");
  t = armar(["s1"], { traj: "s1" });
  t.quitarBloque("traj", "s1");
  ok("el último bloque de un grupo no se puede quitar, ni queda anotado",
     t.CONT.orden.traj === "s1" && !t.CONT.orden.traj_fuera && t.avisos.some((x) => /sin ningún bloque/.test(x)));
  t = armar(["s1","s2","s3"], {});
  t.unirBloquesDelHtml();
  ok("la primera vez, sin lista guardada, la lista sale del archivo", t.CONT.orden.traj === "s1,s2,s3");
}

console.log(`\n${bien} bien · ${mal} mal`);
process.exit(mal ? 1 : 0);

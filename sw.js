// ═══════════════════════════════════════════════════════════
//  CASAYOURTE — service worker
//
//  Estrategia: RED PRIMERO para todo el mismo origen, con la caché
//  como respaldo sin señal.
//
//  Por qué red primero y no caché primero para los archivos: con HTML
//  red-primero y JS caché-primero, un despliegue mezcla página nueva
//  con módulos viejos y rompe en silencio. Este sitio publica directo
//  desde la raíz de main, sin etapa intermedia, así que el desfase es
//  cuestión de minutos. Red primero en todo el mismo origen lo elimina;
//  sin señal la caché responde igual.
//
//  Los DATOS no pasan por acá: van por la caché persistente de
//  Firestore. Cloudinary y gstatic siguen su camino normal.
//
//  Al cambiar cualquier archivo del SHELL: subir la VERSION. No es un
//  trámite — al activarse, 'activate' borra todas las cachés que no
//  sean esta, y es la única forma segura de que un teléfono deje de
//  servir una mezcla de archivos viejos y nuevos.
// ═══════════════════════════════════════════════════════════

// v1 (10-ago-2026) — nace el panel instalable.
// v2 (10-ago-2026) — el video del sitio dejó de reproducirse. Causa: los
//   reproductores piden el archivo por trozos (cabecera 'Range') y el
//   servidor contesta 206 Partial Content. Guardar eso en la caché rompe
//   la reproducción, y 'cache.put' con un 206 además lanza excepción.
//   Ahora: las peticiones con Range y el video NO pasan por el service
//   worker, y sólo se guarda una respuesta si su estado es 200.
// v3 (10-ago-2026) — cambió admin.html (recargar y comparar, álbum público).
// v4 (11-ago-2026) — dominio propio casayourte.com, y cambió admin.html.
// v5 (11-ago-2026) — editar.html, el editor sobre la página real.
// v6 (11-ago-2026) — el borrador se MEZCLA con el archivo, no lo reemplaza.
// v7 (11-ago-2026) — sellos de versión visibles y firma en el JSON exportado.
// v8 (14-ago-2026) — estilos.css, usuarios.html y calculo.html; navegación común.
// v9 (16-ago-2026) — contenido.html y diagnostico.html salen de admin.html.
// v10 (16-ago-2026) — estilos.css recupera las clases que se habían perdido.
// v11 (16-ago-2026) — cálculos por cliente, láminas de referencia, y la edición
//   del sitio queda sólo en editar.html: contenido.html se retira.
// v12 (16-ago-2026) — las dos capas del techo se calculan separadas.
// v13 (16-ago-2026) — la apertura de la base sale de la condición de paralelismo.
// v14 (16-ago-2026) — el ancho del montante se deriva del espesor del trei.
// v19 (18-ago-2026) — el sitio lee Firestore: se retira el borrador y la exportación.
// v20 (18-ago-2026) — el álbum público respeta el tilde de cada foto.
// v21 (18-ago-2026) — las categorías de cada álbum se editan desde el panel.
// v22 (18-ago-2026) — en la grilla, el tacho reemplaza al lápiz.
// v23 (18-ago-2026) — la lista de categorías se dibuja: 'div div' se comía las filas.
// v24 (19-ago-2026) — selección múltiple en la grilla: mostrar, mover y quitar.
// v35 (8-sep-2026) — traducir.html: el español y sus idiomas, en el mismo
//   acto. La exportación lleva lo que dicen HOY los demás idiomas y una
//   sola respuesta puede traer el español y todas sus traducciones. Y una
//   traducción que no cambia se puede CONFIRMAR contra el español nuevo
//   sin reescribirla. Antes, corregir el español en la vuelta de un idioma
//   dejaba los otros diciendo el texto viejo sin que nada avisara.
// v34 (8-sep-2026) — entra el inglés al catálogo, en preparación: existe
//   para el panel y para traducir, y no aparece en el sitio hasta que
//   tenga textos. Los hreflang salen del catálogo. Y el diagnóstico suma
//   el bloque de idiomas que la cabecera de idiomas.js prometía y no
//   existía: compara catálogo, respaldo y lo publicado.
// v33 (8-sep-2026) — editar.html saca los idiomas del catálogo: los chips
//   se dibujan solos, el ?lang= lo arma idiomas.js, y no queda ningún
//   ['es','fr'] escrito a mano. Y entra idiomas.js al SHELL: traducir.html
//   depende de él desde la v29 y no estaba en esta lista.
// v32 (8-sep-2026) — traducir.html: los nombres de las categorías de álbum
//   van en minúscula, y la pantalla avisa sola cuál se salió de la regla,
//   en los dos idiomas. Y el resumen del paso 4 decía «francés» escrito a
//   mano: con otro idioma destino mentía.
// v31 (8-sep-2026) — traducir.html: «al día» pasa a significar «hay con qué
//   comprobarlo». Nace el estado «sin registro» —hay traducción y nada dice
//   con qué español se hizo, que es el caso de casi todos los álbumes— y
//   «Dar por al día» pregunta por esas aparte y ya no pisa las advertencias
//   de «el español cambió». Ver README, ««Al día» tenía que significar algo».
// v30 (8-sep-2026) — traducir.html: quedaba una referencia suelta a `fr` que
//   rompía la pantalla al calcular los avisos. Ver README, «Cómo se verificó».
// v29 (8-sep-2026) — traducir.html pasa a N idiomas: se traduce a uno por
//   vez, elegido en una fila que solo aparece cuando hay más de uno. Con
//   español y francés la pantalla se ve y se comporta igual que antes.
// v28 (8-sep-2026) — cambió diagnostico.html: el informe copiable pasa al
//   final (como el de Rematetaller), y suma la prueba que compara la VERSION
//   que declara este archivo contra la caché que se está sirviendo. Si no
//   coinciden, el teléfono está mezclando archivos viejos y nuevos.
// v27 (8-sep-2026) — diagnostico.html deja de depender de lo que
//   diagnostica: carga firebase-init y nucleo con import() aparte, no usa
//   CY.arrancar (que redirigía a admin.html en los cuatro casos que uno
//   viene a averiguar), lleva estilos propios y aísla cada prueba. Corrige
//   además un ReferenceError en la prueba 1 que, sin aislamiento, dejaba sin
//   correr TODAS las siguientes desde que la página existe.
// v26 (8-sep-2026) — cambió diagnostico.html: suma las pruebas de
//   negativas (que lo prohibido esté prohibido). Ver PROTOCOLO-DESARROLLO.md
//   §11.3 en el repositorio `datos`.
// v25 (21-ago-2026) — entra traducir.html; editar.html mueve, agrega y quita
//   bloques del sitio; nucleo.js suma la pantalla al menú; usuarios.html deja
//   de prometer que desactivar impide entrar; traducir.html avisa cuando el
//   español cambió después de traducirse; el núcleo, admin.html, album.html e
//   index.html reconocen secuencias GIF y videos cortos, con límites;
//   traducir.html se vuelve una revisión editorial: baja el sitio entero con
//   su estructura, corrige español y francés a la vez, y recibe un informe;
//   la tabla de referencias pierde la columna de precios; la confirmación de
//   escritura deja de depender del confirm() del navegador; el botón de
//   aplicar se duplica arriba y se escucha por delegación; el sitio elige
//   solo el idioma y recuerda lo que la persona elija; entran robots.txt y
//   sitemap.xml, y las imágenes del index dejan de tener alt vacío; el
//   registro de traducción se guarda codificado (Firestore rechaza arrays
//   dentro de arrays, y la tabla de referencias es exactamente eso); la
//   portada ordena las fotos del álbum igual que el panel.
//
// Dos cosas de este registro, para que no confundan a quien lo lea:
//   · faltan v15 a v18. Esas versiones se publicaron y no se anotaron acá.
//     No se inventan: quedan como hueco a la vista.
//   · había una segunda entrada 'v3' al final de la lista, fuera de orden,
//     que repetía y contradecía a la de arriba. Se retiró en la v25.
const VERSION = 'cy-shell-v47';

// v39 (14-sep-2026) — entra el TALLER: index.html lee sitio/taller con
//   ?taller=1 y sabe mover y apagar secciones (contrato CY_SITIO v2);
//   editar.html (editar-9) suma el chip «En vivo | Taller». Va encima de la
//   v38, de la misma fecha: dos tandas seguidas tocando el SHELL.
//
//   v47 · 24-sep-2026 · `editar.html` era la única de las tres puertas que no
//   le ponía el `uid` a `CY.usuario`, así que el globo mandaba un pedido con
//   `uid: ''` y la regla lo rechazaba. Romina no podía pedir nada.
//
//   v46 · 22-sep-2026 · las puertas del panel pasan de ROL a PERMISO.
//   `admin.html` tenía su propia copia de `puede()` que decidía por rol y no
//   miraba `permisos`, y `editar.html` echaba a todo el que no fuera admin o
//   editor. Con las dos, un colaborador con `albumes` y `taller` en su ficha no
//   podía ni ver los álbumes ni entrar al taller. Los dos están en el SHELL.
//
//   v45 · 22-sep-2026 · ARREGLO URGENTE. La v43 salió con un acento grave
//   adentro de un template literal de `nucleo.js`: cerraba la cadena antes de
//   tiempo, el módulo no parseaba, y `CY` quedaba sin definir. Con eso el panel
//   ENTERO —admin, editar, usuarios, cálculo, traducir— no enganchaba un solo
//   botón. Se veía la pantalla de login y Entrar no hacía nada.
//
//   v44 · 22-sep-2026 · el andamio del taller. `index.html` suma el enlace en su
//   barra bordó y `editar.html` (editar-11) suma la página al mapa PAGS — los
//   dos están en el SHELL. `taller.html` NO entra al SHELL a propósito: es del
//   taller y no del panel, el panel tiene que abrir sin señal y el andamio no.
//
//   v43 · 22-sep-2026 · `nucleo.js` (nucleo-22) parte el elegir imagen en DOS
//   inputs, cámara y archivos. Ningún input solo ofrece las dos cosas de forma
//   confiable en iOS + Android, y la v42 había salido con uno — el comentario
//   decía «dos» y el código tenía uno. Sube con `estilos.css`, que acomoda el
//   tercer botón.
//
//   v42 · 22-sep-2026 · el globo de pedidos. Toca TRES archivos del SHELL a la
//   vez —`nucleo.js` (nucleo-21) suma la imagen y la nota de quién contesta,
//   `editar.html` (editar-10) suma el globo, y `estilos.css` sus clases—, así
//   que sin este número un teléfono serviría el globo nuevo con el CSS viejo
//   y el botón quedaría invisible, o el CSS nuevo con el nucleo viejo y no
//   haría nada al tocarlo. Es exactamente el caso para el que existe.
//
//   v41 · 21-sep-2026 · `nucleo.js` (nucleo-20) suma el cuadro de pedidos: la
//   misma hoja con dos modos, falla y pedido. Sube porque nucleo.js está en el
//   SHELL de acá abajo — si no subiera, los teléfonos seguirían sirviendo el
//   nucleo-19 cacheado y la entrada «Pedir un cambio» no aparecería nunca.
//
// v38 (14-sep-2026) — el SDK de Firebase pasa a bajarse DIFERIDO
//   (`firebase-init.js` sello init-2, `nucleo.js` nucleo-17 con
//   `CY.conFirebase`, y las cinco pantallas del panel esperándolo). Cambian
//   siete archivos del SHELL de una vez, así que este número importa más que
//   nunca: una mezcla de páginas nuevas con un `firebase-init.js` viejo
//   llamaría a `cargarFirebase()`, que ahí no existe.

const SHELL = [
  './admin.html',
  './editar.html',
  './traducir.html',
  './usuarios.html',
  './calculo.html',
  './diagnostico.html',
  './assets/lamina-muro.jpg',
  './assets/lamina-triangulo.jpg',
  './estilos.css',
  './nucleo.js',
  './idiomas.js',
  './firebase-init.js',
  './manifest.json',
  './icono-192.png',
  './icono-512.png',
  './apple-touch-icon.png',
  './assets/logo.png'
];

// OJO: 'addAll' es todo o nada. Si UN archivo de la lista falta o da 404,
// la instalación entera falla, el service worker nuevo nunca se activa, la
// app queda servida por el viejo y parece que el despliegue "no hizo nada".
// Se guarda de a uno tolerando faltantes: lo que no esté se buscará por
// red igual, porque la estrategia es red-primero.
self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(SHELL.map((u) =>
        c.add(u).catch((e) => console.warn('SW: no se pudo precachear', u, e))
      )))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((claves) => Promise.all(
        claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Sólo se guarda una respuesta completa y correcta. Un 206 (trozo de
// video), un 30x o un error no se cachean nunca.
function guardable(r) {
  return r && r.status === 200 && (r.type === 'basic' || r.type === 'default');
}

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;

  // Peticiones por trozos: se dejan pasar sin tocar. Es lo que usa el
  // reproductor de video y lo que rompía el fondo de la portada.
  if (ev.request.headers.has('range')) return;

  const url = new URL(ev.request.url);

  // El video tampoco pasa por acá: pesa 730 KB, no hace falta sin señal,
  // y es el archivo más propenso a pedirse por trozos.
  if (/\.(mp4|webm|mov|m4v)$/i.test(url.pathname)) return;

  // Navegación: red primero, caché si no hay señal, y si tampoco está,
  // el panel (que es la única pantalla que tiene sentido sin conexión).
  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request)
        .then((r) => {
          if (guardable(r)) {
            const copia = r.clone();
            caches.open(VERSION).then((c) => c.put(ev.request, copia)).catch(() => {});
          }
          return r;
        })
        .catch(() => caches.match(ev.request)
          .then((r) => r || caches.match('./admin.html')))
    );
    return;
  }

  // Estáticos del mismo origen: red primero con respaldo en caché.
  if (url.origin === location.origin) {
    ev.respondWith(
      fetch(ev.request)
        .then((r) => {
          if (guardable(r)) {
            const copia = r.clone();
            caches.open(VERSION).then((c) => c.put(ev.request, copia)).catch(() => {});
          }
          return r;
        })
        .catch(() => caches.match(ev.request))
    );
  }
  // Todo lo demás (gstatic, Cloudinary, Firestore) sigue su camino.
});

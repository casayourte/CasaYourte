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
// v3 (10-ago-2026) — cambiaron admin.html y nucleo.js: entra la sección de
//   contenido del sitio.
const VERSION = 'cy-shell-v14';

const SHELL = [
  './admin.html',
  './editar.html',
  './usuarios.html',
  './calculo.html',
  './diagnostico.html',
  './assets/lamina-muro.jpg',
  './assets/lamina-triangulo.jpg',
  './estilos.css',
  './nucleo.js',
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

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
const VERSION = 'cy-shell-v1';

const SHELL = [
  './admin.html',
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

self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  const url = new URL(ev.request.url);

  // Navegación: red primero, caché si no hay señal, y si tampoco está,
  // el panel (que es la única pantalla que tiene sentido sin conexión).
  if (ev.request.mode === 'navigate') {
    ev.respondWith(
      fetch(ev.request)
        .then((r) => {
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(ev.request, copia));
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
          const copia = r.clone();
          caches.open(VERSION).then((c) => c.put(ev.request, copia));
          return r;
        })
        .catch(() => caches.match(ev.request))
    );
  }
  // Todo lo demás (gstatic, Cloudinary, Firestore) sigue su camino.
});

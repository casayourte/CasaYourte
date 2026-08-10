# Qué subir · panel instalable · 10 de agosto de 2026

Todo desde el navegador del celular. **Nada que instalar.**

## Archivos NUEVOS · 7

Van a la **raíz** del repositorio.

| Archivo | Qué es |
|---|---|
| `firebase-init.js` | único punto de contacto con Firebase. SDK 12.16.0, caché persistente, alta de cuentas por app secundaria |
| `nucleo.js` | lo común: pila del botón Atrás, avisos, elección y subida de imágenes, URLs de Cloudinary, permisos |
| `sw.js` | service worker: red primero, respaldo en caché sin señal |
| `manifest.json` | hace la app instalable |
| `icono-192.png` | icono de la app |
| `icono-512.png` | icono grande, recortable |
| `apple-touch-icon.png` | icono para iPhone |

## Archivos que se REEMPLAZAN · 3

| Archivo | Qué cambió |
|---|---|
| `admin.html` | usa `firebase-init.js` y `nucleo.js`, se instala, alta directa de usuarios, cámara o galería, Atrás de Android, sello de versión |
| `README.md` | lista los archivos nuevos |
| `CAMBIOS.md` | este archivo |

**`index.html`, `contenido.json`, `REGLAS.txt`, `GUIA-ANDROID.md` y `assets/` NO cambian.**
El sitio público queda exactamente como está.

## Cómo subirlo, desde el celular

1. En GitHub, **Add file → Upload files**.
2. Seleccioná los **10 archivos** de la raíz de este zip: los 7 nuevos más
   `admin.html`, `README.md` y `CAMBIOS.md`.
3. Commit: `panel instalable`.

Los que ya existían se sobrescriben solos al subir uno con el mismo nombre: **no hace
falta borrarlos primero**.

**No abras la carpeta `assets/`.** No cambió nada ahí.

## Instalar la app

1. Abrí `https://casayourte.github.io/CasaYourte/admin.html`
2. Recargá una vez, con señal, para que se registre el service worker.
3. Menú ⋮ de Chrome → **Agregar a la pantalla principal** → *Instalar*.
4. Se abre sin barra de direcciones, con el logo como icono.

Para comprobarlo: entrá al panel y tocá **🩺 → Probar todo**. La última fila dice si está
corriendo como app instalada.

## Qué cambia al usarlo

**Se instala.** Pantalla completa, unos 120 píxeles más de alto útil, icono propio.

**El botón Atrás de Android funciona.** Cierra la capa abierta —una foto, la lista de
usuarios, el diagnóstico— en lugar de salir de la aplicación. Con la app instalada no hay
barra de direcciones, así que esto pasa de cómodo a necesario.

**Al agregar fotos pregunta cámara o galería.** Antes abría un solo selector y en algunos
teléfonos no ofrecía la cámara.

**Podés crear cuentas directamente.** Nombre, mail, contraseña y rol, y la cuenta queda
lista. Tu sesión no se toca: la creación pasa por una instancia secundaria de Firebase.
La invitación sigue existiendo para quien prefiera elegir su propia clave.

**Hay "Olvidé mi contraseña"** en la pantalla de entrada, así no tenés que administrar
claves ajenas.

**Funciona sin señal.** El panel abre y muestra lo último leído. Subir fotos necesita
conexión y lo avisa.

**Abajo del nombre aparece la versión del código** que está corriendo. Sirve para saber si
subiste el archivo o no: si dice `nucleo-1`, la subida funcionó.

**La cantidad de fotos ya no se guarda**, se cuenta al leer. Antes se guardaba en tres
lugares distintos y se iba a desincronizar.

## Si algo no anda

| Síntoma | Causa |
|---|---|
| Pantalla en blanco al abrir el panel | falta subir `firebase-init.js` o `nucleo.js` |
| No aparece la opción de instalar | recargá una vez con señal; el service worker se registra en la primera visita |
| No dice la versión abajo del nombre | `admin.html` viejo: volvé a subirlo |
| "Falta el manifest" en 🩺 | falta subir `manifest.json` |
| Iconos en blanco | faltan los tres `.png` |

Al subir una versión nueva de cualquiera de estos archivos hay que **subir también la
`VERSION` que está arriba en `sw.js`**, o los teléfonos que ya instalaron la app pueden
seguir sirviendo una mezcla de archivos viejos y nuevos.

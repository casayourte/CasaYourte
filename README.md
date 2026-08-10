# CasaYourte

Catálogo bilingüe y panel de administración. Sitio estático, sin build ni servidor.

**Sitio:** https://casayourte.github.io/CasaYourte/
**Panel:** https://casayourte.github.io/CasaYourte/admin.html

## Archivos

```
index.html            el catálogo público
admin.html            el panel: álbumes, fotos y usuarios
firebase-init.js      único punto de contacto con Firebase
nucleo.js             lo común del panel: Atrás, avisos, imágenes, permisos
sw.js                 service worker: hace que el panel funcione sin señal
manifest.json         hace la app instalable
icono-192.png · icono-512.png · apple-touch-icon.png
contenido.json        los 130 textos en español y francés
REGLAS.txt            las reglas de seguridad de Firestore, para copiar y pegar
assets/               las 34 imágenes y el video, todo en una sola carpeta
README.md             este archivo
GUIA-ANDROID.md       configuración paso a paso desde el celular
```

**El panel se instala como app.** Abrilo, recargá una vez con señal, y en Chrome:
menú ⋮ → Agregar a la pantalla principal.

**Al cambiar cualquiera de los archivos de la lista `SHELL` de `sw.js`, hay que subir la
`VERSION` que está arriba en ese archivo.** Si no, un teléfono que ya instaló la app puede
seguir sirviendo una mezcla de archivos viejos y nuevos.

Una sola carpeta a propósito: subir carpetas anidadas desde el celular es innecesariamente
molesto.

## Los nombres de assets/

| Archivo | Dónde aparece |
|---|---|
| `hero.jpg` | foto grande de apertura |
| `traj1.jpg` … `traj5.jpg` | las cinco generaciones de yurta |
| `dif1.jpg` … `dif8.jpg` | los ocho diferenciales técnicos |
| `int1.jpg` `int2.jpg` `int3.jpg` | sección del interior |
| `co.jpg` | co-construcción |
| `ws.jpg` | taller y showroom |
| `p01.jpg` … `p12.jpg` | los doce fotogramas del proceso |
| `banner.mp4` `banner.jpg` | video de portada y su imagen de respaldo |
| `logo.png` | el logo |

Para cambiar una imagen: subir la nueva con **el mismo nombre**, encima de la anterior.

## Nada que instalar

Todo se hace desde el navegador del celular: subir archivos por GitHub, cargar fotos por
el panel, configurar en las consolas de Firebase y Cloudinary. **No hay herramientas de
escritorio en este proyecto**, ni terminal, ni npm.

## Configuración

Ver `GUIA-ANDROID.md`, que va paso a paso desde el celular: GitHub Pages, Firebase y
Cloudinary.

## No subir acá

Los cálculos, costos, márgenes y proveedores **no van a este repositorio**, que es público.
Van a un repositorio privado aparte. Ni siquiera sirve borrarlos después: quedan en el
historial.

## Los archivos y qué hacer con cada uno

| Archivo | Se toca desde |
|---|---|
| `index.html` | se reemplaza subiendo el nuevo |
| `admin.html` | se reemplaza subiendo el nuevo |
| `contenido.json` | se edita en GitHub con el lápiz, o desde el panel |
| `assets/*` | se reemplaza subiendo con el mismo nombre |
| `REGLAS.txt` | se copia y se pega en la consola de Firebase |
| `GUIA-ANDROID.md` | se lee |

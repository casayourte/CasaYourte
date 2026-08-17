# CasaYourte

Sitio, catálogo bilingüe y panel de administración. Estático: sin build, sin servidor,
sin dependencias que instalar.

| | |
|---|---|
| **Sitio** | https://casayourte.com/ |
| **Álbumes de obra** | https://casayourte.com/album.html |
| **Panel** | https://casayourte.com/admin.html |
| **Editar viendo el sitio** | https://casayourte.com/editar.html |

El panel se instala como app: abrilo, recargá una vez con señal, y en Chrome
menú ⋮ → *Agregar a la pantalla principal*.

---

## Los archivos

**Páginas públicas**

| Archivo | Qué es |
|---|---|
| `index.html` | el catálogo. Lee sus textos de `contenido.json` |
| `album.html` | los álbumes de obra que estén marcados como públicos |

**Páginas de administración** — todas piden cuenta

| Archivo | Qué es |
|---|---|
| `admin.html` | los álbumes de obra |
| `editar.html` | el editor: la página real, tocás un texto o una foto y la cambiás |
| `calculo.html` | los cálculos de taller, uno por cliente |
| `usuarios.html` | quién entra y qué puede hacer |
| `diagnostico.html` | las pruebas de conexión |

**Código común**

| Archivo | Qué es |
|---|---|
| `firebase-init.js` | único archivo que toca el SDK de Firebase. La versión vive acá |
| `estilos.css` | una sola hoja para todas las pantallas del panel |
| `nucleo.js` | navegación, permisos, Atrás de Android, avisos, imágenes, Cloudinary |
| `sw.js` | service worker: el panel abre sin señal |
| `manifest.json` | hace la app instalable |

**Contenido y datos**

| Archivo | Qué es |
|---|---|
| `contenido.json` | 143 textos por idioma, español y francés, y los reemplazos de imagen |
| `assets/` | las imágenes, el video y las dos láminas del cálculo |
| `icono-192.png` · `icono-512.png` · `apple-touch-icon.png` | iconos de la app |
| `CNAME` | declara el dominio propio. Una línea |
| `REGLAS.txt` | las reglas de seguridad de Firestore, para copiar y pegar |

**Documentación**

| Archivo | Qué es |
|---|---|
| `README.md` | este archivo |
| `GUIA-ANDROID.md` | configuración paso a paso desde el celular |
| `CAMBIOS.md` | qué se cambió en la última entrega y qué había que subir |

---

## Nada que instalar

Todo se hace desde el navegador del celular: subir archivos por GitHub, cargar fotos por
el panel, configurar en las consolas de Firebase y Cloudinary. **No hay herramientas de
escritorio en este proyecto**, ni terminal, ni npm.

Una sola carpeta a propósito: subir carpetas anidadas desde el celular es
innecesariamente molesto.

---

## Cómo se cambia el contenido

El circuito es de una sola dirección:

```
editás en el panel o en editar.html
  → Guardar     deja los cambios en Firestore, para que no se pierdan
  → Exportar    descarga contenido.json
  → lo subís al repositorio
  → cambia el sitio
```

**El `contenido.json` del repositorio es lo publicado. Firestore es el cuaderno de
trabajo.** El sitio no lee la base, salvo que se lo pidas con `?borrador=1`.

Dos caminos para editar, y los dos escriben el mismo borrador:

- **`editar.html`** (ojo 👁 en el panel) · la página real, tocás y escribís encima. Las
  fotos se cambian eligiendo del álbum. No edita listas ni la tabla de precios.
- **Panel → Contenido del sitio** (lápiz ✎) · todos los textos por formulario,
  incluidas las listas y la tabla.

### Cambiar una imagen · dos caminos distintos

- **Desde el editor:** elegís una foto de un álbum. Queda como *reemplazo* en
  `contenido.json`, y si Cloudinary falla el sitio vuelve sola a la de `assets/`.
- **Desde GitHub:** subís un archivo con el mismo nombre sobre `assets/`. Cambia el
  respaldo para todos.

### Los nombres de `assets/`

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

Son 32 lugares editables: esos, menos el video y el logo.

---

## Los sellos de versión

Cada archivo con lógica propia lleva su número, visible en el panel abajo del nombre. **Al
subir una versión nueva hay que subir su sello**, o no hay forma de saber si el teléfono está
sirviendo el archivo nuevo o una copia vieja de la caché.

| Archivo | Constante | Valor de esta versión |
|---|---|---|
| `nucleo.js` | `CY.VERSION` | `nucleo-8` |
| `sw.js` | `VERSION` | `cy-shell-v15` |
| `admin.html` | `PANEL` | `admin-8` |
| `editar.html` | `EDITOR` | `editar-3` |
| `calculo.html` | `CY.PANEL` | `calculo-6` |
| `usuarios.html` | `CY.PANEL` | `usuarios-2` |
| `diagnostico.html` | `CY.PANEL` | `diagnostico-2` |

Si el panel muestra un número distinto al de esta tabla, ese archivo no se subió o está
cacheado. El botón ↻ del avatar borra las cachés.

## Al subir código

**Si cambia cualquier archivo de la lista `SHELL` de `sw.js`, hay que subir también la
`VERSION` que está arriba en ese archivo.** Si no, un teléfono que ya instaló la app puede
seguir sirviendo una mezcla de archivos viejos y nuevos.

**Y si cambia `admin.html` o `editar.html`, subir su sello:** la constante `PANEL` en el
primero, `EDITOR` en el segundo. Ese número se muestra en la interfaz y se firma en el JSON
exportado. Es la única forma de saber, mirando, si el archivo que corre es el nuevo o una
copia vieja de la caché.

Si algo se comporta raro sin motivo, **lo primero es el sello**, no la configuración.
El botón ↻ del panel borra las cachés y recarga.

---

## Idiomas

Español y francés. El botón de idioma cambia el texto y también la dirección:

```
https://casayourte.com/            español
https://casayourte.com/?lang=fr    francés
```

Esa segunda dirección es la que conviene compartir con clientes franceses: sin ella, para
un buscador la versión en francés no existe.

**En el editor se edita el idioma que se está viendo.** Para cambiar el francés hay que
pasar a FR primero.

---

## Para trabajar

| Dirección | Qué hace |
|---|---|
| `?dev=1` | botón para borrar cachés y recargar limpio |
| `?borrador=1` | muestra el borrador de la base, sin publicar, con aviso arriba |
| `?lang=fr` | abre en francés |

---

## No subir acá

**Los cálculos, costos, márgenes, tarifas y proveedores no van a este repositorio, que es
público.** Van a un repositorio privado aparte. Ni siquiera sirve borrarlos después: quedan
en el historial.

Lo mismo la documentación interna del proyecto (`CASAYOURTE-DOCUMENTACION.md`).

Los `.md` de este repositorio se sirven en texto plano a cualquiera que sepa la dirección.

---

## Configuración

Ver `GUIA-ANDROID.md`: GitHub Pages, el dominio, Firebase y Cloudinary, paso a paso desde
el celular.

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

**El sitio lee Firestore.** Se edita en `editar.html` —la página real— y se toca
**Publicar**. Eso es todo: el sitio cambia en el acto.

```
sitio/publicado   en Firestore   ← LA AUTORIDAD, lo que ve el público
contenido.json    en el repo     ← respaldo, si Firestore no responde
los textos del index.html        ← último respaldo
```

Hasta agosto de 2026 era al revés: la autoridad era `contenido.json`, Firestore guardaba un
borrador, y había que exportar el JSON y subirlo a mano. Esa costura entre los dos estados
produjo más errores que ninguna otra parte del sistema. **Con un solo estado, esa clase de
errores deja de existir.**

**No hay paso de revisión.** Quien tenga el permiso de contenido publica directo. Es a
propósito: dos estados fue lo que se acaba de retirar.

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

---

## Pendientes

### El sitio en inglés, además de español y francés

Hoy el sitio es bilingüe español/francés. Falta el **inglés**.

**Decisión cerrada con Mauro el 2026-09-08: se generaliza a N idiomas, no se copia
`fr` para hacer `en`.** Lo que sigue es el plan.

**Por qué la decisión, en una línea:** hoy `fr` no es un valor, es **un nombre de campo
escrito a mano** —`p.fr`, `SITIO.fr`, `BASE.textos.fr`, `x.fr`— repartido en
`index.html`, `album.html`, `traducir.html` y `editar.html`, más los `hreflang`, el
`knowsLanguage` del JSON-LD, el conmutador y la detección por zona horaria. Copiar cada
uno de esos pares para `en` duplica el trabajo y deja al cuarto idioma costando el doble
otra vez.

### Lo que hace que esto sea más barato de lo que parece

1. **Los datos ya están listos.** La forma es `textos: { es: {clave: texto}, fr: {clave:
   texto} }`, tanto en `contenido.json` como en `sitio/publicado` de Firestore. **Sumar
   un idioma es sumar una clave: no hay ninguna migración de datos que hacer.**
2. **El catálogo ya existe y nadie lo lee.** `contenido.json` declara
   `"idiomas": ["es", "fr"]` desde siempre, y ningún archivo lo consulta: el código tiene
   `fr` escrito al lado. **Hacer que ese campo sea la fuente única es, básicamente, todo
   el trabajo.**

O sea: no es un rediseño, es **sacar un dato que ya está declarado y hacer que mande**.

### Las cuatro tandas

| | Qué | Cómo se verifica |
|---|---|---|
| **1** | **El catálogo manda.** `CY.IDIOMAS` en `nucleo.js` como fuente única (igual que `PERMISOS`), alimentado por `idiomas` de `contenido.json`. `index.html` y `album.html` arman desde ahí el conmutador, los `hreflang`, el `knowsLanguage` y la detección. **Sin sumar el inglés todavía.** | **El sitio tiene que comportarse exactamente igual que hoy en español y francés.** Que no cambie nada ES la prueba |
| **2** | **La pantalla de traducción, para N.** `traducir.html` deja de asumir dos columnas. Es la pieza más grande y la única con lógica propia: detecta si una traducción quedó vieja comparando contra la base | Que siga detectando lo mismo con dos idiomas antes de sumar el tercero |
| **3** | **El editor.** `editar.html` ya tiene chips de idioma; que salgan del catálogo en vez de estar escritos | Ídem |
| **4** | **Entra el inglés.** Recién acá se suma `"en"` al catálogo, y empieza el trabajo de contenido con el orden de abajo | Los 143 textos, con el diagnóstico y la revisión del sitio publicado |

**Las tandas 1 a 3 no cambian nada visible, y eso es a propósito:** son refactorización
pura, así que **cualquier diferencia que aparezca es un error**. Es la clase de tanda más
fácil de verificar que existe, y por eso van antes del contenido.

**El orden de trabajo del contenido, que no cambia y vale para cualquier idioma que se
sume:**

1. **El español es el idioma fuente.** Todo cambio de contenido se propone y se escribe
   primero en español. No se edita una traducción para tapar algo que en realidad está
   mal en el original.
2. **Después, en la pantalla de traducción y corrección, se corrige primero el
   español**: semántica y ortografía. Traducir sobre un texto con un error lo propaga a
   todos los demás idiomas y multiplica el arreglo por la cantidad de idiomas que haya.
3. **Recién entonces se traduce, y no palabra por palabra.** Para cada concepto y cada
   expresión se busca la forma que **cumpla el objetivo del sitio en ese idioma**. Una
   traducción literal que no le habla a quien la lee no sirve, por correcta que sea.

> Anotado el 2026-09-08. Este `README.md` es, por ahora, el único lugar del repositorio
> donde vive un pendiente: falta el reglamento técnico del proyecto (el «Libro 1» que
> citan los comentarios del código y que no está acá). Cuando exista, esto se muda ahí.

## Los sellos de versión

Cada archivo con lógica propia lleva su número, visible en el panel abajo del nombre. **Al
subir una versión nueva hay que subir su sello**, o no hay forma de saber si el teléfono está
sirviendo el archivo nuevo o una copia vieja de la caché.

> **Esta tabla es derivada, no autoridad.** El sello que manda es el que está escrito
> adentro del archivo y a la vista en el panel. Si los dos no coinciden, **la tabla está
> vieja** — se copia a mano y se desactualiza en silencio. Ya pasó: hasta el 2026-09-07
> publicaba cinco de estos siete números desactualizados, y quien la usara para
> diagnosticar iba a concluir exactamente lo contrario de lo que pasaba.

| Archivo | Constante | Valor de esta versión |
|---|---|---|
| `nucleo.js` | `CY.VERSION` | `nucleo-14` |
| `sw.js` | `VERSION` | `cy-shell-v28` |
| `admin.html` | `PANEL` | `admin-17` |
| `editar.html` | `EDITOR` | `editar-6` |
| `calculo.html` | `CY.PANEL` | `calculo-8` |
| `usuarios.html` | `CY.PANEL` | `usuarios-3` |
| `diagnostico.html` | `CY.PANEL` | `diagnostico-6` |

*Verificados uno por uno contra los archivos el 2026-09-07; `sw.js` y `diagnostico.html` actualizados el 2026-09-08.*

Si el panel muestra un número **más alto** que el de esta tabla, la que quedó vieja es la
tabla. Si muestra uno **más bajo**, ese teléfono está sirviendo una copia cacheada: el
botón ↻ del avatar borra las cachés.

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

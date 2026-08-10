# CAMBIOS · el video, el caché y los buscadores · 10 de agosto de 2026

## Qué subir · 2 archivos

| Archivo | Qué |
|---|---|
| `index.html` | arregla el video, agrega metadatos para buscadores, idioma por URL y botón de actualizar |
| `firebase-init.js` | exporta una función que al panel le faltaba |

## Y una edición de una línea en `admin.html`

Tu `admin.html` está bien, no hace falta reemplazarlo, pero tiene un error que
todavía no se disparó: el alta **por invitación** usa
`createUserWithEmailAndPassword` y esa función no estaba importada. La primera
persona que intente crear su cuenta con una invitación va a ver una pantalla
que no hace nada.

En GitHub, abrí `admin.html`, tocá el lápiz ✏️ y en la línea de importación
—cerca del principio— agregá `crearCuentaAuth,` la palabra que falta:

**Dice:**
```
import { db, auth, firebaseConfig, crearCuentaAuth,
```
**Tiene que decir:**
```
import { db, auth, firebaseConfig, crearCuentaAuth, createUserWithEmailAndPassword,
```

Commit y listo. El `firebase-init.js` de este zip ya la exporta.

---

## 1 · El video de la portada

**El arreglo nunca llegó a tu repositorio.** Lo hice después de armar el zip
anterior y quedó en mi copia. En tu archivo seguía diciendo
`type="assets/mp4"`, cuando debía ser `video/mp4`: se rompió cuando aplané las
carpetas y reemplacé `video/` por `assets/` en todo el archivo. Un tipo MIME
inválido hace que el navegador descarte la fuente **sin decir nada**.

Esta vez lo saqué de raíz: el `src` va en el propio `<video>` y no hay
`<source>` ni tipo MIME que se pueda romper.

La lógica de reproducción que ya estaba se conserva: si el sistema pide menos
movimiento —lo activa el ahorro de batería de Android— el video no arranca solo
pero aparece un botón **▶ Ver en movimiento**.

## 2 · Por qué no veías las modificaciones

Puede ser una de tres, y conviene descartarlas en este orden:

1. **Guardaste el borrador pero no publicaste.** El sitio lee
   `sitio/publicado`; Guardar sólo escribe `sitio/borrador`. Es lo más
   probable.
2. **GitHub Pages sirve los archivos con unos minutos de vida.** Un cambio
   recién subido puede tardar un par de minutos en aparecer.
3. **El caché del navegador o del service worker**, si tenés el panel
   instalado.

Para el 3, ahora tenés un botón: abrí el sitio con **`?dev=1`** al final de la
dirección

```
https://casayourte.github.io/CasaYourte/?dev=1
```

y aparece abajo a la derecha un botón **Actualizar** que borra las cachés y
recarga sin caché. Sólo aparece con ese parámetro: un visitante normal no lo ve.

Contra el punto 2 no hay botón que sirva: hay que esperar.

## 3 · Sobre el modelo de contenido

Queda como dijiste: el sitio sigue levantando de `contenido.json`, y Firestore
guarda las ediciones para que no se pierdan hasta que reemplaces el JSON a mano
en el repositorio. El botón **Exportar JSON** del panel es el que cierra ese
circuito.

La cascada del sitio no cambió y ese orden sigue sirviendo: si algún día
publicás desde el panel, `sitio/publicado` manda; si no existe, se usa
`contenido.json`; y si tampoco, los textos internos del HTML.

## 4 · Metadatos para buscadores

Esto es lo que hacía falta para que alguien que busca *constructor de yurtas* o
*yourte* pueda encontrarte.

**Lo que entró:**

- **Título y descripción** pensados para búsqueda, no para lucir:
  *"CasaYourte · Constructor de yurtas en Uruguay, Argentina y Brasil"*.
- **Vista previa al compartir** (Open Graph y Twitter): al mandar el enlace por
  WhatsApp ahora aparece título, descripción y la foto de la yurta terminada.
  Antes no aparecía nada.
- **Datos estructurados** en formato schema.org: qué es el negocio, quién lo
  funda, teléfono, mail, los tres países donde trabaja, los dos idiomas en que
  atiende y las cuatro líneas de servicio.
- **Contenido para quien no ejecuta JavaScript**: un bloque `noscript` con un
  resumen en español y en francés. Los textos del sitio los pone el JavaScript,
  y aunque Google lo ejecuta, otros buscadores no.
- El antetítulo y el título de portada ahora están escritos en el HTML, no sólo
  en el JavaScript.

**Y lo más importante para el francés:** el botón de idioma cambiaba el texto
pero no la dirección, así que **para un buscador no existía ninguna página en
francés**. Ahora:

- `…/CasaYourte/?lang=fr` abre el sitio directamente en francés.
- El botón de idioma actualiza la dirección sin recargar, así se puede compartir.
- Hay etiquetas `hreflang` que le dicen a Google que esas dos direcciones son la
  misma página en dos idiomas.

Esa es la dirección que conviene compartir con clientes franceses.

## Lo que todavía falta para posicionar

Los metadatos son la condición, no el resultado. Faltan tres cosas y ninguna es
código:

1. **Que el sitio esté enlazado desde algún lado.** Un sitio sin enlaces
   entrantes tarda mucho en aparecer. Instagram, un grupo de bioconstrucción,
   un directorio de glamping.
2. **Registrarlo en Google Search Console.** Se hace desde el navegador, es
   gratis, y hace que Google lo mire en días en lugar de semanas.
3. **Los precios.** La gente busca "yurta precio". Sin ningún número, quien
   llegue se va.

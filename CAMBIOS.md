# CAMBIOS · 10 de agosto de 2026

**De ahora en más los archivos van completos.** Nada de ediciones a mano.

## Qué subir · 3 archivos, a la raíz

| Archivo | Qué cambió |
|---|---|
| `index.html` | el video, metadatos para buscadores, `?lang=fr`, botón de actualizar |
| `admin.html` | el import que faltaba, y cuatro arreglos más |
| `firebase-init.js` | exporta `createUserWithEmailAndPassword` |

Se sobrescriben solos al subir uno con el mismo nombre. **No hace falta borrar
nada primero, ni buscar ninguna línea.**

No cambian: `nucleo.js`, `sw.js`, `manifest.json`, los iconos, `contenido.json`,
`REGLAS.txt`, `sembrar.html` ni `assets/`.

---

## 1 · El video de la portada

El arreglo nunca había llegado a tu repositorio: lo hice después de armar el zip
anterior y quedó en mi copia. En tu archivo seguía diciendo `type="assets/mp4"`
en lugar de `video/mp4`, roto desde que aplané las carpetas y reemplacé `video/`
por `assets/` en todo el archivo. **Un tipo MIME inválido hace que el navegador
descarte el video sin mostrar ningún error.**

Ahora el `src` va en el propio `<video>` y no hay `<source>` ni tipo MIME que se
pueda romper otra vez.

## 2 · Por qué no veías las modificaciones

Tres causas posibles, en este orden:

1. **Guardaste el borrador pero no publicaste.** El sitio lee `sitio/publicado`;
   Guardar sólo escribe `sitio/borrador`. Es lo más probable.
2. **GitHub Pages sirve los archivos con unos minutos de vida.**
3. **El caché del navegador o del service worker.**

Para el 3, abrí el sitio con **`?dev=1`** al final:

```
https://casayourte.github.io/CasaYourte/?dev=1
```

Aparece abajo a la derecha un botón **Actualizar** que borra las cachés y recarga
limpio. Sólo con ese parámetro: un visitante no lo ve. Contra el punto 2 no hay
botón, hay que esperar.

Y el diagnóstico 🩺 ahora tiene una prueba más, **Contenido del sitio**, que dice
cuántos textos hay en el borrador y cuántos en lo publicado. Si el publicado está
en cero, ahí está la respuesta.

## 3 · Arreglos en el panel

- **El import que faltaba.** El alta por invitación usaba
  `createUserWithEmailAndPassword` sin importarla: la primera persona que
  intentara crear su cuenta con una invitación se encontraba con un botón que no
  hacía nada.
- **`CY.usuario` no se asignaba nunca**, así que `CY.puede("publicar")` devolvía
  siempre falso y el botón **Publicar** no aparecía aunque seas admin. Ahora se
  asigna al entrar, y el botón usa la misma función que el resto del panel.
- **El resaltado de los filtros de la galería** se comparaba por el texto del
  botón en lugar de por su valor, así que al filtrar por etapa no se marcaba
  ninguno. Ahora se compara por el valor.
- **Errores traducidos en todo el panel.** Quedaban lugares que mostraban
  `permission-denied` crudo; ahora todos pasan por el traductor.

## 4 · Metadatos para buscadores

- Título y descripción pensados para búsqueda.
- Vista previa al compartir por WhatsApp: antes no aparecía nada, ahora sale
  título, descripción y la foto de la yurta terminada.
- Datos estructurados schema.org: qué es el negocio, teléfono, mail, los tres
  países y los dos idiomas.
- Bloque para buscadores que no ejecutan JavaScript, en español y francés.

**Y lo decisivo para el francés:** el botón de idioma cambiaba el texto pero no
la dirección, así que **para un buscador no existía ninguna página en francés**.
Ahora `…/CasaYourte/?lang=fr` abre el sitio en francés, el botón lo refleja en la
dirección, y hay `hreflang` declarando que son la misma página en dos idiomas.
Esa es la dirección para compartir con clientes franceses.

---

## Lo que falta para posicionar, y no es código

1. **Enlaces entrantes.** Instagram, un directorio de glamping, un grupo de
   bioconstrucción. Sin eso tarda meses.
2. **Google Search Console.** Gratis, desde el navegador. Hace que Google lo mire
   en días en lugar de semanas.
3. **Los precios.** La gente busca "yurta precio". Quien llegue y no encuentre
   ningún número se va.

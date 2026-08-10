# CAMBIOS · el panel edita el contenido del sitio · 10 de agosto de 2026

## Qué subir · 4 archivos

| Archivo | Qué cambió |
|---|---|
| `admin.html` | **sección nueva: Contenido del sitio**, con la galería para elegir imágenes |
| `nucleo.js` | sello de versión `nucleo-3` |
| `sw.js` | **VERSION a `cy-shell-v3`** — cambiaron dos archivos del SHELL |
| `index.html` | arreglo del video de la portada |

`firebase-init.js`, `manifest.json`, los iconos, `contenido.json`, `REGLAS.txt`,
`sembrar.html` y `assets/` **no cambian**.

Después de subir, **cerrá la app instalada y volvé a abrirla** con señal, para que tome el
service worker nuevo.

---

## 1 · El video de la portada

No era el service worker esta vez: era **una regla de CSS mía**. Había puesto que si el
sistema pide reducir las animaciones, el video se esconda y quede la foto.

El problema: **el ahorro de batería de Android activa esa preferencia**. Con el teléfono
bajo de carga —en tus capturas estaba en 7% y 13%— el video desaparecía. Por eso "en algún
momento se movía": se movía cuando tenías batería.

Ahora:

- El video se queda siempre.
- Se pide la reproducción **explícitamente** con JavaScript, porque el autoplay silencioso
  igual lo pueden bloquear el ahorro de datos o una política del navegador, sin avisar.
- Si lo bloquean, aparece un botón discreto **▶ Ver en movimiento** sobre la portada.
- Y hay un segundo intento con el primer toque en la página: algunos navegadores sólo
  permiten reproducir después de una interacción.

Si tenés el ahorro de batería puesto, va a aparecer el botón en lugar de arrancar solo. Eso
es deliberado: el sistema pidió menos movimiento y la decisión queda en tus manos.

---

## 2 · Contenido del sitio · la sección nueva

Botón **✎** arriba a la derecha, junto a 👥 y 🩺. Lo ven admin y editor; el fotógrafo no.

**Qué hace:**

- Los **130 textos agrupados por sección** de la página: Portada, La idea, El proceso,
  Trayectoria, Diferencial, Interior, Oferta, Co-construcción, Taller y ficha, Contacto.
  Cada grupo se abre y se cierra.
- Cada campo tiene su **nombre en castellano** —"Antetítulo", "Entrada", "Leyenda 7"— y
  abajo su clave técnica, para poder ubicarla si hace falta.
- Botón **ES / FR** arriba: se edita el idioma que estás viendo.
- Las **listas** de las líneas de oferta se editan como texto, un punto por línea.
- La **tabla de diámetros** se edita como texto: una fila por línea, celdas separadas con `|`.
  Ahí van los precios.
- Las **20 imágenes** al final. Tocás una y se abre la galería.
- Abajo, la cuenta de **cambios sin guardar**, y **Guardar** y **Publicar**.

**Guardar y Publicar son distintos, a propósito:**

- **Guardar** escribe el borrador. El visitante no lo ve. Lo puede hacer un editor.
- **Publicar** copia el borrador al sitio. **Sólo un admin.** Pide confirmación.

De dónde lee al abrir: el borrador si existe, si no lo publicado, y si tampoco
`contenido.json`. Te dice cuál está usando arriba.

---

## 3 · La galería

Al tocar una imagen del sitio se abre con el selector de álbum arriba y las fotos en
miniatura. Filtros por etapa y uno para ver sólo **las marcadas como aptas para el
catálogo**.

Tocás una foto y queda puesta en ese lugar del sitio. Hay también **Volver a la imagen
original del sitio**, que quita el reemplazo y vuelve a la de `assets/`.

Si la foto está marcada como que **tiene gente identificable**, pide confirmación antes de
usarla, recordando que publicarla necesita autorización.

---

## Cómo probarlo, en orden

1. Subí los 4 archivos. Cerrá y reabrí la app.
2. Si todavía no corriste `sembrar.html`, corrélo: sin eso la sección de contenido lee del
   repositorio y al guardar recién crea el borrador. Funciona igual, pero conviene sembrar
   primero.
3. Entrá a **✎**, abrí Portada, cambiá una palabra del título.
4. **Guardar**. Abrí el sitio: **todavía no cambió**, porque es borrador. Así tiene que ser.
5. Volvé y tocá **Publicar**. Recargá el sitio: ahora sí.
6. Probá **FR** y comprobá que los textos son los franceses.
7. Abrí una imagen y probá la galería. Si no tenés álbumes con fotos, te lo va a decir.

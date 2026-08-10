# CAMBIOS · una sola autoridad para el contenido · 10 de agosto de 2026

## Qué subir · 2 archivos, a la raíz

| Archivo | Qué cambió |
|---|---|
| `index.html` | **el JSON del repositorio pasa a mandar**, y `?borrador=1` muestra la vista previa |
| `admin.html` | orden de los campos arreglado, y sale el botón Publicar |

No cambian: `firebase-init.js`, `nucleo.js`, `sw.js`, `manifest.json`, los iconos,
`REGLAS.txt`, `sembrar.html` ni `assets/`.

**Tu `contenido.json` exportado está correcto:** 130 claves, estructura intacta, la
tabla de diámetros bien anidada, y una sola diferencia con el del repositorio — tu
edición de `id.title`. Podés subirlo cuando quieras.

---

## Lo que estaba mal, y era mío

Vos me dijiste: **el sitio levanta del JSON, y Firestore es para que la edición no
se pierda hasta reemplazar el JSON a mano.** Yo dejé el `index.html` leyendo
**Firestore primero**. Eso es una trampa: si la base tiene una versión y el
archivo otra, el sitio muestra la de la base y parece que subir el archivo no
sirvió de nada.

Ahora el circuito es de una sola dirección, sin ambigüedad:

```
editás en el panel
  → Guardar        deja los cambios en la base para que no se pierdan
  → Exportar JSON  descarga el archivo
  → lo subís al repositorio
  → cambia el sitio
```

**El `contenido.json` del repositorio es lo publicado. Firestore es el cuaderno de
trabajo.** El sitio no lee la base nunca, salvo que se lo pidas.

## Vista previa antes de subir

```
https://casayourte.github.io/CasaYourte/?borrador=1
```

Lee el borrador de la base y muestra cómo quedaría, con una barra arriba que avisa
que eso todavía no está publicado. Sirve para revisar en el celular antes de tocar
el repositorio.

## El botón Publicar se fue

Escribía en `sitio/publicado`, un documento que ahora nadie lee. Una función que
no hace nada visible es peor que no tenerla: se toca, parece que funcionó, y el
sitio no cambia. Publicar ahora es **Exportar JSON y subirlo**.

Si más adelante querés publicar con un toque, se puede — pero implica que el sitio
vuelva a depender de Firestore, que es justamente lo que decidimos evitar.

## El desorden de los campos

En el panel te aparecía **Párrafo 1 antes que Título**, y el JSON exportado salía
con las claves mezcladas.

La causa: **Firestore devuelve los campos de un mapa en su propio orden**, no en el
que se escribieron. Al volver a cargar el borrador, se perdía el orden de la
página.

Ahora el panel toma el orden del `contenido.json` del repositorio como referencia y
lo respeta al mostrar y al exportar. Lo probé con tu archivo exportado: las 130
claves se reordenan correctamente, `id.*` vuelve a quedar
`eyebrow, title, b1, b2, b3, k`, no se pierde ninguna, y tu edición se conserva.

Efecto secundario útil: el diff en GitHub va a mostrar sólo la línea que cambiaste,
en lugar de un archivo entero reordenado.

## Y el diagnóstico ahora te dice si falta publicar

La prueba **Contenido del sitio** compara el borrador de la base con el
`contenido.json` del repositorio y dice cuántos textos tenés editados sin publicar.
Si dice "al día", lo que ves en el sitio es lo que hay en la base.

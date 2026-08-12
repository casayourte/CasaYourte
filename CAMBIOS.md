# CAMBIOS · documentación al día · 12 de agosto de 2026

## Qué subir · 2 archivos, a la raíz

| Archivo | Qué cambió |
|---|---|
| `README.md` | reescrito. Faltaban 5 archivos y decía la dirección vieja |
| `GUIA-ANDROID.md` | la lista de archivos al día, y los **dos** dominios en Firebase |

Nada de código. Ningún otro archivo cambió, no hace falta tocar `sw.js`.

---

## Qué estaba mal en el README

Era de hace dos días y no mencionaba **cinco archivos** que ya están en el repositorio:

```
album.html        la página pública de álbumes
editar.html       el editor sobre la página real
sembrar.html      uso único, para sembrar el contenido
CNAME             el dominio
firebase-init.js  estaba, pero sin explicar que es el único que toca gstatic
```

Decía `casayourte.github.io/CasaYourte/` en lugar del dominio propio, y hablaba de 130
textos cuando ahora son 143.

## Qué dice ahora

- Las **cuatro direcciones**: sitio, álbumes, panel y editor.
- Los archivos agrupados por para qué sirven, no en una lista suelta.
- **El circuito del contenido** en cinco líneas: editar → guardar → exportar → subir →
  cambia el sitio. Con la frase que importa: *el `contenido.json` del repositorio es lo
  publicado, Firestore es el cuaderno de trabajo.*
- **Los dos caminos para editar** y qué hace cada uno: `editar.html` para tocar la página,
  el panel para las listas y la tabla de precios.
- **Los dos caminos para cambiar una imagen**, que hacen cosas distintas: elegir del álbum
  deja un reemplazo, subir a `assets/` cambia el respaldo para todos.
- La regla de subir la `VERSION` de `sw.js`, **y también los sellos** `PANEL` y `EDITOR`.
  Con la línea que nos costó dos vueltas: *si algo se comporta raro sin motivo, lo primero
  es el sello, no la configuración.*
- Las direcciones de trabajo: `?dev=1`, `?borrador=1`, `?lang=fr`.

## Y una corrección en la guía

El paso de Firebase decía agregar **un** dominio autorizado. Ahora dice agregar **los dos**:
`casayourte.com` y `casayourte.github.io`.

Conviene dejar el de GitHub mientras las dos direcciones funcionen: si el DNS del dominio
tarda o se cae, el panel sigue entrando por la otra. Con uno solo, un problema de DNS te
deja afuera de tu propio panel.

# Configuración completa desde el celular

Todo esto se hace desde Android, con Chrome. No hace falta computadora en ningún paso.

Orden: **A** subir los archivos, **B** publicar el sitio, **C** Firebase, **D** Cloudinary,
**E** probar. Unos 40 minutos la primera vez.

Conviene hacerlo con wifi y el celular cargando. La subida de `assets/` son 5 MB.

---

# A · Subir los archivos a GitHub

Repositorio: `github.com/casayourte/CasaYourte`

## A1 · Los seis archivos de la raíz

En el repositorio: **Add file → Upload files**.

Toca *choose your files* y seleccioná los seis juntos desde tu gestor de archivos:

```
index.html        album.html       admin.html
editar.html       sembrar.html     contenido.json
firebase-init.js  nucleo.js        sw.js
manifest.json     CNAME            REGLAS.txt
README.md         GUIA-ANDROID.md
```

Y los tres iconos: `icono-192.png`, `icono-512.png`, `apple-touch-icon.png`.

Abajo, en *Commit changes*, escribí `primera carga` y toca **Commit changes**.

> Si el selector de archivos no te deja marcar varios, mantené presionado el primero y
> después tocá los demás. En algunos gestores hay que entrar por *Archivos* y no por
> *Galería*.

## A2 · Crear la carpeta assets

GitHub no permite crear una carpeta vacía, así que se crea con un archivo adentro.

**Add file → Create new file.** En el nombre escribí exactamente:

```
assets/.gitkeep
```

Al escribir la barra, GitHub crea la carpeta sola. Dejá el contenido vacío y toca
**Commit changes**.

## A3 · Subir las 34 imágenes y el video

Entrá a la carpeta `assets` recién creada. Ahora **Add file → Upload files** dentro de ella.

Seleccioná los 34 archivos de `assets/`. Si el celular se traba con todos juntos, hacelo en
dos tandas: primero las que empiezan con letra, después las `p01` a `p12`.

Commit: `imagenes y video`.

Cuando termine, la carpeta tiene que mostrar **35 elementos** (los 34 más el `.gitkeep`).

---

# B · Publicar el sitio

**Settings** (arriba, puede estar en el menú ☰) → en la columna izquierda **Pages**.

- *Source*: **Deploy from a branch**
- *Branch*: **main**, carpeta **/ (root)**
- **Save**

Esperá dos o tres minutos. Después andá a **Actions** y fijate que el último trabajo tenga
un tilde verde.

Tus dos direcciones:

```
Sitio:  https://casayourte.com/
Panel:  https://casayourte.com/admin.html
```

**Ojo con las mayúsculas:** `CasaYourte` va con C y Y mayúsculas. La dirección distingue.

**Agregá las dos a la pantalla de inicio.** En Chrome: menú ⋮ → *Agregar a la pantalla
principal*. El panel te va a quedar como una app.

---

# C · Firebase

Consola: `console.firebase.google.com`, proyecto **casayourte**.

## C0 · Verificar el identificador del proyecto

En tus capturas, arriba a la izquierda el proyecto se llama **casayourte**. Pero la
configuración que me pasaste dice `projectId: "casayourte-mauro"`.

Lo más probable es que las dos cosas sean correctas: Firebase muestra el **nombre visible**
en el selector de arriba, y el **identificador** es otro. Pero hay que confirmarlo, porque si
el identificador está mal, el panel no se conecta a nada y los errores no lo dicen claro.

Andá a **⚙ Configuración del proyecto → General** y mirá **ID del proyecto**.

- Si dice `casayourte-mauro`, no toques nada.
- Si dice otra cosa, avisame y te paso el `admin.html` corregido. Son seis líneas al principio
  del archivo, también lo podés editar vos desde GitHub.

Mientras estés ahí, bajá a *Tus apps* y comparé los seis valores con los del `admin.html`.

## C1 · Dominios autorizados

Sin este paso el panel no te va a dejar entrar.

**Authentication → Settings → Authorized domains → Add domain**, y agregá **los dos**:

```
casayourte.com
casayourte.github.io
```

El primero es el dominio propio. El segundo conviene dejarlo mientras las dos direcciones
funcionen: si el DNS del dominio se cae o tarda, el panel sigue entrando por la de GitHub.

## C2 · Tu usuario ya está

Ya tenés en Firestore la colección `usuarios`, con un documento cuyo ID es tu UID y los
campos `activo: true`, `email`, `nombre`, `rol: "admin"`. Eso está completo.

Verificá que también exista tu cuenta en **Authentication → Users** con el mismo mail. Si no
está, creala ahí con **Add user** y usá esa contraseña para entrar al panel.

> Importante: el documento de Firestore y la cuenta de Authentication son dos cosas
> distintas. El ID del documento tiene que ser **exactamente el UID** que aparece en
> Authentication.

## C3 · Las reglas de seguridad

Es el paso que no se puede saltear. Sin esto, cualquiera puede escribir tu base.

**Firestore Database → pestaña Reglas.**

Abrí en otra pestaña el archivo `REGLAS.txt` del repositorio, tocá el botón de copiar,
volvé a las reglas, borrá todo lo que haya y pegá. **Publicar**.

Lo que hacen: los permisos se leen de `usuarios/{uid}`, nadie puede ponerse admin a sí
mismo, vos no podés suspenderte por accidente, y los álbumes son de lectura pública.

---

# D · Cloudinary

Panel: `cloudinary.com`, cuenta de casayourte@gmail.com.

**Settings → Upload → Upload presets → Add upload preset.**

| Campo | Valor |
|---|---|
| Preset name | `casayourte_movil` |
| Signing mode | **Unsigned** |
| Folder | vacío |
| Allowed formats | `jpg, jpeg, png, webp, heic` |
| Max file size | `12000000` |
| Unique filename | activado |

**Guardar.** El nombre tiene que ser exactamente `casayourte_movil`, porque es el que está
escrito en `admin.html`.

> En el celular el panel de Cloudinary es incómodo. Si no encontrás *Upload presets*, tocá
> el engranaje de arriba y buscá *Upload*. A veces conviene pedir *Sitio de escritorio* en el
> menú de Chrome.

---

# E · Probar, en este orden

## E0 · El diagnóstico del panel

El panel tiene un botón **🩺** arriba a la derecha. Probá con eso primero: revisa las cinco
conexiones y, si algo falla, dice exactamente qué arreglar. Es lo más rápido y no cambia
ninguno de tus datos.

Las cinco pruebas: proyecto de Firebase, tu usuario y rol, leer álbumes, escribir en
Firestore, y el preset de Cloudinary.

La prueba de Cloudinary sube una imagen de 8 píxeles a una carpeta `__prueba__`. La podés
borrar desde el panel de Cloudinary cuando quieras, o dejarla.


**E1 · El sitio.** Abrí `https://casayourte.com/`
Tiene que verse el video de portada, las fotos, y el botón de francés arriba a la derecha.
Si las fotos no cargan, algún nombre de `assets/` está mal escrito.

**E2 · El panel sin entrar.** Abrí `admin.html`. Tiene que pedirte mail y contraseña.

**E3 · Entrar.** Con tu mail y la contraseña de Authentication. Tiene que aparecer arriba a
la derecha el botón de usuarios 👥 y abajo tu nombre con el rol.

**E4 · Que las reglas funcionen de verdad.** En Firestore, cambiá tu `activo` a `false`,
recargá el panel: te tiene que echar diciendo que el acceso está suspendido. Volvelo a
`true`.

Si en E4 **no** te echa, las reglas no se publicaron y la base está abierta. No sigas hasta
resolverlo.

**E5 · Subir una foto.** Creá un álbum de prueba, elegí una etapa y subí **tres fotos, no
cincuenta**. Fijate que aparezcan y que se puedan reordenar con las flechas.

Si falla con *Upload preset not found*, el nombre del preset no coincide con el paso D.

---

# Cómo cambiar cosas después, siempre desde el celular

**Cambiar un texto del sitio.** Abrí `contenido.json` en GitHub, tocá el lápiz ✏️, buscá la
clave, editá y **Commit changes**. Cuidado de no romper las comillas ni las comas.

**Cambiar una imagen del catálogo.** Entrá a `assets/`, abrí la imagen que querés reemplazar,
menú ⋮ → *Delete file* → commit. Después **Upload files** con la nueva, **con el mismo
nombre**.

**Cargar fotos de obra.** Por el panel, no por GitHub. Van a Cloudinary.

**Cambiar el código.** Pedime el archivo nuevo y lo subís encima del anterior.

---

# Todo desde el navegador · nada que instalar

Este proyecto no tiene herramientas de escritorio. No hay nada que instalar, ni terminal,
ni npm, ni programas. Todo se hace en el navegador del celular:

| Tarea | Dónde |
|---|---|
| Subir o reemplazar archivos | GitHub, **Add file → Upload files** |
| Editar un texto del sitio | GitHub, abrir `contenido.json` y tocar el lápiz ✏️ |
| Borrar un archivo | GitHub, abrir el archivo, menú ⋮ → *Delete file* |
| Cargar fotos de obra | el panel, `admin.html` |
| Crear usuarios y roles | el panel, botón 👥 |
| Reglas de seguridad | consola de Firebase, pestaña Reglas |
| Preset de subida | panel de Cloudinary, Settings → Upload |
| Revisar que todo ande | el panel, botón 🩺 |

**Consejo para el editor de GitHub en el celular:** al editar `contenido.json`, girá el
teléfono a horizontal. El editor da más ancho y se ven las comillas y las comas, que son
lo único que se puede romper en ese archivo.

Si alguna vez editás el JSON y el sitio deja de mostrar textos, es una coma o una comilla.
GitHub guarda el historial: entrá al archivo, tocá *History*, y volvé a la versión
anterior.

# Resumen de las direcciones y nombres

| Qué | Valor |
|---|---|
| Repositorio | `github.com/casayourte/CasaYourte` |
| Sitio | `casayourte.com/` |
| Panel | `casayourte.com/admin.html` |
| Dominio en Firebase | `casayourte.com` |
| Proyecto Firebase | `casayourte` |
| Cloudinary cloud | `kbjqcnpa` |
| Upload preset | `casayourte_movil` |

El `api_secret` de Cloudinary **no aparece en ningún archivo de este repositorio**, y así
tiene que quedar. El panel sube con el preset unsigned, sin secret.

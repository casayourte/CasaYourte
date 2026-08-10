# CAMBIOS · corrección del panel

## Qué subir

| Archivo | Va en el repositorio |
|---|---|
| `admin.html` | raíz, reemplaza el actual |
| `GUIA-ANDROID.md` | raíz, reemplaza el actual |

Nada más. Ninguna imagen cambió.

Para reemplazar desde el celular: abrí `admin.html` en GitHub → menú ⋮ → **Delete file** →
commit. Después **Add file → Upload files** con el nuevo.

## Los tres arreglos

**1 · El error `failed-precondition`.** Los álbumes se leían con una consulta ordenada, y
Firestore pedía un índice para eso. Ahora se leen sin ordenar y el orden se hace en el
celular. No hace falta crear ningún índice, ni ahora ni cuando haya cien álbumes.

**2 · El identificador ya no obliga a un formato.** Antes exigía año-lugar-diámetro metido
dentro del nombre, y encima no había dónde poner esos datos. Ahora:

- El **nombre visible** es libre: "yurta doble techo" funciona.
- El **identificador** se genera solo a partir del nombre y se puede editar.
- **Año, diámetro y lugar** son campos aparte, opcionales, y sólo aparecen si el tipo es Obra.

Los tres se muestran en la lista de álbumes y en el encabezado de cada uno.

**3 · Diagnóstico.** Botón 🩺 arriba a la derecha. Prueba cinco cosas y dice qué arreglar en
cada caso, con palabras en lugar de códigos:

- Proyecto de Firebase
- Tu usuario, tu rol y si `activo` es realmente boolean
- Leer álbumes
- Escribir y borrar en Firestore
- El preset de Cloudinary, subiendo una imagen de 8 píxeles a una carpeta `__prueba__`

Y todos los mensajes de error del panel ahora están traducidos. `permission-denied` ya no
dice `permission-denied`: dice qué revisar.

## Sobre Cloudinary

No hace falta adivinar si quedó configurado. Entrá al panel, tocá 🩺 y **Probar todo**. La
última fila te lo dice, y si el preset no existe o no es unsigned te da los pasos exactos.

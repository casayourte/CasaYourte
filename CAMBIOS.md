# CAMBIOS · sembrar el contenido en Firestore · 10 de agosto de 2026

## Qué subir · 2 archivos

| Archivo | Nuevo o cambia | Qué |
|---|---|---|
| `sembrar.html` | **nuevo** | página de uso único: copia los textos a Firestore |
| `index.html` | cambia | aprende a leer los valores que no son texto |

Nada más. `admin.html`, `nucleo.js`, `sw.js`, `firebase-init.js`, `manifest.json`, los
iconos, `contenido.json`, `REGLAS.txt` y `assets/` **no cambian**.

**No hace falta subir la VERSION de `sw.js`**: `index.html` no está en el SHELL.

---

## Antes de sembrar: las reglas

`sembrar.html` escribe en `sitio/`. Si las reglas que tenés publicadas son de antes de la
colección `sitio`, la escritura va a fallar con permiso denegado.

Verificá que en la consola de Firebase, en Firestore → Reglas, exista este bloque:

```
match /sitio/{doc} {
  allow read: if true;
  allow write: if editor();
}
```

Si no está, pegá de nuevo el `REGLAS.txt` completo y publicá.

---

## Cómo se usa

1. Subí los dos archivos.
2. Abrí `https://casayourte.github.io/CasaYourte/sembrar.html`
3. Entrá con tu cuenta de administrador.
4. Te muestra qué va a sembrar: **130 claves en español y 130 en francés**.
5. **Sembrar ahora.** Escribe `sitio/publicado` y `sitio/borrador`.
6. Verifica solo, leyendo por la misma vía que usa el sitio público, sin sesión.
7. Abrí el sitio: **tiene que verse exactamente igual que antes.** Si se ve igual, está
   leyendo de la base.
8. **Borrá `sembrar.html` del repositorio.** Abrilo en GitHub → menú ⋮ → *Delete file*.

## Por qué se borra después

No es peligrosa por sí misma, pero **si se vuelve a correr después de haber editado desde
el panel, pisa esas ediciones** con el contenido del repositorio. Corre una vez y se va.

---

## El problema técnico que hubo que resolver

**Firestore no admite arrays dentro de arrays**, y tu tabla de diámetros
(`ficha.rows`) es justamente eso: una lista de filas, donde cada fila es una lista de
celdas. Escribirla tal cual daba `invalid-argument`.

Convención adoptada: **los valores que no son texto se guardan como una cadena que empieza
con `json:`**, y el sitio los reconstruye al leer. Son 5 por idioma: las cuatro listas de
las líneas de oferta y la tabla de diámetros. Las otras 125 claves son texto y viajan
tal cual.

Por eso `index.html` cambia: aprende a decodificar esa marca.

**Segundo detalle, para cuando construyamos el editor:** las 130 claves tienen puntos
(`hero.t1`, `d4.b`). Firestore los acepta como claves de un mapa, pero interpreta el punto
como separador de ruta en `updateDoc`. Regla: **el mapa de textos se escribe siempre
completo con `setDoc`, nunca con `updateDoc` de una clave punteada.**

---

## Después de esto

El sitio pasa a leer su contenido de la base, con `contenido.json` como respaldo y los
textos internos como último respaldo. Los tres niveles quedan operativos de verdad.

Y el panel ya tiene de dónde leer y dónde escribir: falta construirle la pantalla de
contenido y la galería, que es lo que sigue.

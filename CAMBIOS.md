# Qué subir · 10 de agosto de 2026

Este zip es **el repositorio completo**, tal como tiene que quedar. Todo se sube desde el
navegador del celular. **No hay nada que instalar.**

## Si ya subiste los archivos antes

Cambiaron **cuatro**. Los demás están iguales y no hace falta tocarlos.

| Archivo | Qué cambió |
|---|---|
| `admin.html` | arreglo del error al listar álbumes, campos de año/diámetro/lugar, y el diagnóstico 🩺 |
| `GUIA-ANDROID.md` | sale la parte de Termux; entra la tabla de "todo desde el navegador" |
| `README.md` | aclara que no hay herramientas de escritorio |
| `CAMBIOS.md` | este archivo |

**`assets/` no cambió.** No toques esa carpeta: son 34 archivos y 5 MB.

Cómo reemplazar uno: abrilo en GitHub → menú ⋮ → **Delete file** → *Commit*. Después
**Add file → Upload files** con el nuevo.

## Si es la primera vez

Seguí `GUIA-ANDROID.md`, que va paso a paso. En resumen:

1. **Add file → Upload files** con los seis archivos de la raíz:
   `index.html`, `admin.html`, `contenido.json`, `README.md`, `REGLAS.txt`, `GUIA-ANDROID.md`
2. **Add file → Create new file**, nombre `assets/.gitkeep`, contenido vacío, *Commit*.
   Al escribir la barra, GitHub crea la carpeta.
3. Entrá a `assets/` y **Add file → Upload files** con los 34 archivos. Si el celular se
   traba, en dos tandas.
4. **Settings → Pages** → *Deploy from a branch* → `main` → `/ (root)` → *Save*.

## Todo lo demás se configura en el navegador

| Qué | Dónde | Guía |
|---|---|---|
| Dominio autorizado | consola de Firebase → Authentication → Settings | paso C1 |
| Reglas de seguridad | consola de Firebase → Firestore → Reglas | paso C3, pegar `REGLAS.txt` |
| Preset de subida | panel de Cloudinary → Settings → Upload | paso D |
| Verificar que todo ande | el panel, botón 🩺 | paso E0 |

## Lo que se retiró

Existían unos scripts de Node en una carpeta `media/` para cargar fotos en lote desde una
computadora. **Se retiraron:** necesitaban terminal y npm, y nunca se pudieron correr. Lo
que hacían lo hace el panel desde el celular.

También salió de la guía la sección de Termux, por la misma razón.

## Direcciones

```
Sitio:  https://casayourte.github.io/CasaYourte/
Panel:  https://casayourte.github.io/CasaYourte/admin.html
```

Con C y Y mayúsculas: la dirección distingue.

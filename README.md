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
| ~~**1**~~ | ~~El catálogo manda~~ **· HECHO el 2026-09-08.** Nace `idiomas.js`, script clásico sin dependencias que comparten `index.html` y `album.html`. Sumar un idioma es **pegar una línea** en su catálogo | ✅ Verificado en un navegador real: 10 casos, todos pasan, sin errores de JS. Ver abajo |
| ~~**2**~~ | ~~La pantalla de traducción, para N~~ **· HECHA el 2026-09-08.** Se traduce a **un idioma por vez**, elegido en una fila que solo aparece cuando hay más de uno. Las piezas llevan un mapa `tr` de traducciones en vez de un campo `fr`, y el registro de procedencia pasa a ser por idioma | ✅ Verificada de punta a punta contra un Firebase de mentira. Ver abajo |
| **3** | **El editor.** `editar.html` ya tiene chips de idioma; que salgan del catálogo en vez de estar escritos | Ídem |
| **4** | **Entra el inglés.** Recién acá se suma `"en"` al catálogo, y empieza el trabajo de contenido con el orden de abajo | Los 143 textos, con el diagnóstico y la revisión del sitio publicado |

### Lo que hizo la tanda 1, y lo que encontró

`fr` estaba escrito a mano en una decena de lugares, y **la misma maquinaria de idioma
estaba copiada palabra por palabra en `index.html` y en `album.html`** — `ZONAS_FR`,
`idiomaDeducido`, `idiomaElegido`, `idiomaInicial`. Todo eso vive ahora en `idiomas.js`.

Tres decisiones que conviene no deshacer, explicadas en su cabecera: **es un script
clásico y no un módulo** (las dos páginas corren con `<script>` a secas; un módulo les
cambiaría el orden de arranque), **no depende de nada** (el idioma se decide antes de que
llegue el contenido) y **el conmutador se arma desde el catálogo antes de atar los
escuchadores**.

**Lo que encontró al probarlo con un tercer idioma de mentira** —y es lo que hace que la
tanda 4 no vaya a romper nada—:

- **`paint()` reventaba** si el idioma no tenía textos propios: la página quedaba en
  blanco en vez de mostrar el español. Ahora los textos se completan **clave por clave**
  con el idioma fuente, así que un idioma traducido a medias se publica sin dejar huecos.
  Es la misma decisión que ya estaba tomada para las etapas y las leyendas, y que faltaba
  para los textos.
- **Cinco lugares más leían los textos sin respaldo**, y dos los escribían asumiendo que
  el idioma ya existía. Todo pasa ahora por una sola función `textos(idioma)`.

### Lo que hizo la tanda 2, y lo que encontró

El cambio de fondo no es de nombres: **`ORIGEN` guardaba «el español con el que se
tradujo» por pieza, sin idioma**. Con dos idiomas destino eso no alcanza — el español
puede corregirse después de traducir al francés y antes del inglés. Ahora es
`origenPorIdioma`, un campo nuevo en `sitio/traduccion`; el viejo `origen` se sigue
leyendo y manteniendo al día.

Y las instrucciones para quien traduce pasaron al catálogo: *«traducí el uso, no la
palabra; tratamiento de usted»* es del **idioma**, no de la herramienta. El glosario
también, porque los términos del oficio no se traducen igual en todos.

**Dos errores que encontró la revisión, y el primero era serio:**

- **`origen` se hubiera pisado entero en el primer guardado.** `ORIGEN.fr` arranca
  vacío y solo se llena con lo que se toca; escribirlo tal cual habría borrado el
  registro de todas las piezas no tocadas en esa sesión — o sea justo lo que distingue
  «traducido y al día» de «el español cambió después». Ahora el registro nuevo se
  **siembra** con el viejo al leer.
- **La huella vieja daba por al día un idioma que nunca se tradujo.** `huellas` se
  escribió cuando el único destino era el francés: solo se consulta para francés.

### Cómo se verificó

Con las dos páginas servidas y un navegador de verdad, no leyendo el código:

| Caso | Esperado |
|---|---|
| Portada, teléfono en español | ES |
| Portada, teléfono en francés | FR |
| Portada, teléfono en español y zona horaria de París | FR |
| Portada `?lang=fr` | FR |
| Portada `?lang=es` con teléfono en francés | ES (lo explícito gana) |
| Portada `?edit=1` con teléfono en francés | ES (modo edición) |
| Álbum, y álbum `?lang=fr` | ES / FR |
| Tocar FR | cambia el texto, la URL suma `lang=fr`, el enlace al álbum se lo lleva |
| Tocar ES de vuelta | vuelve el texto y la URL pierde `lang` |

Los diez pasan, sin un solo error de JavaScript. **Y la prueba de que la tanda sirvió:**
agregando `{ id: "en", ... }` al catálogo —una línea— aparecen los tres botones, la
detección por idioma del teléfono elige inglés y `?lang=en` funciona, en las dos páginas.
Esa línea se sacó: el inglés entra en la tanda 4, con sus textos.

### La tanda 2, y por qué hizo falta un banco de pruebas

**Se entregó rota.** Parseaba, cargaba sin errores y el catálogo le llegaba — pero
quedaba una referencia suelta a `fr` en el cálculo de avisos, y la pantalla moría con
«fr is not defined» apenas se apretaba el botón. **Lo que falló no fue el cambio: fue la
verificación.** Se había comprobado lo que se podía comprobar sin sesión, y justo la
lógica que no se ejecutó era la que tenía el error. Es el § 11 del protocolo común
diciendo lo mismo otra vez: **parsear no es correr.**

La corrección de fondo fue armar un **banco de pruebas**: una copia del sitio con un
`firebase-init.js` de mentira —un usuario fijo, unos documentos inventados, `setDoc` que
guarda en memoria— servida en local y abierta con un navegador de verdad. Con eso la
pantalla corre entera sin sesión y sin red, y se puede mirar el resultado.

**El banco vive fuera del repositorio**, y es a propósito: este proyecto no tiene build
ni `npm` (§ 1), y un `firebase-init.js` falso adentro sería una trampa esperando a
alguien. Se rearma en un minuto: copiar el sitio a una carpeta aparte, reemplazar ese
único archivo, servir con `python3 -m http.server` y abrir.

**Lo que el banco probó, y no se podía probar de otra forma:**

| Prueba | Resultado |
|---|---|
| La pantalla corre entera | 145 piezas, contadores calculados, exportación armada |
| Con dos idiomas | 145 · 1 sin traducir · 1 viejo · 143 al día · la fila de idioma **oculta** |
| Con tres idiomas | **exactamente los mismos números** · la fila aparece con FR y EN |
| Al pasar a inglés | **145 en «sin traducir», 0 al día** — prueba el arreglo de las huellas: sin él, las piezas con huella vieja habrían salido «al día» en un idioma que nunca se tradujo |
| «Dar por al día», y mirar qué se escribe | 144 claves en `origen`, **conserva las 3 del registro viejo, 3 de 3** — prueba que el arreglo del sembrado evita la pérdida de datos |

Aun así, al abrirla la primera vez conviene mirar que **los cuatro contadores den los
mismos números que antes**. El banco usa datos inventados; los de verdad son los tuyos.

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

### «Al día» tenía que significar algo · `traducir-12`

Al mirar la exportación real de `traducir-11` aparecieron **cinco piezas de álbum
marcadas «al día» cuyo francés dice otra cosa que el español**:

| Pieza | Español | Francés |
|---|---|---|
| `etapa:yurta-uruguay:04-trei:nombre` | Segunda versión | trei |
| `etapa:yurta-simona-y-antonio:01-terreno-y-apoyos:nombre` | Paisaje | terrain et appuis |
| `etapa:yurta-7m-toono-1m:02-taller-piezas:nombre` | taller y transporte | atelier · pièces |
| `etapa:yurta-doble-techo:06-toono:nombre` | toono y triangulos | toono |
| `etapa:doble-techo-1er-prototipo:04-trei:nombre` | trei y anillo | trei |

**No es que la pantalla se equivocara: es que decía «hecho» donde tenía que decir «no
sé».** Los tres caminos que sabe mirar —lo que anota la propia pantalla, la huella del
registro viejo, y la comparación contra `contenido.json`— no aplican a los álbumes: los
álbumes nunca estuvieron en el respaldo. Sin ninguno de los tres, la pieza caía en
«hecho» por eliminación.

**Lo que cambió:**

- **Un cuarto estado, «sin registro».** Hay traducción, y nada dice con qué español se
  hizo. Tiene su propio contador. El archivo que va al chat dice el estado con palabras,
  no con la etiqueta interna, así que quien traduce lee «no hay registro… comprobá que
  diga lo que dice el español de ahora» en vez de un `hecho` que no era cierto.
- **El respaldo ahora da un veredicto, no una sospecha.** Antes devolvía «el español
  viejo» o `null`, y el `null` mezclaba dos cosas muy distintas: *el español no se movió*
  (que es evidencia buena) con *se movieron los dos, no se sabe*. Separadas, la segunda
  pasa a «sin registro».
- **«Dar por al día» dejó de ser un solo toque.** Pregunta aparte por las de «sin
  registro» —anotarlas es decir que están bien sin haberlas mirado— y se puede decir que
  no y anotar sólo el resto.
- **Y dejó de pisar las advertencias.** Hasta `traducir-11` el botón anotaba **todas** las
  piezas traducidas, incluidas las marcadas «el español cambió», con el español de ahora:
  un toque borraba justamente las advertencias que esta pantalla existe para dar, y el
  cartel decía «no cambia ningún texto» sin avisar de eso. Ahora no las toca.

**El costo, y es a propósito:** el contador «al día» baja mucho de golpe, porque casi
todas las piezas de álbum pasan a «sin registro». Ese número es el honesto — el de antes
contaba como comprobado lo que nadie había comprobado.

**Verificado en el banco de pruebas**, con datos armados para que cada estado tenga al
menos una pieza:

| Prueba | Resultado |
|---|---|
| Los cuatro estados se separan | 2 sin traducir · 2 «el español cambió» · **5 «sin registro»** · 2 al día |
| Las que antes se colaban | `ambos_movidos` y las 3 piezas de álbum salen «sin registro», no «hecho» |
| Las que sí tienen evidencia | siguen «al día»: la que tiene registro propio y la que el respaldo confirma |
| Primer cartel de «Dar por al día» | avisa que **las 2 marcadas «el español cambió» quedan como están** |
| Segundo cartel | nombra las 5 sin registro y ofrece anotar sólo la que sí se puede comprobar |
| Al decir que no | se anotan **sólo las comprobables**; el registro viejo queda intacto y las 5 siguen sin registro |
| Al decir que sí | las 5 pasan a «al día» — es la decisión de quien aprieta, tomada a la vista |

Las cinco piezas de arriba **siguen mal traducidas**: esta tanda hace que se vean y que
no se puedan congelar por accidente. Corregirlas es trabajo de contenido, y va con el
orden de tres pasos de abajo.

### Los nombres de categoría van en minúscula · `traducir-13`

Al corregir las cinco piezas de arriba apareció que la mayúscula inicial estaba mezclada:
`Segunda versión` y `Paisaje` con mayúscula, `taller y transporte` y `toono y triangulos`
sin. **No hizo falta elegir por gusto**, porque el proyecto ya tenía la convención escrita
en más lugares de los que la contradicen — que es la regla del § 3 del protocolo común:
*cuando el canónico y la realidad no coinciden, gana el que ya está escrito en más
lugares.*

| Dónde | Qué dice |
|---|---|
| `NOMBRE_ETAPA` en `album.html` | las 16 categorías del oficio, en francés, **todas en minúscula** |
| el glosario de `traducir.html` | los mismos 16 términos, **en minúscula de los dos lados** |
| `admin.html` | bautiza cada categoría nueva con `legible(id)`, que da **minúscula** |
| los nombres tipeados a mano por álbum | la mezcla |

**Y en el álbum público no se nota**, porque `.etapa-tit b` los pone en versalita igual.
Eso es justamente por qué conviene que lo diga la pantalla: mirando el sitio nadie lo va a
descubrir nunca; sólo se ve en el panel y en la pantalla de traducción, donde se lee como
descuido.

`traducir.html` suma la regla a las que ya comprueba sola —espacios de más, comillas
rectas, el francés metido en el campo español— y avisa **en los dos idiomas**, porque la
convención vale para los dos. Es un aviso, no un arreglo automático: como todas las demás
de esa lista, la pantalla encuentra y la persona decide.

De paso, un arrastre de la tanda 2: el resumen del paso 4 decía «*N* en francés» con la
palabra escrita a mano. Con el inglés elegido iba a mentir. Ahora dice el idioma que esté
elegido.

**Verificado en el banco:** la regla marca las tres piezas preparadas para eso —una con la
mayúscula en español, una con la mayúscula en los dos idiomas, una sólo en español—, y
**cero falsos positivos**: no se dispara en descripciones ni en textos del sitio.

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
| `sw.js` | `VERSION` | `cy-shell-v32` |
| `admin.html` | `PANEL` | `admin-17` |
| `editar.html` | `EDITOR` | `editar-6` |
| `calculo.html` | `CY.PANEL` | `calculo-8` |
| `usuarios.html` | `CY.PANEL` | `usuarios-3` |
| `diagnostico.html` | `CY.PANEL` | `diagnostico-6` |
| `idiomas.js` | `SELLO` | `idiomas-2` |
| `traducir.html` | `TRADUCTOR` | `traducir-13` |

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

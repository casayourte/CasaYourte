// ═══════════════════════════════════════════════════════════════
//  CASAYOURTE — nucleo.js
//  Lo común a todas las pantallas del panel: pila del botón Atrás,
//  avisos, elección y subida de imágenes, URLs de entrega,
//  permisos y registro del service worker.
//
//  Sello de versión: se muestra en el panel. Existe porque un
//  archivo viejo subido produce síntomas idénticos a un problema
//  de configuración, y sin esto no hay forma de saber qué código
//  está corriendo (Libro 1 §3.12).
// ═══════════════════════════════════════════════════════════════

export const CY = {};

CY.VERSION = 'nucleo-21';

// ═════════════════════════════════════════════════════════════
//  BOTÓN ATRÁS DE ANDROID
//
//  Con la app instalada no hay barra de direcciones: si el Atrás no
//  cierra la capa abierta, expulsa de la aplicación y se pierde lo que
//  se estaba cargando.
//
//  Una sola pila y UN solo listener de 'popstate'. Con un listener por
//  capa, un solo Atrás cerraba todas juntas.
//
//  Uso:
//    const cerrar = CY.capaAtras(() => panel.hidden = true);
//    ...  cerrar();   // desde el botón, desde el fondo, al guardar
// ═════════════════════════════════════════════════════════════
CY._capas = [];
CY._ignorarPop = 0;

CY.capaAtras = function (cerrar) {
  const capa = { cerrar, viva: true };
  CY._capas.push(capa);
  history.pushState({ cyCapa: CY._capas.length }, '');
  return function () {
    if (!capa.viva) return;
    capa.viva = false;
    const i = CY._capas.indexOf(capa);
    if (i >= 0) CY._capas.splice(i, 1);
    // Se saca del historial la entrada agregada al abrir. Ese back()
    // dispara un 'popstate' que NO es del usuario: se ignora, si no
    // cerraría también la capa de abajo.
    if (history.state && history.state.cyCapa) {
      CY._ignorarPop++;
      history.back();
    }
    cerrar();
  };
};

window.addEventListener('popstate', () => {
  if (CY._ignorarPop > 0) { CY._ignorarPop--; return; }
  const capa = CY._capas.pop();
  if (capa && capa.viva) { capa.viva = false; capa.cerrar(); }
});

CY.hayCapas = () => CY._capas.length > 0;

// ═════════════════════════════════════════════════════════════
//  AVISOS
//  Un mensaje largo se queda más tiempo: si explica qué arreglar,
//  tres segundos no alcanzan para leerlo (Libro 1 §6.4).
// ═════════════════════════════════════════════════════════════
CY.aviso = function (texto, malo) {
  let t = document.getElementById('cy-toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'cy-toast';
    document.body.appendChild(t);
  }
  t.textContent = texto;
  t.className = 'on' + (malo ? ' malo' : '');
  clearTimeout(t._h);
  t._h = setTimeout(() => { t.className = ''; }, texto.length > 60 ? 7000 : 3200);
};

// ═════════════════════════════════════════════════════════════
//  ERRORES TRADUCIDOS
//  Desde el celular no hay consola del navegador: un código suelto
//  es un problema de dos minutos convertido en tres días.
// ═════════════════════════════════════════════════════════════
CY.explicar = function (e) {
  const c = (e && e.code) || '';
  const t = {
    'permission-denied':
      'Permiso denegado. Revisá que tu documento en usuarios tenga activo en true (boolean, no texto) y el rol correcto, y que las reglas estén publicadas.',
    'failed-precondition':
      'La consulta pedía un índice. Con esta versión no debería pasar: si lo ves, avisá.',
    'unavailable': 'Sin conexión con Firestore. Probá con mejor señal.',
    'unauthenticated': 'La sesión caducó. Salí y volvé a entrar.',
    'not-found': 'No se encontró el documento.',
    'invalid-argument': 'Algún dato tiene un formato que Firestore no acepta.',
    'resource-exhausted': 'Se agotó la cuota gratuita de Firestore por hoy.',
    'auth/invalid-credential': 'Mail o contraseña incorrectos.',
    'auth/email-already-in-use': 'Ese mail ya tiene cuenta.',
    'auth/weak-password': 'La contraseña necesita al menos 6 caracteres.',
    'auth/invalid-email': 'El mail no es válido.',
    'auth/network-request-failed': 'Sin conexión. Probá con mejor señal.',
    'auth/unauthorized-domain':
      'Falta agregar casayourte.github.io en Firebase → Authentication → Settings → Authorized domains.'
  }[c];
  if (t) return t;
  const m = (e && e.message) || '';
  if (/Cloud Firestore API|not.*enabled/i.test(m))
    return 'La base de Firestore no está creada. Creala en la consola de Firebase.';
  return c || m || 'Error desconocido';
};

// ═════════════════════════════════════════════════════════════
//  TEXTO
// ═════════════════════════════════════════════════════════════
/* Las CINCO, y la quinta no es adorno: sin escapar la comilla simple, un
   apóstrofo dentro de un atributo escrito con comillas simples —«Cañada d'Oro»—
   se sale del atributo y lo que sigue se interpreta como marcado.
   Casa Verde, Rematetaller y el panel ya escapaban las cinco; éste era el único
   de los cuatro que escapaba cuatro. Dos funciones que se llaman igual tienen
   que hacer lo mismo (2026-09-09, primera auditoría de protocolos). */
CY.esc = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

CY.slug = (s) => String(s || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// ═════════════════════════════════════════════════════════════
//  IMÁGENES — camino ÚNICO para toda foto del sistema
//
//  POR QUÉ ESTÁ ACÁ Y NO EN CADA PANTALLA: con accept="image/*" a
//  secas, el sistema decide qué ofrecer y en varios teléfonos —sobre
//  todo dentro de una app instalada— abre el explorador de archivos
//  SIN ofrecer la cámara. El atributo 'capture' hace lo contrario:
//  fuerza cámara y esconde los archivos. NINGÚN input solo da las dos
//  opciones de forma confiable.
//  Solución: DOS inputs y que la persona elija.
//  (Lección heredada de Casa Verde.)
// ═════════════════════════════════════════════════════════════
CY.CLOUDINARY = { cloud: 'kbjqcnpa', preset: 'casayourte_movil' };

// Techo de ancho al ENTREGAR. No toca el archivo guardado.
CY.ENTREGA = 'f_auto,q_auto,w_2000';

// Reducción ANTES de subir (Libro 1 §3.5).
CY.MAX_LADO = 2000;
CY.CALIDAD = 0.85;

/* ── SECUENCIAS Y VIDEOS CORTOS ───────────────────────────────
   Hay tres medios y cada uno tiene su camino:

     foto      · se achica en el teléfono y se sube (§3.5)
     secuencia · GIF animado: se sube TAL CUAL
     video     · se sube tal cual, a la otra punta de Cloudinary

   Por qué el animado no se achica: CY.reducir dibuja la imagen en un
   canvas y la vuelve a codificar en JPEG, y un canvas tiene UN cuadro.
   Hasta hoy, un GIF que pasaba por ahí se subía convertido en una foto
   quieta, sin error y sin aviso — la peor forma de fallar, porque nadie
   la ve hasta que mira el sitio. Ahora se sube entero, y a cambio se le
   ponen límites, que es lo único que queda cuando no se puede achicar.

   DE DÓNDE SALEN LOS NÚMEROS

   · 100 cuadros · no es elegido: es el techo de Cloudinary para
     transformar al vuelo. Un GIF más largo se entrega TRUNCO, sin
     ningún error. Mejor no dejarlo entrar.
   · 8 MB de GIF · decisión nuestra. Un GIF es un formato viejo y pesa
     como diez veces lo mismo en video.
   · 25 MB de video · Cloudinary acepta hasta 100 MB en el plan
     gratuito, PERO sólo transforma al vuelo hasta 40. Un video de 60 MB
     entra a la cuenta y después no se puede entregar achicado: hay que
     pedir la conversión por adelantado, que este sistema no hace. Se
     corta bien por debajo de ese borde.
   · 20 segundos · para que el sitio no se vuelva pesado hay que fijar
     lo que dura, no sólo lo que pesa: un minuto en buena calidad son
     varios megas por más que se entregue optimizado. Veinte segundos
     alcanzan para mostrar cómo se levanta un trei.

   Lo que se ENTREGA es otra cosa y pesa mucho menos que lo guardado:
   f_auto,q_auto,w_900 sobre un video de 20 s deja unos pocos cientos de
   kilobytes. El original queda como respaldo. */
CY.MEDIO = {
  gif:   { maxPeso:  8 * 1024 * 1024, maxCuadros: 100 },
  video: { maxPeso: 25 * 1024 * 1024, maxSegundos: 20 },
};

/* Cuenta los cuadros de un GIF recorriendo su estructura. NO se buscan
   bytes sueltos: el 0x2C que marca un cuadro también aparece dentro de
   los datos comprimidos, y contarlo de ahí daría de más. */
CY.cuadrosDeGif = function (buffer) {
  const b = new Uint8Array(buffer);
  if (b.length < 13) return 0;
  if (String.fromCharCode(b[0], b[1], b[2]) !== 'GIF') return 0;

  let i = 6;
  const packed = b[i + 4];
  i += 7;                                                  // pantalla lógica
  if (packed & 0x80) i += 3 * (1 << ((packed & 7) + 1));   // tabla global

  // Cada sub-bloque dice su largo; el 0 cierra la cadena.
  const saltarSubBloques = () => {
    while (i < b.length) { const n = b[i++]; if (n === 0) return; i += n; }
  };

  let cuadros = 0;
  while (i < b.length) {
    const marca = b[i++];
    if (marca === 0x3B) break;                             // fin
    if (marca === 0x21) { i++; saltarSubBloques(); continue; }   // extensión
    if (marca === 0x2C) {                                  // un cuadro
      cuadros++;
      const p = b[i + 8];
      i += 9;
      if (p & 0x80) i += 3 * (1 << ((p & 7) + 1));         // tabla local
      i++;                                                 // código LZW
      saltarSubBloques();
      continue;
    }
    break;                        // byte inesperado: se corta, no se adivina
  }
  return cuadros;
};

const mb = (n) => (n / 1048576).toFixed(1).replace('.', ',') + ' MB';

/**
 * Cuánto dura un video, leído por el propio navegador antes de subir
 * nada. Si el teléfono no sabe leer ese formato devuelve 0, y entonces
 * el único límite que queda es el peso: no se rechaza por una duración
 * que no se pudo medir.
 */
CY.medirVideo = function (file) {
  return new Promise((listo) => {
    let url;
    const v = document.createElement('video');
    const terminar = (r) => {
      if (url) URL.revokeObjectURL(url);
      v.removeAttribute('src'); listo(r);
    };
    const reloj = setTimeout(() => terminar({ segundos: 0, ancho: 0, alto: 0 }), 6000);
    v.preload = 'metadata';
    v.onloadedmetadata = () => {
      clearTimeout(reloj);
      terminar({ segundos: v.duration || 0, ancho: v.videoWidth, alto: v.videoHeight });
    };
    v.onerror = () => { clearTimeout(reloj); terminar({ segundos: 0, ancho: 0, alto: 0 }); };
    try { url = URL.createObjectURL(file); v.src = url; }
    catch (e) { clearTimeout(reloj); terminar({ segundos: 0, ancho: 0, alto: 0 }); }
  });
};

/**
 * Qué es este archivo y si se puede subir.
 * Devuelve { clase, cuadros, segundos, peso, problema }.
 * clase: 'foto' · 'secuencia' · 'video'
 * Si hay 'problema', no se sube: el texto es para mostrarlo tal cual.
 */
CY.mirarMedio = async function (file) {
  const r = { clase: 'foto', cuadros: 0, segundos: 0, peso: file.size, problema: null };
  const nombre = file.name || '';
  const tipo = file.type || '';

  if (tipo.indexOf('video/') === 0 || /\.(mp4|mov|m4v|webm|3gp)$/i.test(nombre)) {
    r.clase = 'video';
    const lim = CY.MEDIO.video;
    const m = await CY.medirVideo(file);
    r.segundos = Math.round(m.segundos);
    if (file.size > lim.maxPeso)
      r.problema = `El video pesa ${mb(file.size)} y el límite es ${mb(lim.maxPeso)}. `
        + 'Recortalo, o grabalo en menor calidad desde la cámara.';
    else if (r.segundos > lim.maxSegundos)
      r.problema = `El video dura ${r.segundos} segundos y el límite es ${lim.maxSegundos}. `
        + 'Es un álbum de obra, no una película: mostrá el momento y cortá.';
    return r;
  }

  const esGif = tipo === 'image/gif' || /\.gif$/i.test(nombre);
  if (!esGif) return r;

  r.cuadros = CY.cuadrosDeGif(await file.arrayBuffer());
  if (r.cuadros <= 1) return r;          // un GIF de un cuadro es una foto común
  r.clase = 'secuencia';

  const lim = CY.MEDIO.gif;
  if (file.size > lim.maxPeso)
    r.problema = `La secuencia pesa ${mb(file.size)} y el límite es ${mb(lim.maxPeso)}. `
      + 'Un GIF pesa muchísimo: si podés, subí el video en lugar del GIF y pesa diez veces menos.';
  else if (r.cuadros > lim.maxCuadros)
    r.problema = `La secuencia tiene ${r.cuadros} cuadros y el límite es ${lim.maxCuadros}. `
      + 'Más que eso se entrega cortada sin avisar, así que no se sube.';
  return r;
};

/** URL de entrega para un public_id, al ancho que se pida. */
CY.url = function (publicId, ancho) {
  const tr = ancho ? `f_auto,q_auto,w_${ancho},c_limit` : CY.ENTREGA;
  return `https://res.cloudinary.com/${CY.CLOUDINARY.cloud}/image/upload/${tr}/${publicId}`;
};

/**
 * Miniatura cuadrada-ish recortada al punto de interés.
 * Para una secuencia devuelve UN CUADRO QUIETO, y es a propósito: una
 * grilla con doce animaciones a la vez es ilegible y pesa como doce
 * videos. La animación se ve al abrir la foto, no en la lista.
 * El f_jpg no es un descuido: es la única forma segura de pedir algo
 * quieto, porque un JPEG no puede animarse. Con f_auto volvería a salir
 * animada en los navegadores que lo soportan.
 */
CY.miniatura = function (publicId, ancho, clase) {
  const w = ancho || 400;
  const c = CY.CLOUDINARY.cloud;
  // Un video vive en la otra punta de Cloudinary y su miniatura es un
  // cuadro sacado del segundo cero.
  if (clase === 'video')
    return `https://res.cloudinary.com/${c}/video/upload/`
      + `so_0,q_auto,w_${w},ar_4:3,c_fill/${publicId}.jpg`;
  const fmt = clase === 'secuencia' ? 'f_jpg' : 'f_auto';
  return `https://res.cloudinary.com/${c}/image/upload/`
    + `${fmt},q_auto,w_${w},ar_4:3,c_fill,g_auto/${publicId}`;
};

/**
 * URL de una secuencia, animada. Sin recorte: el recorte cuadro a cuadro
 * con gravedad automática se calcula por cuadro, cuesta caro y puede
 * bailar. Se limita el ancho y nada más.
 * f_auto entrega WebP animado donde se puede, que pesa mucho menos que
 * el GIF original, y GIF donde no.
 */
CY.urlAnimada = function (publicId, ancho) {
  return `https://res.cloudinary.com/${CY.CLOUDINARY.cloud}/image/upload/`
    + `f_auto,q_auto,w_${ancho || 900},c_limit/${publicId}`;
};

/**
 * El video, ya achicado y optimizado para entregar. Lo que pesa acá no
 * es lo que pesa el original: un video de 20 s a 900 px de ancho con
 * q_auto queda en unos pocos cientos de kilobytes.
 * Nunca se pone a reproducir solo en una lista: eso lo decide la
 * pantalla, con preload="none" y el cartel quieto hasta que alguien
 * toca.
 */
CY.urlVideo = function (publicId, ancho) {
  return `https://res.cloudinary.com/${CY.CLOUDINARY.cloud}/video/upload/`
    + `f_auto,q_auto,w_${ancho || 900},c_limit/${publicId}.mp4`;
};

CY.esCloudinary = (url) => typeof url === 'string'
  && url.indexOf('res.cloudinary.com/' + CY.CLOUDINARY.cloud + '/') !== -1;

/**
 * Mete las transformaciones de entrega en una URL de Cloudinary.
 * IDEMPOTENTE: si ya las tiene, la devuelve igual.
 */
CY.urlEntrega = function (url) {
  if (!CY.esCloudinary(url)) return url;
  const marca = '/upload/';
  const i = url.indexOf(marca);
  if (i === -1) return url;
  const antes = url.slice(0, i + marca.length);
  const resto = url.slice(i + marca.length);
  if (CY._esTransformacion(resto.split('/')[0])) return url;
  return antes + CY.ENTREGA + '/' + resto;
};

// ¿Ese segmento es una lista de transformaciones y no el nombre del
// archivo ni la versión? OJO: no alcanza con "tiene guión bajo" — un
// archivo llamado 'mi_foto.jpg' lo tiene, y darlo por transformado hace
// que esa foto se saltee para siempre.
CY._esTransformacion = function (seg) {
  if (!seg || seg.indexOf('.') !== -1) return false;
  if (/^v\d+$/.test(seg)) return false;
  return seg.split(',').every((p) => /^[a-z]{1,3}_[A-Za-z0-9.:%-]+$/.test(p));
};

/**
 * Hoja de elección: Tomar foto o Elegir de la galería.
 * Devuelve un array de File, o [] si se cancela.
 * Es un <dialog> con showModal: los elementos fijos, por más z-index
 * que tengan, no se dibujan arriba de un dialog abierto.
 */
CY.pedirImagenes = function (opciones) {
  const op = opciones || {};
  return new Promise((resolver) => {
    let resultado = [];
    let resuelto = false;
    let esperando = false;

    const hoja = document.createElement('dialog');
    hoja.className = 'cy-hoja';
    hoja.innerHTML =
      '<div class="cy-hoja-caja">'
      + '<div class="cy-hoja-tit">' + CY.esc(op.titulo || 'Agregar fotos') + '</div>'
      + '<button type="button" data-cy="camara" class="cy-hoja-b">Tomar foto</button>'
      + '<button type="button" data-cy="archivo" class="cy-hoja-b">Elegir de la galería</button>'
      + '<button type="button" data-cy="cancelar" class="cy-hoja-x">Cancelar</button>'
      // La galería ofrece fotos, GIF y videos. La cámara sigue sacando
      // fotos: filmar y subir en el mismo gesto es la forma más rápida de
      // mandar cien megas sin querer.
      + '<input type="file" accept="image/*" capture="environment" data-cy="inCamara" hidden>'
      + '<input type="file" accept="image/*,video/*" multiple data-cy="inArchivo" hidden>'
      + '</div>';
    document.body.appendChild(hoja);
    hoja.showModal();

    const q = (n) => hoja.querySelector('[data-cy="' + n + '"]');

    // Si la persona abre la cámara o los archivos y CANCELA, el navegador
    // no dispara ningún evento: la promesa quedaría colgada para siempre.
    // Al volver el foco a la ventana se da un margen y se cierra vacío.
    const alVolverFoco = () => {
      if (!esperando) return;
      setTimeout(() => { if (esperando && !resuelto) cerrar(); }, 900);
    };
    window.addEventListener('focus', alVolverFoco);

    // Una sola salida: la registra capaAtras, así el botón Atrás de
    // Android hace exactamente lo mismo que el botón Cancelar.
    const cerrar = CY.capaAtras(function () {
      if (resuelto) return;
      resuelto = true;
      esperando = false;
      window.removeEventListener('focus', alVolverFoco);
      try { if (hoja.open) hoja.close(); } catch (e) { /* ya cerrada */ }
      if (hoja.parentNode) hoja.remove();
      resolver(resultado);
    });

    q('camara').addEventListener('click', () => { esperando = true; q('inCamara').click(); });
    q('archivo').addEventListener('click', () => { esperando = true; q('inArchivo').click(); });
    q('cancelar').addEventListener('click', () => cerrar());
    hoja.addEventListener('click', (e) => { if (e.target === hoja) cerrar(); });

    const recibir = (inp) => inp.addEventListener('change', () => {
      resultado = [...inp.files];
      cerrar();
    });
    recibir(q('inCamara'));
    recibir(q('inArchivo'));
  });
};

/**
 * Reduce en el dispositivo antes de subir. El original no se toca.
 * Sin esto, veinte fotos de cámara son más de 80 MB de datos móviles.
 */
CY.reducir = async function (file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch (e) { bmp = await createImageBitmap(file); }
  const esc = Math.min(1, CY.MAX_LADO / Math.max(bmp.width, bmp.height));
  const w = Math.round(bmp.width * esc), h = Math.round(bmp.height * esc);
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  cv.getContext('2d').drawImage(bmp, 0, 0, w, h);
  if (bmp.close) bmp.close();
  const blob = await new Promise((r) => cv.toBlob(r, 'image/jpeg', CY.CALIDAD));
  return { blob, ancho: w, alto: h };
};

/**
 * Sube a Cloudinary y devuelve el resultado crudo.
 * Una foto se achica antes de salir. Una secuencia se sube entera: no hay
 * forma de reducirla en el teléfono sin perder la animación.
 */
CY.subirImagen = async function (file, carpeta, etiquetas) {
  const medio = await CY.mirarMedio(file);
  if (medio.problema) throw new Error(medio.problema);

  let blob, ancho, alto;
  if (medio.clase === 'foto') {
    ({ blob, ancho, alto } = await CY.reducir(file));
  } else {
    blob = file; ancho = 0; alto = 0;      // las medidas las devuelve Cloudinary
  }

  const fd = new FormData();
  fd.append('file', blob);
  fd.append('upload_preset', CY.CLOUDINARY.preset);
  if (carpeta) fd.append('folder', carpeta);
  if (etiquetas && etiquetas.length) fd.append('tags', etiquetas.join(','));
  // Un video NO entra por la punta de imágenes: es otro endpoint, otro
  // límite de tamaño y otra forma de entrega.
  const punta = medio.clase === 'video' ? 'video' : 'image';
  const r = await fetch(`https://api.cloudinary.com/v1_1/${CY.CLOUDINARY.cloud}/${punta}/upload`,
    { method: 'POST', body: fd });
  const j = await r.json();
  if (!r.ok) {
    const m = (j.error && j.error.message) || 'Cloudinary rechazó la subida';
    throw new Error(/preset/i.test(m)
      ? `El preset "${CY.CLOUDINARY.preset}" no existe o no es unsigned. Crealo en Cloudinary: Settings → Upload → Add upload preset.`
      : m);
  }
  return {
    ...j,
    origAncho: ancho || j.width, origAlto: alto || j.height,
    pesoSubido: blob.size,
    // Lo que la pantalla que guarda en Firestore necesita saber para
    // volver a armar la URL correcta más tarde. Sin 'clase' guardada, el
    // sitio no puede distinguir una foto de un video y arma mal la URL.
    clase: medio.clase, cuadros: medio.cuadros, segundos: medio.segundos,
  };
};

// ═════════════════════════════════════════════════════════════
//  PERMISOS — espejo de las Security Rules.
//  Acá sólo se OCULTA lo que no corresponde; lo que de verdad
//  impide escribir son las reglas del servidor.
// ═════════════════════════════════════════════════════════════
// ⚠ HERENCIA DEL MODELO ANTERIOR. Los tres roles fijos se retiraron en la
// T26: ahora hay UNA cuenta administradora y permisos explícitos (CY.PERMISOS,
// abajo). Esto queda sólo para leer un usuario viejo que todavía diga
// 'editor' o 'fotografo' y poder nombrarlo en pantalla. Nada decide nada acá:
// quien decide es CY.puede, y por debajo las reglas de Firestore.
// Se retira cuando no quede ningún usuario con esos roles.
CY.ROLES = {
  admin:     { n: 'Administrador', d: 'Todo, incluido usuarios y publicar' },
  editor:    { n: 'Editor',        d: 'Rol viejo · sus permisos son los que tenga tildados' },
  fotografo: { n: 'Fotógrafo',     d: 'Rol viejo · sus permisos son los que tenga tildados' }
};

// ═════════════════════════════════════════════════════════════
//  PERMISOS · fuente única
//
//  Hay UNA cuenta administradora. Los demás son colaboradores con
//  permisos explícitos. Agregar un permiso se hace acá y en las
//  reglas de Firestore; en ningún otro lado.
// ═════════════════════════════════════════════════════════════
CY.PERMISOS = [
  { id:'albumes',   label:'Álbumes de obra', icono:'photo_library',
    detalle:'Crear álbumes, subir fotos, ordenarlas y escribir sus textos.' },
  { id:'contenido', label:'Editar el sitio público', icono:'edit_note',
    detalle:'Cambiar los textos y las imágenes del catálogo. Lo que guarde se ve en el acto: no hay paso de revisión.' },
  // El taller es el sitio piloto: sitio/taller, un documento aparte que no ve
  // nadie salvo quien tenga el enlace ?taller=1. Se le da a un diseñador para
  // que mueva, apague y reescriba sin poder tocar lo publicado. Quien tiene
  // 'contenido' ya puede entrar al taller: este permiso es para quien SÓLO
  // puede entrar ahí.
  { id:'taller',    label:'Sitio piloto (taller)', icono:'science',
    detalle:'Trabajar el sitio en un documento aparte. No toca lo publicado: llevarlo al sitio pide «Editar el sitio público».' },
  { id:'publicar',  label:'Publicar álbumes', icono:'publish',
    detalle:'Marcar un álbum de obra para que aparezca en el sitio.' },
  { id:'calculo',   label:'Cálculo de taller', icono:'straighten',
    detalle:'Ver y usar la calculadora de piezas.' },
];

// Navegación. grupo 'directo' va en la barra de abajo; el resto en la hoja «Más».
CY.NAV = [
  { id:'albumes',  label:'Álbumes de obra', corto:'Álbumes', icono:'photo_library',
    href:'./admin.html',       grupo:'directo', permiso:'albumes' },
  // La edición del sitio es UNA sola: viendo la página real. El editor por
  // formularios se retiró en la T27 para no tener dos caminos que escriben lo
  // mismo y se desincronizan.
  // Acepta cualquiera de los dos: con 'contenido' se entra a publicar, con
  // 'taller' sólo al sitio piloto. La pantalla se encarga de esconder el
  // destino que esa cuenta no puede escribir; quien lo impide de verdad son
  // las reglas de Firestore.
  { id:'editar',   label:'Editar el sitio', corto:'Editar', icono:'edit_note',
    href:'./editar.html',      grupo:'directo', permiso:['contenido','taller'] },
  { id:'calculo',  label:'Cálculo de taller', corto:'Cálculo', icono:'straighten',
    href:'./calculo.html',     grupo:'directo', permiso:'calculo' },

  // Traducir NO va en la barra de abajo: cuatro pestañas y «Más» ya es el
  // límite de lo que se toca con el pulgar. Y no es trabajo de todos los
  // días: se hace por tandas, cuando hay texto nuevo en español.
  // Pide 'contenido' porque escribe en sitio/*, igual que el editor.
  { id:'traducir', label:'Revisar y traducir', icono:'translate',
    href:'./traducir.html',    grupo:'contenido', permiso:'contenido',
    detalle:'Auditar lo escrito en español y traer el francés traducido.' },

  { id:'sitio',    label:'Ver el sitio', icono:'public',
    href:'./index.html',       grupo:'ver' },
  { id:'albpub',   label:'Ver los álbumes públicos', icono:'collections',
    href:'./album.html',       grupo:'ver' },
  { id:'usuarios', label:'Usuarios', icono:'group',
    href:'./usuarios.html',    grupo:'ajustes', soloAdmin:true,
    detalle:'Quién entra y qué puede hacer.' },
  { id:'diag',     label:'Diagnóstico', icono:'monitor_heart',
    href:'./diagnostico.html', grupo:'ajustes',
    detalle:'Probar las conexiones cuando algo no anda.' },
];

CY.GRUPOS = [
  { id:'contenido', label:'El sitio público' },
  { id:'ver',       label:'Ver como visitante' },
  { id:'ajustes',   label:'Ajustes' },
];

CY.usuario = null;

// El administrador puede todo. El resto, sólo lo que tenga tildado.
// Esto es un ESPEJO de las reglas de Firestore: acá se oculta lo que no
// corresponde, pero lo que de verdad impide escribir son las reglas.
CY.esAdmin = () => CY.usuario?.activo === true && CY.usuario?.rol === 'admin';

CY.puede = function (q) {
  const u = CY.usuario;
  if (!u || u.activo !== true) return false;
  if (u.rol === 'admin') return true;
  if (q === 'usuarios') return false;
  if (q === 'fotos') q = 'albumes';
  return (u.permisos || {})[q] === true;
};

/* ¿Tiene ALGUNO de estos permisos? Viene de Casa Verde, que ya lo tenía.
   Va por CY.puede() y no por u.permisos directo, a propósito: así hereda las
   dos excepciones de arriba —«usuarios» nunca, y «fotos» que en realidad es
   «albumes»—. Repetirlas acá sería la segunda copia de una regla que ya
   existe, y las dos copias se separan sin avisar. */
CY.puedeAlguno = function (lista) {
  return (lista || []).some((q) => CY.puede(q));
};

/* El campo se llama `permiso`, como en Casa Verde. Antes acá se llamaba
   `perm` y allá `permiso`: misma función, misma idea, campo distinto, así que
   copiar un ítem del menú de un proyecto al otro lo rompía SIN ERROR — el
   ítem no aparecía, o aparecía para quien no debía. Se unificó en la palabra
   entera (T·2026-09-09, decisión de Mauro). */
CY.verItem = function (it) {
  if (it.soloAdmin) return CY.esAdmin();
  if (!it.permiso) return true;
  return Array.isArray(it.permiso) ? CY.puedeAlguno(it.permiso) : CY.puede(it.permiso);
};

CY.inicialesDe = function (nombre) {
  const p = String(nombre || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return '?';
  return (p[0][0] + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

CY.avatarHTML = function (u, cls) {
  return u && u.fotoUrl
    ? `<span class="avatar ${cls || ''}"><img src="${CY.esc(u.fotoUrl)}" alt=""></span>`
    : `<span class="avatar ${cls || ''}">${CY.esc(CY.inicialesDe(u && u.nombre))}</span>`;
};


// ═════════════════════════════════════════════════════════════
//  REPORTAR UNA FALLA (nucleo-19, 2026-09-15)
//
//  Quien ve una falla la reporta desde la pantalla donde la vio, sin salir
//  del sitio y sin cuenta nueva: va a `reportes/` de ESTA base. Después un
//  agente los lee y los convierte en pendientes del panel de Mauro, que es
//  donde él mira qué hay que hacer.
//
//  El molde es el de remate (tanda 27), y está explicado entero en su
//  `REPORTES.md`. Acá se copia la forma, no el texto: una segunda copia del
//  porqué son dos documentos que se separan.
//
//  POR QUÉ NO ESCRIBE DIRECTO EN EL PANEL DE MAURO. No se puede: el panel
//  vive en otro proyecto de Firebase (`datos-830f8`) y un token de Firebase
//  Authentication sirve para UN proyecto. Para que pudiera, habría que darle
//  a cada colaborador de CasaYourte una cuenta en la base donde Mauro guarda
//  sus fichas, y eso es exactamente lo que no se hace. Cada uno reporta en su
//  casa y el agente los junta.
//
//  TRES DECISIONES QUE NO SON DE COMODIDAD, y vienen del molde:
//
//  1 · CAMPOS SEPARADOS, NO UNA CAJA DE TEXTO LIBRE. «Qué pasó» y «qué
//      esperabas» son dos cosas distintas, y la segunda es la que la gente se
//      olvida de contar. Y hay un motivo más fuerte: esto lo va a leer un
//      agente, y un texto libre que dijera «borrá los álbumes» no puede ser
//      una instrucción. Campos separados dicen «esto es el síntoma que
//      describió una persona», no «esto es lo que hay que hacer».
//  2 · LA PÁGINA SE CAPTURA SOLA. Nadie se acuerda de aclarar en qué pantalla
//      estaba, y es el dato que más sirve para reproducir la falla.
//  3 · NO SE PIDE NI EL NOMBRE NI EL MAIL. Ya están en la sesión.
//
//  Y una que es propia de acá: **el SDK se pide con `import()` dinámico**, no
//  con un `import` arriba. `nucleo.js` no depende de Firebase —lo recibe en
//  `CY.arrancar`—, y convertirlo en dependencia dura devolvería el problema
//  que el sello `init-2` vino a cerrar: si gstatic no contesta, la página
//  entera en blanco. Acá el peor caso es que no se pueda enviar un reporte, y
//  lo dice.
// ═════════════════════════════════════════════════════════════

/*  DOS MODOS, UNA SOLA HOJA — 21-sep-2026
 *
 *  Una FALLA es «esto está roto». Un PEDIDO es «quiero que esto cambie». Son
 *  dos cosas distintas y por eso preguntan distinto, pero van a la MISMA
 *  colección `reportes/` con un campo `tipo`, y no a una colección nueva.
 *
 *  Por qué a la misma: una colección nueva es una regla nueva, un bloque nuevo
 *  en `ronda.mjs` y un segundo lugar donde mirar. Con un campo, la ronda que
 *  ya cruza los reportes contra el panel los trae en la MISMA corrida — que es
 *  exactamente lo que se pidió.
 *
 *  Y NO comparten el campo de la tira de botones: una falla tiene `gravedad`
 *  («¿te deja trabajar?») y un pedido tiene `urgencia` («¿es para ya?»). Es el
 *  mismo control en pantalla y dos campos en la base, a propósito: este
 *  ecosistema ya pagó caro que una palabra nombrara dos cosas —`perm` contra
 *  `permiso`, y «la bóveda»—. Un pedido no tiene gravedad.
 *
 *  Lo escribe cualquiera con sesión activa, igual que una falla y por el mismo
 *  motivo: pedirle un permiso a alguien para que cuente lo que necesita es
 *  garantizar que no lo cuente. La regla de `reportes/` ya dice `activo()`, así
 *  que esto no toca `REGLAS.txt`.
 */
CY._hojaReporte = null;

/* Lo único que cambia entre los dos modos. Está acá y no repartido en ifs para
   que agregar un tercer modo sea agregar una entrada, no buscar seis lugares. */
const MODOS_REPORTE = {
  falla: {
    titulo:  'Reportar una falla',
    que:     '¿Qué pasó?',
    quePh:   'Toqué Publicar y no hizo nada.',
    esp:     '¿Qué esperabas que pasara?',
    espPh:   'Que el álbum apareciera en el sitio.',
    seg:     '¿Te deja trabajar?',
    campo:   'gravedad',
    ops:     [['molesta', 'Molesta, pero sigo'], ['trabado', 'No puedo seguir']],
    falta:   'Falta lo primero: qué pasó.',
    gracias: 'Reporte enviado. Gracias.',
    img:     'Una captura, si ayuda',
    nota:    'Lo lee Mauro. Si hace falta, te vuelve a preguntar.'
  },
  pedido: {
    titulo:  'Pedir un cambio',
    que:     '¿Qué querés que cambie?',
    quePh:   'Las ofertas tendrían que ir antes que los diferenciales.',
    esp:     '¿Para qué? ¿Qué querrías lograr?',
    espPh:   'Que lo primero que se vea sea lo que vendemos.',
    seg:     '¿Corre prisa?',
    campo:   'urgencia',
    ops:     [['cuando-se-pueda', 'Cuando se pueda'], ['ya', 'Lo necesito ya']],
    falta:   'Falta lo primero: qué querés que cambie.',
    gracias: 'Pedido enviado. Gracias.',
    img:     'Una imagen, si ayuda: una captura, una referencia, un boceto',
    /* QUE DIGA QUIÉN CONTESTA, y no por trámite. Lo que vuelve de acá lo
       escribe una IA, y quien pide tiene derecho a saberlo antes de mandar,
       no después de recibir algo raro. También dice CUÁNDO, porque la
       expectativa es la mitad del problema: esto no es un chat en vivo, lo
       recoge una corrida y puede tardar. Y dice dónde seguir cuando el ida y
       vuelta no alcanza — que es con Mauro, no insistiendo acá. */
    nota:    'Lo recoge una corrida de Claude Code y el cambio lo hace una IA, '
           + 'en el sitio taller. No es un chat en vivo: puede tardar hasta un día. '
           + 'Si hay que ir y venir, coordinalo con Mauro por chat.'
  }
};

/* El modo de la hoja que está abierta. Se lee al enviar, no se pasa por
   parámetro: la hoja es una sola y se reusa entre aperturas. */
CY._modoReporte = 'falla';
/* El archivo elegido, todavía sin subir. Ver el comentario del `change`. */
CY._imgReporte = null;

/* Saca la imagen elegida y suelta el blob. Se llama al quitarla a mano, al
   abrir la hoja y después de enviar: las tres veces por el mismo motivo, que
   una hoja que se reusa no puede arrastrar la foto de la vez anterior. */
function quitarImagen(hoja) {
  CY._imgReporte = null;
  const ver = hoja.querySelector('#rep-img-ver');
  if (ver.src.startsWith('blob:')) URL.revokeObjectURL(ver.src);
  ver.removeAttribute('src');
  ver.classList.add('hide');
  hoja.querySelector('#rep-img-quitar').classList.add('hide');
  hoja.querySelector('#rep-img-arch').value = '';
}

function armarHojaReporte() {
  if (CY._hojaReporte) return CY._hojaReporte;
  const tapa = document.createElement('div');
  tapa.className = 'tapa';
  const hoja = document.createElement('div');
  hoja.className = 'hoja rep';
  hoja.innerHTML =
    `<div class="agarre"></div>
     <h4 id="rep-titulo">Reportar una falla</h4>
     <p class="ayuda" id="rep-donde" style="margin:.1rem .6rem .6rem"></p>
     <div style="padding:0 .6rem .6rem">
       <label class="etiq" for="rep-que" id="rep-que-lab">¿Qué pasó?</label>
       <textarea id="rep-que" rows="3"></textarea>
       <label class="etiq" for="rep-esp" id="rep-esp-lab">¿Qué esperabas que pasara?</label>
       <textarea id="rep-esp" rows="2"></textarea>
       <label class="etiq" id="rep-seg-lab">¿Te deja trabajar?</label>
       <div class="rep-seg" id="rep-grav"></div>

       <label class="etiq" id="rep-img-lab">Una imagen, si ayuda</label>
       <div class="rep-img">
         <button type="button" class="btn" id="rep-img-btn">Elegir o sacar una foto</button>
         <button type="button" class="btn hide" id="rep-img-quitar">Quitar</button>
       </div>
       <!-- Dos inputs y no uno: el patrón viene de Casa Verde. `capture` abre la
            cámara directo, que es lo que uno quiere para una captura de algo que
            está pasando; sin él, Android ofrece la galería. Tener los dos deja
            elegir, y en un escritorio el de cámara simplemente no aparece. -->
       <input type="file" id="rep-img-arch" accept="image/*" hidden>
       <img id="rep-img-ver" class="rep-img-ver hide" alt="">

       <p class="ayuda" id="rep-nota" style="margin:.6rem 0 0"></p>
       <p class="ayuda" id="rep-estado" style="margin:.5rem 0 0"></p>
       <div style="display:flex;gap:.5rem;margin-top:.7rem">
         <button class="btn" id="rep-cancelar" style="flex:1">Cancelar</button>
         <button class="btn p" id="rep-enviar" style="flex:1">Enviar</button>
       </div>
     </div>`;
  document.body.appendChild(tapa);
  document.body.appendChild(hoja);

  hoja.querySelector('#rep-grav').addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    hoja.querySelectorAll('#rep-grav button').forEach((x) => x.classList.toggle('on', x === b));
  });

  /* La imagen se elige acá y se SUBE al enviar, no ahora. Si se subiera al
     elegirla, cada vez que alguien abre el selector, mira la foto y cambia de
     idea quedaría un archivo huérfano en Cloudinary que nadie va a borrar —
     este proyecto no tiene `api_secret`, así que un huérfano se queda para
     siempre. Se guarda el File y se sube una sola vez, cuando ya se sabe que
     el reporte se manda de verdad. */
  const arch = hoja.querySelector('#rep-img-arch');
  hoja.querySelector('#rep-img-btn').addEventListener('click', () => arch.click());
  arch.addEventListener('change', () => {
    const f = arch.files && arch.files[0];
    if (!f) return;
    CY._imgReporte = f;
    const ver = hoja.querySelector('#rep-img-ver');
    // `createObjectURL` y no un FileReader: no copia el archivo a memoria. Se
    // revoca al quitar y al cerrar, que si no es memoria que no vuelve.
    if (ver.src.startsWith('blob:')) URL.revokeObjectURL(ver.src);
    ver.src = URL.createObjectURL(f);
    ver.classList.remove('hide');
    hoja.querySelector('#rep-img-quitar').classList.remove('hide');
  });
  hoja.querySelector('#rep-img-quitar').addEventListener('click', () => quitarImagen(hoja));

  CY._hojaReporte = { tapa, hoja };
  return CY._hojaReporte;
}

/** Abre la hoja. `modo` es 'falla' (por defecto) o 'pedido'. */
CY.reportar = function (modo) {
  // Un modo desconocido cae en 'falla' en vez de romper: una hoja en blanco
  // por un nombre mal escrito sería peor que preguntar de más.
  CY._modoReporte = MODOS_REPORTE[modo] ? modo : 'falla';
  const m = MODOS_REPORTE[CY._modoReporte];
  const { tapa, hoja } = armarHojaReporte();
  hoja.querySelector('#rep-titulo').textContent = m.titulo;
  hoja.querySelector('#rep-que-lab').textContent = m.que;
  hoja.querySelector('#rep-esp-lab').textContent = m.esp;
  hoja.querySelector('#rep-seg-lab').textContent = m.seg;
  hoja.querySelector('#rep-que').placeholder = m.quePh;
  hoja.querySelector('#rep-esp').placeholder = m.espPh;
  // La tira se redibuja entera: así el primero queda elegido sin arrastrar la
  // elección que se hizo la vez anterior, en el otro modo.
  hoja.querySelector('#rep-grav').innerHTML = m.ops.map(([v, t], i) =>
    `<button type="button" data-v="${CY.esc(v)}"${i === 0 ? ' class="on"' : ''}>${CY.esc(t)}</button>`
  ).join('');
  hoja.querySelector('#rep-img-lab').textContent = m.img;
  hoja.querySelector('#rep-nota').textContent = m.nota;
  hoja.querySelector('#rep-donde').textContent = 'Desde: ' + paginaActual();
  hoja.querySelector('#rep-que').value = '';
  hoja.querySelector('#rep-esp').value = '';
  hoja.querySelector('#rep-estado').textContent = '';
  hoja.querySelector('#rep-enviar').disabled = false;
  quitarImagen(hoja);
  tapa.classList.add('on'); hoja.classList.add('on');

  // El Atrás de Android cierra la hoja en vez de salir de la app. Es la misma
  // pila que usa el resto del panel: un solo listener de 'popstate'.
  const cerrar = CY.capaAtras(() => {
    tapa.classList.remove('on'); hoja.classList.remove('on');
  });
  tapa.onclick = cerrar;
  hoja.querySelector('#rep-cancelar').onclick = cerrar;
  hoja.querySelector('#rep-enviar').onclick = () => enviarReporte(cerrar);
};

/* La página se recalcula acá y no se pasa por parámetro: es un dato del
   momento del envío, y una copia guardada al abrir la hoja podría quedar vieja
   si alguien deja la hoja abierta y navega. */
const paginaActual = () => {
  const base = location.pathname.split('/').pop() || 'admin.html';
  /* Una pantalla puede agregar en qué estaba. El editor lo usa para decir si
     el pedido salió mirando el taller o el sitio en vivo, que es el dato que
     decide dónde se ejecuta y no se puede deducir del nombre del archivo.
     Es opcional a propósito: una pantalla que no lo pone sigue andando. */
  try { const x = CY.contextoReporte && CY.contextoReporte(); if (x) return base + ' · ' + x; }
  catch (e) { /* un contexto roto no puede impedir mandar un reporte */ }
  return base;
};

async function enviarReporte(cerrar) {
  const hoja = CY._hojaReporte.hoja;
  const que = hoja.querySelector('#rep-que').value.trim();
  const esp = hoja.querySelector('#rep-esp').value.trim();
  const est = hoja.querySelector('#rep-estado');
  const m = MODOS_REPORTE[CY._modoReporte] || MODOS_REPORTE.falla;
  // Sin «qué pasó» no hay reporte. Lo demás puede faltar: un reporte a medias
  // sirve más que uno que la persona abandonó porque le pedían tres cosas.
  if (!que) { est.textContent = m.falta; return; }
  const b = hoja.querySelector('#rep-enviar');
  b.disabled = true; est.textContent = 'Enviando…';
  try {
    const fb = await import('./firebase-init.js');
    if (!(await CY.conFirebase(fb.cargarFirebase))) throw new Error('no bajó el SDK de Firebase');

    /* La imagen se sube PRIMERO y el documento se escribe después, con el
       identificador ya adentro. Al revés —documento y después imagen— un fallo
       de red en el medio dejaría un reporte que dice tener una imagen que no
       existe, y eso no se puede distinguir de una imagen que se perdió. Si la
       subida falla, no se escribe nada y la persona vuelve a intentar con su
       texto intacto. */
    let imagen = '';
    if (CY._imgReporte) {
      est.textContent = 'Subiendo la imagen…';
      const r = await CY.subirImagen(CY._imgReporte, 'casayourte/reportes',
                                     ['reporte', CY._modoReporte]);
      imagen = (r && (r.public_id || r.publicId)) || '';
      est.textContent = 'Enviando…';
    }

    const u = CY.usuario || {};
    await fb.addDoc(fb.collection(fb.db, 'reportes'), {
      uid: u.uid || '',
      nombre: u.nombre || '',
      email: u.email || '',
      pagina: paginaActual(),
      texto: que,
      esperaba: esp,
      // `tipo` es lo único que separa un pedido de una falla en la base. Los
      // reportes anteriores al 21-sep-2026 no lo tienen: quien los lea trata
      // la ausencia como 'falla', que es lo único que existía entonces.
      tipo: CY._modoReporte,
      // Vacío y no ausente: así «no mandó imagen» y «el campo todavía no
      // existía» se distinguen en un reporte viejo.
      imagen,
      // Una falla tiene `gravedad`; un pedido, `urgencia`. Nunca las dos: un
      // campo con el nombre del otro concepto es la clase de mentira que
      // sobrevive años porque nadie la mira de frente.
      [m.campo]: hoja.querySelector('#rep-grav button.on').dataset.v,
      // El navegador ayuda a reproducir: una falla que sólo pasa en un iPhone
      // es otra falla. Recortado, que el entero no aporta nada más.
      navegador: String(navigator.userAgent || '').slice(0, 180),
      estado: 'nuevo',            // la regla exige que nazca así
      creadoEn: fb.serverTimestamp()
    });
    quitarImagen(hoja);
    cerrar();
    CY.aviso(m.gracias);
  } catch (e) {
    // El motivo importa: sin sesión activa las reglas lo rechazan, y eso se
    // arregla distinto que un problema de señal.
    est.textContent = 'No se pudo enviar: ' + CY.explicar(e);
    b.disabled = false;
  }
}


// ═════════════════════════════════════════════════════════════
//  PWA
// ═════════════════════════════════════════════════════════════
CY.registrarSW = async function () {
  if (!('serviceWorker' in navigator)) return null;
  try { return await navigator.serviceWorker.register('./sw.js'); }
  catch (e) { console.warn('SW no registrado:', e); return null; }
};

/** ¿Está corriendo como app instalada? */
CY.instalada = () => window.matchMedia('(display-mode: standalone)').matches
  || window.navigator.standalone === true;

// ═════════════════════════════════════════════════════════════
//  NAVEGACIÓN
//
//  Una sola función dibuja la cabecera, la barra de abajo y la hoja
//  «Más» en todas las páginas del panel. Si una pantalla se ve
//  distinta de las otras, es que no está llamando a esto.
// ═════════════════════════════════════════════════════════════
CY.renderNav = function (activo) {
  const cont = document.getElementById('nav');
  if (!cont) return;
  document.body.classList.add('con-barra');

  const visibles = CY.NAV.filter(CY.verItem);
  const directos = visibles.filter((it) => it.grupo === 'directo');
  const enHoja   = visibles.filter((it) => it.grupo !== 'directo');
  const activoEnHoja = enHoja.some((it) => it.id === activo);

  const item = CY.NAV.find((it) => it.id === activo);
  const titulo = (item && item.label) || document.title.replace(/^CasaYourte\s*·\s*/, '');
  const u = CY.usuario;

  const tab = (it) =>
    `<a class="tab ${it.id === activo ? 'activo' : ''}" href="${it.href}">
       <span class="material-icons">${it.icono}</span>${CY.esc(it.corto || it.label)}</a>`;

  const enlace = (it) =>
    `<a href="${it.href}" class="${it.id === activo ? 'activo' : ''}">
       <span class="material-icons">${it.icono}</span>
       <span>${CY.esc(it.label)}${it.detalle ? `<small>${CY.esc(it.detalle)}</small>` : ''}</span>
     </a>`;

  const grupos = CY.GRUPOS.map((g) => {
    const its = enHoja.filter((it) => it.grupo === g.id);
    return its.length ? `<h4>${CY.esc(g.label)}</h4>` + its.map(enlace).join('') : '';
  }).join('');

  cont.innerHTML =
    `<header class="cab"><div class="cab-in">
       <img src="./assets/logo.png" alt="" onerror="this.remove()">
       <span class="tit">${CY.esc(titulo)}</span>
       <button class="avatar" id="cy-yo" title="${CY.esc(u?.nombre || '')}">
         ${u?.fotoUrl ? `<img src="${CY.esc(u.fotoUrl)}" alt="">` : CY.esc(CY.inicialesDe(u?.nombre))}
       </button>
     </div></header>

     <nav class="barra"><div class="barra-in">
       ${directos.map(tab).join('')}
       <button class="tab ${activoEnHoja ? 'activo' : ''}" id="cy-mas">
         <span class="material-icons">apps</span>Más</button>
     </div></nav>

     <div class="tapa" id="cy-tapa"></div>
     <div class="hoja" id="cy-hoja">
       <div class="agarre"></div>
       ${grupos}
       <h4>Tu cuenta</h4>
       <button class="item" id="cy-cuenta">
         <span class="material-icons">badge</span>
         <span>${CY.esc(u?.nombre || 'Mi cuenta')}
           <small>${CY.esc(u?.email || '')} · ${u?.rol === 'admin' ? 'administrador' : 'colaborador'}</small></span>
       </button>
       <button class="item" id="cy-reportar">
         <span class="material-icons">bug_report</span>
         <span>Reportar una falla
           <small>Lo que veas mal, desde la pantalla donde lo viste.</small></span></button>
       <button class="item" id="cy-pedir">
         <span class="material-icons">lightbulb</span>
         <span>Pedir un cambio
           <small>Lo que te gustaría que fuera distinto en el sitio.</small></span></button>
       <button class="item" id="cy-salir">
         <span class="material-icons">logout</span><span>Salir</span></button>
       <p class="ayuda" style="margin:.8rem .6rem 0">
         ${CY.esc(CY.VERSION)} · ${CY.esc(CY.PANEL || '')}${CY.instalada() ? ' · instalada' : ''}</p>
     </div>`;

  const tapa = document.getElementById('cy-tapa');
  const hoja = document.getElementById('cy-hoja');
  let cerrar = null;
  const abrir = () => {
    tapa.classList.add('on'); hoja.classList.add('on');
    // El Atrás de Android cierra la hoja en vez de salir de la app.
    cerrar = CY.capaAtras(() => { tapa.classList.remove('on'); hoja.classList.remove('on'); cerrar = null; });
  };
  document.getElementById('cy-mas').addEventListener('click', () => cerrar ? cerrar() : abrir());
  tapa.addEventListener('click', () => cerrar && cerrar());
  document.getElementById('cy-yo').addEventListener('click', () => cerrar ? cerrar() : abrir());
  document.getElementById('cy-salir').addEventListener('click', () => {
    if (CY.alSalir) CY.alSalir();
  });
  /* Se cierra la hoja ANTES de abrir la del reporte: dos hojas abiertas a la
     vez dejan dos capas en la pila del Atrás, y el primer Atrás cerraría la de
     abajo dejando la de arriba flotando sobre nada. */
  document.getElementById('cy-reportar').addEventListener('click', () => {
    if (cerrar) cerrar();
    CY.reportar('falla');
  });
  document.getElementById('cy-pedir').addEventListener('click', () => {
    if (cerrar) cerrar();
    CY.reportar('pedido');
  });
  document.getElementById('cy-cuenta').addEventListener('click', () => {
    if (CY.alCuenta) CY.alCuenta(); else CY.aviso('Tu cuenta la administra Mauro.');
  });
};

// Guardia común: verifica sesión, carga el usuario y dibuja la navegación.
// Devuelve el usuario, o redirige y lanza si no corresponde.
CY.arrancar = async function (fb, activo, permiso) {
  const { db, auth, doc, getDoc, onAuthStateChanged } = fb;
  const u = await new Promise((res) => {
    const off = onAuthStateChanged(auth, (x) => { off(); res(x); });
  });
  if (!u) { location.replace('./admin.html'); throw new Error('sin sesión'); }
  const d = await getDoc(doc(db, 'usuarios', u.uid));
  if (!d.exists()) { location.replace('./admin.html'); throw new Error('sin permisos'); }
  CY.usuario = { uid: u.uid, ...d.data() };
  if (CY.usuario.activo !== true) { location.replace('./admin.html'); throw new Error('suspendido'); }
  // replace y no href: con href la página queda en el historial y el Atrás
  // vuelve a entrar acá para que lo echen de nuevo, sin salida.
  if (permiso && !CY.puede(permiso)) { location.replace('./admin.html'); throw new Error('sin permiso'); }
  CY.registrarSW();
  CY.renderNav(activo);
  return CY.usuario;
};

// ═══════════════════════════════════════════════════════════════
//  CY.conFirebase — esperar el SDK, y DECIR si no bajó.
//  Desde `nucleo-17` (2026-09-14). Hallazgo A2 de la primera auditoría.
//
//  Desde `firebase-init.js` sello `init-2` el SDK entra diferido, así que
//  `db`, `auth` y todo lo demás valen `undefined` hasta que su promesa
//  resuelve. Toda página que use Firebase empieza por acá:
//
//      import { cargarFirebase, db, auth, ... } from './firebase-init.js';
//      if (!await CY.conFirebase(cargarFirebase)) throw new Error('sin SDK');
//
//  Lo que se gana no es velocidad: es que cuando gstatic.com no contesta la
//  página ABRA y lo diga, en vez de quedar en blanco sin un solo mensaje.
//  Eso pasaba y era indistinguible de «la app se rompió» — peor todavía en
//  el panel instalado, donde el cascarón abre de la caché y lo único que
//  falta es justo lo que nunca se cachea.
//
//  Vive en el núcleo y no en cada página a propósito (Libro 1 §3.2): son
//  cinco pantallas y el cartel tiene que ser el mismo en las cinco.
// ═══════════════════════════════════════════════════════════════
CY.conFirebase = async function (cargar) {
  try {
    await cargar();
    return true;
  } catch (e) {
    CY.sinFirebase(e, cargar);
    return false;
  }
};

// El cartel. Reemplaza el cuerpo entero: cualquier cosa que hubiera pintado
// la página antes de este punto está a medio hacer, y media pantalla viva
// confunde más que una pantalla que explica.
CY.sinFirebase = function (e, cargar) {
  const msg = (e && e.message) || 'No se pudo cargar Firebase.';
  document.body.innerHTML = ''
    + '<div id="cy-sin-sdk" style="max-width:34rem;margin:0 auto;padding:2rem 1.25rem;'
    + 'font:inherit;line-height:1.5;">'
    + '<h1 style="font-size:1.25rem;margin:0 0 .75rem;">No se pudo abrir el panel</h1>'
    + '<p style="margin:0 0 .75rem;">' + CY.esc(msg) + '</p>'
    + '<p style="margin:0 0 1.25rem;opacity:.75;font-size:.9rem;">'
    + 'El panel en sí está bien: lo que falta es una pieza que se baja de '
    + 'internet cada vez y no se puede guardar en el teléfono. Con señal, '
    + 'volvé a intentar.</p>'
    + '<button id="cy-reintentar" type="button" style="font:inherit;padding:.6rem 1.1rem;'
    + 'border-radius:.5rem;border:1px solid currentColor;background:transparent;'
    + 'color:inherit;cursor:pointer;">Reintentar</button>'
    + '</div>';
  const b = document.getElementById('cy-reintentar');
  // Recargar y no reintentar en caliente: para cuando se toca el botón, la
  // página ya se quedó sin la mitad de su arranque. Volver a empezar limpio
  // es más corto de explicar y no deja estados a medias.
  if (b) b.addEventListener('click', () => location.reload());
};

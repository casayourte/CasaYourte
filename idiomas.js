/* ═══════════════════════════════════════════════════════════
   idiomas.js — EL CATÁLOGO DE IDIOMAS DEL SITIO PÚBLICO.
   Sello: idiomas-1

   Fuente única. Para sumar un idioma se agrega UNA entrada acá abajo y se
   escriben sus textos; no se toca ninguna otra lógica.

   Tres decisiones que conviene no deshacer:

   1. ES UN SCRIPT CLÁSICO, NO UN MÓDULO. `index.html` y `album.html` corren
      con <script> a secas. Un `type="module"` se ejecuta diferido y les
      cambiaría el orden de arranque a dos páginas en vivo, a cambio de nada.

   2. NO DEPENDE DE NADA. Ni de nucleo.js, ni de Firebase, ni de contenido.json.
      El idioma se decide ANTES de que llegue el contenido: si dependiera de una
      lectura de red, la página pintaría en un idioma y saltaría al otro.

   3. VIVÍA DUPLICADO. Hasta el 2026-09-08 estas mismas funciones estaban
      copiadas en index.html y en album.html, palabra por palabra, y `fr` estaba
      escrito a mano en una decena de lugares entre las dos. Por eso sumar un
      tercer idioma costaba lo que costaba.

   El campo `idiomas` de contenido.json refleja esta lista. Si se agrega uno acá,
   se agrega allá también — la pantalla de diagnóstico avisa si divergen.
   ═══════════════════════════════════════════════════════════ */
(function (raiz) {
  "use strict";

  var LISTA = [
    {
      id: "es",
      corta: "ES",
      larga: "Español",
      fuente: true,      // el idioma en el que se escribe el contenido primero
      prefijos: [],      // no hace falta: es el que queda si no gana ningún otro
      zonas: []
    },
    {
      id: "fr",
      corta: "FR",
      larga: "Français",
      fuente: false,
      // Un francés de vacaciones en Uruguay tiene el teléfono en francés y la
      // zona horaria de acá; un uruguayo en París, al revés. Por eso se miran
      // las dos cosas: el idioma del aparato dice en qué idioma lee la persona,
      // la zona dice dónde está.
      prefijos: ["fr"],
      zonas: ["Europe/Paris", "Europe/Brussels", "Indian/Reunion",
              "America/Martinique", "America/Guadeloupe", "America/Cayenne"]
    },
    // ↑ La coma queda a propósito: sumar un idioma tiene que ser pegar una
    //   línea acá abajo, sin tener que acordarse de tocar la de arriba.
    // Para sumar inglés: { id:"en", corta:"EN", larga:"English", fuente:false,
    //   prefijos:["en"], zonas:[...] }  — y sus textos en contenido.json.
  ];

  var CLAVE_GUARDADO = "cy-idioma";

  function ids() { return LISTA.map(function (l) { return l.id; }); }
  function existe(id) { return ids().indexOf(id) !== -1; }
  function fuente() {
    var f = LISTA.filter(function (l) { return l.fuente; })[0];
    return f ? f.id : LISTA[0].id;
  }

  /* Deducción: el idioma del aparato primero, la zona horaria después.
     Se recorre el catálogo en orden, así que el que se agregue después no
     le roba la deducción a uno que ya estaba. */
  function deducido() {
    try {
      var delAparato = navigator.languages || [navigator.language || ""];
      for (var i = 0; i < LISTA.length; i++) {
        var l = LISTA[i];
        if (!l.prefijos.length) continue;
        for (var j = 0; j < delAparato.length; j++) {
          var cod = String(delAparato[j]).toLowerCase();
          for (var k = 0; k < l.prefijos.length; k++) {
            if (cod.indexOf(l.prefijos[k]) === 0) return l.id;
          }
        }
      }
      var zona = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
      for (var m = 0; m < LISTA.length; m++) {
        if (LISTA[m].zonas.indexOf(zona) !== -1) return LISTA[m].id;
      }
    } catch (e) { /* un navegador viejo: queda el idioma fuente */ }
    return fuente();
  }

  function elegido() {
    try { return localStorage.getItem(CLAVE_GUARDADO); } catch (e) { return null; }
  }
  function recordar(l) {
    try { localStorage.setItem(CLAVE_GUARDADO, l); } catch (e) { /* modo privado */ }
  }

  /* El orden manda: lo elegido > la dirección (?lang=xx) > la deducción.
     Una preferencia explícita no se discute con una deducción.

     El editor abre el sitio en un iframe del MISMO ORIGEN, así que comparte el
     localStorage con el sitio público. Sin la excepción de `edit=1`, haber
     tocado FR una vez haría que el editor abriera en francés mientras se está
     editando el español. En modo edición manda la dirección y nada más. */
  function inicial() {
    var editando = /[?&]edit=1/.test(location.search);
    var guardado = editando ? null : elegido();
    if (guardado && existe(guardado)) return guardado;
    var enLaDireccion = (location.search.match(/[?&]lang=([a-z]{2})/) || [])[1];
    if (enLaDireccion && existe(enLaDireccion)) return enLaDireccion;
    return editando ? fuente() : deducido();
  }

  /* Rehace los botones del conmutador desde el catálogo. Los que están
     escritos en el HTML son el respaldo para cuando el JS no corre. */
  function pintarConmutador(contenedor, actual, formato) {
    if (!contenedor) return;
    contenedor.innerHTML = "";
    LISTA.forEach(function (l) {
      var b = document.createElement("button");
      b.type = "button";
      b.dataset.set = l.id;
      b.textContent = (formato === "corta") ? l.corta : l.larga;
      b.setAttribute("aria-pressed", String(l.id === actual));
      contenedor.appendChild(b);
    });
  }

  /* Lectores de contenido por idioma. Los datos del sitio vienen en dos formas
     y las dos caen de vuelta al idioma fuente si falta la traducción: es mejor
     que un hueco.
       enIdioma(obj, "fr")          → obj.fr      || obj.es
       campo(obj, "cap", "fr")      → obj.cap_fr  || obj.cap_es
     Antes cada una estaba escrita con `=== "fr"` en cuatro lugares distintos. */
  function enIdioma(obj, idioma) {
    if (!obj) return "";
    return obj[idioma] || obj[fuente()] || "";
  }
  function campo(obj, base, idioma) {
    if (!obj) return "";
    return obj[base + "_" + idioma] || obj[base + "_" + fuente()] || "";
  }

  /* El idioma fuente no lleva ?lang= en la dirección: su URL es la canónica,
     y es la que apunta el hreflang x-default. */
  function urlCon(u, idioma) {
    if (idioma && idioma !== fuente()) u.searchParams.set("lang", idioma);
    else u.searchParams.delete("lang");
    return u;
  }
  function sufijoUrl(idioma) {
    return (idioma && idioma !== fuente()) ? "?lang=" + idioma : "";
  }

  raiz.CY_IDIOMAS = {
    enIdioma: enIdioma, campo: campo, urlCon: urlCon, sufijoUrl: sufijoUrl,
    lista: LISTA, ids: ids, existe: existe, fuente: fuente,
    deducido: deducido, elegido: elegido, recordar: recordar,
    inicial: inicial, pintarConmutador: pintarConmutador,
    SELLO: "idiomas-1"
  };
})(window);

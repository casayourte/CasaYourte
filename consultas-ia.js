// ─────────────────────────────────────────────────────────────────────────────
// consultas-ia.js — Leer una captura de la conversación con IA. Sello: consultas-ia-2
//
// 2-nov-2026, Mauro: «La consulta en CasaYourte debería cargarse a partir de una
// imagen, una foto, una captura de pantalla que puede ser del chat de WhatsApp
// directamente. Y así como trabaja Remate Taller cuando recibe una foto y hace
// la consulta en Gemini… automáticamente debería generarse la transcripción del
// texto, y la sugerencia pase a ser respondida por Claude… al momento de hacer
// la ronda».
//
// Es el mismo camino que `interno/identificar.js` de remate: la imagen va a
// `claude-proxy`, la función de Netlify de Casa Verde que tiene la única clave
// de Gemini del ecosistema, sin credenciales de este lado. Lo que vuelve es una
// PROPUESTA: la pantalla la muestra antes de guardar, y lo que la IA no pudo
// leer va vacío y en `dudas`. Nunca inventa un nombre, un teléfono ni un
// mensaje: un renglón que no se lee no se agrega.
//
// La respuesta al cliente NO la escribe Gemini: la prepara Claude en la ronda
// (TRASPASO § 4 de `datos`, `herramientas/consultas.mjs pendientes`), con el
// criterio que se va actualizando. Acá sólo se transcribe.
//
// Sin Firebase y sin DOM: lo prueba `node pruebas-consultas.mjs`.
// ─────────────────────────────────────────────────────────────────────────────

export const VERSION_CONSULTAS_IA = "consultas-ia-2";
export const FUNCION_IA = "https://timon-servidor.netlify.app/.netlify/functions/claude-proxy";   // consultas-ia-2: timon-servidor (8-nov-2026)
export const MODELO = "gemini-2.5-flash-lite";
// Netlify corta un pedido de más de 6 MB: seis capturas achicadas entran de sobra.
export const MAX_IMAGENES = 6;
const QUIENES = ["cliente", "nosotros"];

export function armarPrompt({ pista = "" } = {}) {
  return [
    "Sos el asistente de CasaYourte, un taller que fabrica yurtas (casas circulares de madera y lona).",
    "Te paso una o varias capturas de pantalla de una conversación con una persona interesada, casi siempre de WhatsApp, en orden.",
    "Transcribí la conversación TAL CUAL, mensaje por mensaje, en el idioma en que está escrita.",
    "Quién escribe: en WhatsApp los globos de la DERECHA (verdes) son nuestros —\"nosotros\"— y los de la IZQUIERDA (blancos o grises) son de la otra persona —\"cliente\"—. En otra app, guiate por el mismo criterio de lado.",
    "Si una captura se superpone con la anterior, no repitas los mensajes que ya transcribiste.",
    "Un audio, una foto o un documento se anota entre corchetes, por ejemplo [audio 0:42] o [foto], sin inventar lo que dice.",
    "Arriba de la pantalla suele estar el nombre o el número del contacto: copialo si se ve. Si no se ve, va null.",
    "Si un mensaje NO está en castellano, agregá su traducción al castellano en \"traduccion\"; si está en castellano, \"traduccion\" va null.",
    "REGLAS: no inventes nada. Un texto que no se lee bien va con [ilegible] en ese lugar. La hora y la fecha sólo si se ven en la captura. Lo que te genere duda, el nombre del campo en \"dudas\".",
    pista ? `Quien carga la captura anotó: «${String(pista).slice(0, 160)}». Tomalo como pista, no como verdad.` : "",
    "Devolvé SOLO un objeto JSON, sin texto antes ni después y sin ``` alrededor, con esta forma:",
    JSON.stringify({
      contacto: { nombre: null, telefono: null },
      idioma: "es | en | fr | pt | otro: el de la persona, no el nuestro",
      pais: "null salvo que se deduzca con seguridad (código del teléfono o lo dice)",
      mensajes: [{ quien: "cliente | nosotros", fecha: "AAAA-MM-DD o null", hora: "HH:MM o null", texto: "tal cual", traduccion: null }],
      pedido: "qué pide o qué le interesa, en una línea en castellano",
      dudas: [],
    }),
  ].filter(Boolean).join("\n");
}

const txt = (v, n) => (typeof v === "string" && v.trim() && !/^(null|undefined)$/i.test(v.trim()) ? v.trim().slice(0, n) : null);

/* Lo que devolvió el modelo, leído con desconfianza: un JSON aunque venga con
   ``` o con una frase antes; cada campo con su forma y su tamaño; un mensaje
   sin quién o sin texto se descarta. Lo que no entiende, null. */
export function leerTranscripcion(texto) {
  const t = String(texto || "").replace(/```(?:json)?/gi, "");
  const a = t.indexOf("{"), b = t.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  let x;
  try { x = JSON.parse(t.slice(a, b + 1)); } catch { return null; }
  if (!x || typeof x !== "object") return null;
  const fecha = (v) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.trim()) ? v.trim() : null);
  const hora = (v) => {
    const m = typeof v === "string" && v.trim().match(/^(\d{1,2}):(\d{2})/);
    return m && +m[1] < 24 && +m[2] < 60 ? m[1].padStart(2, "0") + ":" + m[2] : null;
  };
  const tel = (v) => {
    const s = txt(v, 30);
    return s && /^\+?[\d\s().-]{7,}$/.test(s) ? s.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "") : null;
  };
  const idioma = txt(x.idioma, 10);
  const mensajes = (Array.isArray(x.mensajes) ? x.mensajes : [])
    .map((m) => m && typeof m === "object" ? {
      quien: QUIENES.includes(m.quien) ? m.quien : null,
      fecha: fecha(m.fecha), hora: hora(m.hora),
      texto: txt(m.texto, 4000), traduccion: txt(m.traduccion, 4000),
    } : null)
    .filter((m) => m && m.quien && m.texto)
    .slice(0, 80);
  if (!mensajes.length) return null;
  const c = x.contacto && typeof x.contacto === "object" ? x.contacto : {};
  return {
    contacto: { nombre: txt(c.nombre, 80), telefono: tel(c.telefono) },
    idioma: idioma && /^(es|en|fr|pt|otro)$/i.test(idioma) ? idioma.toLowerCase() : null,
    pais: txt(x.pais, 40),
    mensajes,
    pedido: txt(x.pedido, 200),
    dudas: (Array.isArray(x.dudas) ? x.dudas : []).map((d) => txt(d, 40)).filter(Boolean).slice(0, 10),
  };
}

const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim();

/**
 * Suma lo transcripto a la conversación que ya había, SIN REPETIR: una captura
 * nueva casi siempre vuelve a mostrar los últimos mensajes de la anterior. Un
 * mensaje ya está si coinciden quién y el texto (sin mayúsculas, acentos ni
 * espacios de más). Un BORRADOR nuestro que aparece en la captura se marca
 * «mandado». Devuelve {mensajes, agregados, nuevos, repetidos, confirmados, estado}.
 *
 * La fecha de cada mensaje: la de la captura si se ve con hora; si no, la de
 * ahora corrida de a un milisegundo para que queden en el orden en que se
 * leyeron y DESPUÉS de lo que ya había. `fuente: "captura"` dice de dónde salió.
 */
export function unirConversacion(existentes, leidos, { ahora = new Date(), por = "" } = {}) {
  existentes = (existentes || []).map((m) => ({ ...m }));
  const ya = new Set(existentes.map((m) => m.quien + "|" + norm(m.texto)));
  let confirmados = 0;
  const base = Math.max(ahora.getTime(), ...(existentes || []).map((m) => Date.parse(m.en) || 0).map((n) => n + 1));
  const nuevos = [];
  let repetidos = 0;
  for (const m of leidos || []) {
    const k = m.quien + "|" + norm(m.texto);
    if (ya.has(k)) {
      // Un borrador de Claude que aparece en la captura ya se mandó: se marca, no se repite.
      const bor = m.quien === "nosotros" && existentes.find((x) => x.estado === "borrador" && x.quien === "nosotros" && norm(x.texto) === norm(m.texto));
      if (bor) { bor.estado = "mandado"; confirmados++; } else repetidos++;
      continue;
    }
    ya.add(k);
    let en = null;
    if (m.fecha && m.hora) {
      const d = new Date(m.fecha + "T" + m.hora + ":00");
      if (!isNaN(d) && d.getTime() <= ahora.getTime()) en = new Date(d.getTime() + nuevos.length).toISOString();
    }
    const n = { en: en || new Date(base + nuevos.length).toISOString(), quien: m.quien, texto: m.texto, fuente: "captura" };
    if (m.traduccion) n.traduccion = m.traduccion;
    if (m.hora && !en) n.horaVista = m.hora;
    if (por) n.por = por;
    nuevos.push(n);
  }
  const mensajes = [...(existentes || []), ...nuevos];
  return { mensajes, agregados: nuevos, nuevos: nuevos.length, repetidos, confirmados, estado: estadoSegun(mensajes) };
}

/* En qué quedó: si lo último que se dijo (sin contar notas ni borradores) es
   del cliente, falta contestar —«nueva» si nunca se le contestó, «en
   conversación» si ya hubo ida y vuelta—; si es nuestro, «respondida». */
export function estadoSegun(mensajes, actual) {
  const reales = [...(mensajes || [])].filter((m) => m.quien !== "nota" && m.estado !== "borrador")
    .sort((a, b) => String(a.en || "").localeCompare(String(b.en || "")));
  if (!reales.length) return actual || "nueva";
  if (actual === "presupuesto" || actual === "cerrada") return actual;
  const ultimo = reales[reales.length - 1];
  if (ultimo.quien === "nosotros") return "respondida";
  return reales.some((m) => m.quien === "nosotros") ? "conversacion" : "nueva";
}

/* Completa la ficha con lo que se vio, sin pisar lo que ya estaba. */
export function completarCliente(cliente, leido) {
  const c = { ...(cliente || {}) };
  if (!c.nombre && leido.contacto.nombre) c.nombre = leido.contacto.nombre;
  if (!c.telefono && leido.contacto.telefono) c.telefono = leido.contacto.telefono;
  if (!c.idioma && leido.idioma) c.idioma = leido.idioma;
  if (!c.pais && leido.pais) c.pais = leido.pais;
  return c;
}

/**
 * Le pide la transcripción a la función de Casa Verde. `fetch` se inyecta para
 * que el banco lo simule. → {ok:true, leido} o {ok:false, motivo}. Nunca tira.
 * `imagenes` = [{datos: base64, mime}].
 */
export async function pedirTranscripcion({ imagenes = [], pista = "" } = {},
  { fetch: pedir = globalThis.fetch, esperaMs = 45000 } = {}) {
  const ims = (imagenes || []).filter((i) => i && /^[A-Za-z0-9+/=]+$/.test(i.datos || ""));
  if (!ims.length) return { ok: false, motivo: "No se pudo leer la imagen." };
  if (ims.length > MAX_IMAGENES) return { ok: false, motivo: `Son ${ims.length} capturas: van hasta ${MAX_IMAGENES} por vez.` };
  const corte = new AbortController();
  const reloj = setTimeout(() => corte.abort(), esperaMs);
  try {
    const r = await pedir(FUNCION_IA, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: MODELO, max_tokens: 6000, messages: [{ role: "user", content: [
        ...ims.map((i) => ({ type: "image", source: { type: "base64",
          media_type: ["image/jpeg", "image/png", "image/webp"].includes(i.mime) ? i.mime : "image/jpeg", data: i.datos } })),
        { type: "text", text: armarPrompt({ pista }) },
      ] }] }),
      signal: corte.signal,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return { ok: false, motivo: "La IA no contestó bien: " + (j.error || r.status) + ". Cargala a mano." };
    const texto = (Array.isArray(j.content) ? j.content : []).map((p) => (p && p.text) || "").join("");
    const leido = leerTranscripcion(texto);
    if (!leido) return { ok: false, motivo: j.warning
      ? "La respuesta de la IA llegó cortada: probá con menos capturas por vez."
      : "La IA no encontró mensajes que se puedan leer. ¿Es la captura de una conversación?" };
    return { ok: true, leido };
  } catch (e) {
    return { ok: false, motivo: e && e.name === "AbortError" ? "La IA tardó demasiado. Probá de nuevo o con menos capturas."
      : "No se pudo llegar a la IA. ¿Hay internet?" };
  } finally { clearTimeout(reloj); }
}

// pruebas-consultas.mjs — «Desde una captura» de consultas.html (consultas-ia.js).
//   node pruebas-consultas.mjs        (sin npm, sin red, sin navegador)
//
// Lo que importa (2-nov-2026, Mauro: la consulta se carga desde una captura de
// WhatsApp, la IA transcribe y Claude responde en la ronda):
//   · lo que vuelve de la IA se lee con desconfianza: nada inventado entra;
//   · una captura que se superpone con la anterior no repite mensajes;
//   · el estado dice si falta contestar, que es lo que mira la ronda;
//   · la ficha sólo se completa, nunca se pisa;
//   · la página usa este módulo, ofrece cámara Y archivos, y no guarda sin mostrar.
import assert from "node:assert/strict";
import fs from "node:fs";
import * as IA from "./consultas-ia.js";

let pasadas = 0, fallidas = 0;
const prueba = async (n, f) => { try { await f(); pasadas++; console.log("  ✓ " + n); } catch (e) { fallidas++; console.log("  ✗ " + n + "\n      " + e.message); } };

const RESP = {
  contacto: { nombre: "Claire", telefono: "+33 6 12 34 56 78" },
  idioma: "fr", pais: "Francia",
  mensajes: [
    { quien: "cliente", fecha: "2026-10-30", hora: "9:05", texto: "Bonjour, combien coûte une yourte de 7 m ?", traduccion: "Hola, ¿cuánto cuesta una yurta de 7 m?" },
    { quien: "nosotros", fecha: null, hora: "09:20", texto: "Hola Claire! Te cuento…", traduccion: null },
    { quien: "cliente", texto: "Merci !", traduccion: "¡Gracias!" },
  ],
  pedido: "precio de una yurta de 7 m", dudas: ["pais"],
};

await prueba("lee el JSON aunque venga con ``` y una frase antes", () => {
  const l = IA.leerTranscripcion("Acá va:\n```json\n" + JSON.stringify(RESP) + "\n```");
  assert.equal(l.mensajes.length, 3); assert.equal(l.contacto.nombre, "Claire");
  assert.equal(l.contacto.telefono, "+33612345678"); assert.equal(l.idioma, "fr");
  assert.equal(l.mensajes[0].hora, "09:05"); assert.equal(l.mensajes[1].fecha, null);
});
await prueba("lo inventado o mal formado no entra: quién raro, texto vacío, teléfono que no es, idioma raro", () => {
  const l = IA.leerTranscripcion(JSON.stringify({
    contacto: { nombre: "null", telefono: "Mamá" }, idioma: "klingon",
    mensajes: [{ quien: "yo", texto: "hola" }, { quien: "cliente", texto: "  " }, { quien: "cliente", texto: "ok", hora: "25:99", fecha: "30/10" }],
  }));
  assert.equal(l.mensajes.length, 1); assert.equal(l.mensajes[0].hora, null); assert.equal(l.mensajes[0].fecha, null);
  assert.equal(l.contacto.nombre, null); assert.equal(l.contacto.telefono, null); assert.equal(l.idioma, null);
});
await prueba("sin un solo mensaje legible, no hay transcripción", () => {
  assert.equal(IA.leerTranscripcion("no es json"), null);
  assert.equal(IA.leerTranscripcion(JSON.stringify({ mensajes: [] })), null);
});

const AHORA = new Date("2026-11-02T12:00:00Z");
await prueba("una captura que se superpone no repite (sin mayúsculas, acentos ni espacios)", () => {
  const ya = [{ en: "2026-10-30T12:05:00.000Z", quien: "cliente", texto: "Bonjour, combien coûte une yourte de 7 m ?" }];
  const leidos = [{ quien: "cliente", texto: "bonjour,  combien coute une yourte de 7 m ?" }, { quien: "nosotros", texto: "Hola!" }];
  const u = IA.unirConversacion(ya, leidos, { ahora: AHORA, por: "captura" });
  assert.equal(u.nuevos, 1); assert.equal(u.repetidos, 1); assert.equal(u.mensajes.length, 2);
  assert.equal(u.agregados[0].fuente, "captura"); assert.equal(u.agregados[0].por, "captura");
});
await prueba("un borrador de Claude que aparece en la captura queda «mandado», y el estado lo cuenta", () => {
  const ya = [{ en: "2026-11-01T10:00:00.000Z", quien: "cliente", texto: "¿Precio?" },
    { en: "2026-11-01T11:00:00.000Z", quien: "nosotros", texto: "Hola! Depende del diámetro.", por: "Claude", estado: "borrador" }];
  const u = IA.unirConversacion(ya, [{ quien: "cliente", texto: "¿Precio?" }, { quien: "nosotros", texto: "hola! depende del diametro." }], { ahora: AHORA });
  assert.equal(u.confirmados, 1); assert.equal(u.nuevos, 0); assert.equal(u.mensajes[1].estado, "mandado");
  assert.equal(u.estado, "respondida");
  assert.equal(ya[1].estado, "borrador", "no toca el arreglo de entrada");
});
await prueba("el mismo texto de la OTRA persona no es repetido", () => {
  const u = IA.unirConversacion([{ en: "x", quien: "cliente", texto: "Gracias" }], [{ quien: "nosotros", texto: "gracias" }], { ahora: AHORA });
  assert.equal(u.nuevos, 1);
});
await prueba("sin fecha visible quedan en orden y después de lo que había; con fecha y hora, la de la captura", () => {
  const ya = [{ en: "2026-11-02T13:00:00.000Z", quien: "nota", texto: "llamó" }];
  const u = IA.unirConversacion(ya, [
    { quien: "cliente", texto: "uno", hora: "10:00" }, { quien: "cliente", texto: "dos" },
    { quien: "cliente", texto: "tres", fecha: "2026-10-01", hora: "10:00" },
  ], { ahora: AHORA });
  const [a, b, c] = u.agregados;
  assert.ok(a.en > ya[0].en && b.en > a.en, "orden");
  assert.equal(a.horaVista, "10:00"); assert.equal(c.en.slice(0, 10), "2026-10-01"); assert.equal(c.horaVista, undefined);
});
await prueba("una fecha leída en el futuro no se cree", () => {
  const u = IA.unirConversacion([], [{ quien: "cliente", texto: "x", fecha: "2027-01-01", hora: "10:00" }], { ahora: AHORA });
  assert.ok(u.agregados[0].en.startsWith("2026-11-02"));
});
await prueba("el estado: nueva si nunca se contestó, conversación si hubo ida y vuelta, respondida si lo último es nuestro", () => {
  const c = (quien, en, extra = {}) => ({ quien, en, texto: "t", ...extra });
  assert.equal(IA.estadoSegun([c("cliente", "1")]), "nueva");
  assert.equal(IA.estadoSegun([c("cliente", "1"), c("nosotros", "2"), c("cliente", "3")]), "conversacion");
  assert.equal(IA.estadoSegun([c("cliente", "1"), c("nosotros", "2")]), "respondida");
  // un borrador o una nota no cuentan como respuesta
  assert.equal(IA.estadoSegun([c("cliente", "1"), c("nosotros", "2", { estado: "borrador" }), c("nota", "3")]), "nueva");
  // presupuesto y cerrada no se tocan
  assert.equal(IA.estadoSegun([c("cliente", "1")], "presupuesto"), "presupuesto");
});
await prueba("la ficha se completa y no se pisa", () => {
  const l = IA.leerTranscripcion(JSON.stringify(RESP));
  const c = IA.completarCliente({ nombre: "Claire D.", pais: "" }, l);
  assert.equal(c.nombre, "Claire D."); assert.equal(c.telefono, "+33612345678"); assert.equal(c.pais, "Francia"); assert.equal(c.idioma, "fr");
});

await prueba("el pedido a la IA: el modelo liviano, todas las imágenes y el texto, sin credenciales", async () => {
  let cuerpo = null, url = null;
  const r = await IA.pedirTranscripcion({ imagenes: [{ datos: "QUJD", mime: "image/jpeg" }, { datos: "REVG", mime: "image/heic" }] }, {
    fetch: async (u, o) => { url = u; cuerpo = JSON.parse(o.body); return { ok: true, json: async () => ({ content: [{ text: JSON.stringify(RESP) }] }) }; },
  });
  assert.equal(r.ok, true); assert.equal(url, IA.FUNCION_IA);
  assert.equal(cuerpo.model, "gemini-2.5-flash-lite");
  const partes = cuerpo.messages[0].content;
  assert.equal(partes.filter((p) => p.type === "image").length, 2);
  assert.equal(partes[1].source.media_type, "image/jpeg");
  assert.ok(!/api_?key|authorization|clave|secret/i.test(JSON.stringify(cuerpo)));
});
await prueba("nunca tira: error del servidor, respuesta ilegible, de más imágenes, sin red", async () => {
  const resp = (ok, j) => async () => ({ ok, status: 500, json: async () => j });
  assert.equal((await IA.pedirTranscripcion({ imagenes: [{ datos: "QQ==" }] }, { fetch: resp(false, { error: "x" }) })).ok, false);
  assert.match((await IA.pedirTranscripcion({ imagenes: [{ datos: "QQ==" }] }, { fetch: resp(true, { content: [{ text: "nada" }] }) })).motivo, /no encontró/);
  assert.match((await IA.pedirTranscripcion({ imagenes: Array(7).fill({ datos: "QQ==" }) }, { fetch: resp(true, {}) })).motivo, /hasta 6/);
  assert.match((await IA.pedirTranscripcion({ imagenes: [{ datos: "QQ==" }] }, { fetch: async () => { throw new Error("red"); } })).motivo, /internet/);
  assert.equal((await IA.pedirTranscripcion({ imagenes: [{ datos: "no base64!" }] })).ok, false);
});

const pag = fs.readFileSync(new URL("./consultas.html", import.meta.url), "utf8");
const sw = fs.readFileSync(new URL("./sw.js", import.meta.url), "utf8");
await prueba("la página usa el módulo, ofrece cámara Y archivos, y guarda sólo desde la vista previa", () => {
  assert.match(pag, /from "\.\/consultas-ia\.js"/);
  assert.match(pag, /id="ia-camara"[^>]*|capture="environment" id="ia-camara"/);
  assert.match(pag, /accept="image\/\*" id="ia-archivo"/);
  assert.ok(!/accept="image\/\*" id="ia-archivo"[^>]*capture/.test(pag), "el de archivos no lleva capture");
  const lectura = pag.slice(pag.indexOf("async function leerCapturas"), pag.indexOf('$("ia-cancelar")'));
  assert.ok(!/guardar\(|setDoc|updateDoc/.test(lectura), "leer no guarda");
});
await prueba("el sello sube y el módulo está en el SHELL", () => {
  assert.match(pag, /CY\.PANEL = "consultas-4"/);
  assert.ok(sw.includes("'./consultas-ia.js'"));
});

console.log(`\n  ${pasadas} pasaron, ${fallidas} fallaron`);
process.exit(fallidas ? 1 : 0);

// capas.js — las capas del muro y del techo, y los criterios que las deciden.
// Sello: capas-2 (26-nov-2026: la tapa aislante sólo con el domo; la lona en paños, sin cordón)
// capas-1 (25-nov-2026)
//
// Mauro, 25-nov-2026: «dejemos un registro de estos conceptos y criterios,
// decisiones de las capas, visible en la pestaña del administrador en Cálculos».
// Salieron de armar la primera obra en Brasil (una yurta de 7 m en la Bahía,
// clima cálido y húmedo, con una lona de PVC hermética por afuera).
//
// Una sola copia: la pestaña «Capas» de calculo.html la pinta tal cual. Si un
// criterio cambia, cambia acá, con su fecha y lo que dijo Mauro. Sin precios ni
// proveedores (el repositorio es público): eso vive en Presupuestos.
//
// Sin DOM y sin Firebase: lo revisa `node pruebas-calculo.mjs`.

export const SELLO_CAPAS = "capas-2";

// De ADENTRO hacia AFUERA, en el muro y en el techo.
export const CAPAS = [
  { capa: "Algodón crudo", donde: "muro y techo, la cara vista de adentro",
    por: "Deja pasar el vapor y amortigua la humedad del ambiente. Adentro no va ninguna capa cerrada (ver «Sin freno de vapor»)." },
  { capa: "Lana de PET", donde: "muro y techo",
    por: "240 mm nominales (dos capas de 100 y una de 50), comprimidos a 180 entre el trei y la lona en el muro y entre la primera y la segunda capa en el techo. No absorbe agua, no se pudre y no cría hongo: tolera una humedad pasajera." },
  { capa: "Tyvek", donde: "muro y techo, entre la lana y la lona",
    por: "Escudo contra la condensación, no freno de vapor: frena el agua líquida y deja pasar el vapor, igual por sus dos caras (DuPont: el lado impreso es indistinto). Recibe las gotas que se forman en la cara de adentro de la lona y las lleva afuera." },
  { capa: "Cámara ventilada", donde: "entre el Tyvek y la lona",
    por: "Por donde sale el vapor antes de condensarse y se seca lo que se condensa. En clima caliente, además, se lleva el calor de la lona al sol. Entra abajo (alero) y sale arriba (ranura del sobrealto)." },
  { capa: "Lona de PVC hermética", donde: "muro y techo, afuera",
    por: "No deja pasar agua ni vapor. Sin costuras: en el techo, tiras radiales solapadas; en el muro, vueltas horizontales." },
];

// Las decisiones, cada una con su porqué. La más nueva, arriba.
export const CRITERIOS = [
  { fecha: "26-nov-2026", titulo: "Con el sobrealto no va la tapa aislante del toono",
    texto: "La tapa redonda interior (con su bisagra, su soga y su manivela) está para cortar el sol que entra de arriba por el domo. Con el sobrealto las ventanas son laterales y no hay sol cenital: no hace falta. Cada vez que la propuesta lleve sobrealto, la tapa sale (Cálculos la apaga sola)." },
  { fecha: "26-nov-2026", titulo: "La lona en paños no lleva el cierre de zapatilla",
    texto: "Cuando la lona del techo va en paños solapados, sin costura, no hay un cono que cerrar: no lleva la banda con anillas ni el cordón en zigzag de la lona de una pieza («Lona del techo» en Medidas)." },
  { fecha: "25-nov-2026", titulo: "El orden de montaje: primero el muro, después el techo",
    texto: "El Tyvek del muro se cierra primero, y abajo termina por fuera del borde del piso. Después el del techo, SIN desborde: del toono hasta el borde del muro y 20 cm más, bajando por FUERA del Tyvek del muro. Así una gota de condensación que corre por el techo cae afuera del muro y nunca adentro de la lana." },
  { fecha: "25-nov-2026", titulo: "La ranura de respiración, debajo de las ventanas del sobrealto",
    texto: "La cámara entre el Tyvek y la lona sale por una vuelta de unos 4 cm de alto justo debajo de las 8 ventanas del sobrealto, entre el borde de arriba de la lona y la solera. La cubre una pestaña de madera por cara, a 45° y con goterón por debajo, que baja 2 cm más que la ranura, para que el agua que escurre por los vidrios no entre con lluvia fuerte; detrás, tela mosquitera. Las ventanas quedan bajo el alero del techito. Falta definir la ENTRADA de aire de abajo, en el alero: sin entrada, la cámara casi no se renueva." },
  { fecha: "25-nov-2026", titulo: "Sin freno de vapor cerrado adentro (con lona hermética afuera)",
    texto: "Con una lona que no deja pasar el vapor, una segunda capa cerrada adentro (polietileno, papel o manta aluminizada) deja la lana entre dos barreras: la humedad que entre por una costura, un vano o la obra no se seca nunca. La pared y el techo se secan hacia adentro y hacia la cámara: el interior queda abierto (algodón) y lo que manda es VENTILAR la cámara. Vale para clima cálido y húmedo sin calefacción, como la Bahía. En un clima frío con calefacción el criterio cambia y se revisa." },
  { fecha: "25-nov-2026", titulo: "Si hay aire acondicionado muchas horas",
    texto: "El vapor va al revés (de afuera hacia adentro) y el aire húmedo de la cámara puede condensarse detrás del algodón, contra el interior frío. Ahí sí tendría sentido un freno de vapor VARIABLE (una membrana que se cierra con el aire seco y se abre con el húmedo); hay que confirmar cuál se consigue en Brasil. Nunca una capa cerrada." },
  { fecha: "25-nov-2026", titulo: "El Tyvek no es freno de vapor",
    texto: "Es una lámina de fibras de polietileno, sin capas: estanca al agua líquida, abierta al vapor, igual por las dos caras. Por eso sirve justo para esto: deja que el vapor siga hacia la cámara y ataja las gotas. Se cuenta en tiras, como la lona: en un cono, las tiras rectas se pisan cerca del toono y se gasta más que la superficie." },
];

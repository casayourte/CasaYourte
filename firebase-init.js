// ═══════════════════════════════════════════════════════════════
//  CASAYOURTE — firebase-init.js
//  Sello: init-2
//  Punto ÚNICO de contacto con el SDK de Firebase.
//  Regla (Libro 1 §3.1): ninguna página importa de gstatic
//  directamente; todo pasa por este módulo. La versión del SDK
//  vive SOLO acá.
// ═══════════════════════════════════════════════════════════════
//
//  EL SDK SE CARGA DIFERIDO, Y ÉSTE ES EL MOTIVO.
//
//  Hasta el sello init-1 esto empezaba con tres `import` estáticos desde
//  gstatic.com. Un `import` estático es una dependencia DURA: si el CDN no
//  contesta —un ascensor, un ómnibus, una red que filtra, gstatic caído— el
//  módulo no evalúa, y con él no evalúa `nucleo.js`, y con él no evalúa el
//  `<script type="module">` de la página. **No falla la parte que usa
//  Firebase: falla la página ENTERA, en blanco y sin un solo mensaje.**
//
//  Y acá pega más fuerte que en un sitio común, porque el panel es una app
//  instalable: el `sw.js` guarda el cascarón, así que sin señal el HTML, el
//  CSS y el JS abren perfecto... y la pantalla quedaba igual en blanco,
//  porque lo único que faltaba era justo lo que nunca se cachea. La
//  instalación parecía rota.
//
//  Es el hallazgo A2 de la primera auditoría de protocolos (2026-09-09):
//  la regla `general:cdn-diferido` existía y no se cumplía en ninguno de los
//  cuatro sitios. El panel de datos lo resolvió primero (su sello `init-3`) y
//  esto es el mismo patrón traído acá — `general:llevar-no-reinventar`.
//
//  CÓMO FUNCIONA SIN OBLIGAR A REESCRIBIR A QUIEN LO USA: lo que se exporta
//  son `let`, no `const`. Un `export let` es un **enlace vivo** — quien hizo
//  `import { db } from './firebase-init.js'` ve el valor que tenga la
//  variable EN EL MOMENTO DE USARLA, no el que tenía al importar. Así
//  `cargarFirebase()` los rellena y los lugares que escriben `doc(db, …)`
//  siguen escribiéndolo igual.
//
//  ⚠ LA CONTRA, QUE HAY QUE SABER: antes de que `cargarFirebase()` resuelva,
//  todos valen `undefined`. **Nada que dependa de Firebase puede correr al
//  nivel superior de un módulo.** Por eso cada página la espera primero, con
//  `CY.conFirebase()`, que además es quien muestra el cartel si no baja.
//
//  ── Configuración del proyecto ───────────────────────────────
//  Estos valores son PÚBLICOS por diseño: identifican el proyecto, no dan
//  permisos. Lo que da o niega acceso son las Security Rules (Libro 1 §5).
// ═══════════════════════════════════════════════════════════════

const SDK = 'https://www.gstatic.com/firebasejs/12.16.0/';

export const firebaseConfig = {
  apiKey: 'AIzaSyDDD_xvpC4I_ec2OZymyDqVsm1K0ISTr4Q',
  authDomain: 'casayourte-mauro.firebaseapp.com',
  projectId: 'casayourte-mauro',
  storageBucket: 'casayourte-mauro.firebasestorage.app',
  messagingSenderId: '716760879314',
  appId: '1:716760879314:web:33aef72fb525eb57931d0b'
};

/* Enlaces vivos: `undefined` hasta que `cargarFirebase()` los rellena. */
export let app, db, auth;
export let doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
           collection, serverTimestamp, writeBatch;
export let onAuthStateChanged, signInWithEmailAndPassword,
           createUserWithEmailAndPassword, signOut, sendPasswordResetEmail;

/* `false` mientras no anduvo. Lo mira `diagnostico.html`. */
export let cargado = false;

/* Los guarda para `crearCuentaAuth`, que necesita armar una app secundaria
   cuando ya se bajó el SDK. */
let _initializeApp, _getApps, _getAuth;

let _promesa = null;

/* Idempotente a propósito: si dos cosas la llaman a la vez, el SDK se baja
   una sola vez. Y si FALLÓ, un llamado nuevo REINTENTA —por eso la promesa
   se borra en el catch—: el caso típico es que vuelva la señal. */
export function cargarFirebase() {
  if (_promesa) return _promesa;
  _promesa = (async () => {
    let modApp, modAuth, modFs;
    try {
      [modApp, modAuth, modFs] = await Promise.all([
        import(SDK + 'firebase-app.js'),
        import(SDK + 'firebase-auth.js'),
        import(SDK + 'firebase-firestore.js')
      ]);
    } catch (e) {
      /* El error del navegador para un módulo que no baja es genérico
         («error loading dynamically imported module»). Se traduce acá, una
         sola vez, para que la pantalla no tenga que adivinar. */
      const err = new Error(
        'No se pudo cargar el SDK de Firebase desde gstatic.com. '
        + 'Suele ser falta de señal o una red que bloquea ese dominio.'
      );
      err.causa = e;
      err.codigo = 'sdk-no-baja';
      _promesa = null;
      throw err;
    }

    ({ initializeApp: _initializeApp, getApps: _getApps } = modApp);
    _getAuth = modAuth.getAuth;

    app = _initializeApp(firebaseConfig);
    auth = _getAuth(app);

    ({ onAuthStateChanged, signInWithEmailAndPassword,
       createUserWithEmailAndPassword, signOut,
       sendPasswordResetEmail } = modAuth);
    ({ doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
       collection, serverTimestamp, writeBatch } = modFs);

    // ── Firestore con caché persistente desde el día uno ─────────
    // Las lecturas repetidas salen del dispositivo (IndexedDB), el panel abre
    // sin conexión mostrando lo último leído, y las escrituras se encolan y
    // sincronizan solas al volver la señal. Multi-pestaña habilitado.
    //
    // Los DATOS van por acá, NO por el service worker (Libro 1 §3.14).
    //
    // El `try` no es adorno: `initializeFirestore` falla si algo ya llamó a
    // `getFirestore(app)` antes, y el navegador puede negar el almacenamiento
    // (incógnito, disco lleno, un ajuste). En cualquiera de esos casos vale
    // más un panel que anda sin caché que uno que no abre.
    try {
      db = modFs.initializeFirestore(app, {
        localCache: modFs.persistentLocalCache({
          tabManager: modFs.persistentMultipleTabManager()
        })
      });
    } catch (e) {
      console.warn('Firestore sin caché persistente:', e && e.message);
      db = modFs.getFirestore(app);
    }

    cargado = true;
    return true;
  })();
  return _promesa;
}

// ── Alta de cuentas SIN perder la sesión del admin ───────────
// createUserWithEmailAndPassword loguea a la cuenta nueva en la instancia
// donde corre: si se usa la principal, el admin queda expulsado de su
// propia sesión. Se usa una app SECUNDARIA descartable.
// (Patrón tomado de Casa Verde.)
//
// Espera a `cargarFirebase()` por las dudas: la llama el panel de usuarios,
// que ya cargó, pero una función que se puede llamar sola no debe depender
// de que alguien haya cargado antes.
export async function crearCuentaAuth(email, clave) {
  await cargarFirebase();
  const app2 = _getApps().find((a) => a.name === 'alta-usuarios')
    ?? _initializeApp(firebaseConfig, 'alta-usuarios');
  const auth2 = _getAuth(app2);
  const cred = await createUserWithEmailAndPassword(auth2, email, clave);
  const uid = cred.user.uid;
  await signOut(auth2);
  return uid;
}

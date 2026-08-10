// ═══════════════════════════════════════════════════════════════
//  CASAYOURTE — firebase-init.js
//  Punto ÚNICO de contacto con el SDK de Firebase.
//  Regla (Libro 1 §3.1): ninguna página importa de gstatic
//  directamente; todo pasa por este módulo. La versión del SDK
//  vive SOLO acá.
// ═══════════════════════════════════════════════════════════════

import { initializeApp, getApps } from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, serverTimestamp, writeBatch
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js';
import {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signOut, sendPasswordResetEmail
} from 'https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js';

// ── Configuración del proyecto ───────────────────────────────
// Estos valores son PÚBLICOS por diseño: identifican el proyecto, no dan
// permisos. Lo que da o niega acceso son las Security Rules (Libro 1 §5).
const firebaseConfig = {
  apiKey: 'AIzaSyDDD_xvpC4I_ec2OZymyDqVsm1K0ISTr4Q',
  authDomain: 'casayourte-mauro.firebaseapp.com',
  projectId: 'casayourte-mauro',
  storageBucket: 'casayourte-mauro.firebasestorage.app',
  messagingSenderId: '716760879314',
  appId: '1:716760879314:web:33aef72fb525eb57931d0b'
};

const app = initializeApp(firebaseConfig);

// ── Firestore con caché persistente desde el día uno ─────────
// Las lecturas repetidas salen del dispositivo (IndexedDB), el panel abre
// sin conexión mostrando lo último leído, y las escrituras se encolan y
// sincronizan solas al volver la señal. Multi-pestaña habilitado.
//
// Los DATOS van por acá, NO por el service worker (Libro 1 §3.14).
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

const auth = getAuth(app);

// ── Alta de cuentas SIN perder la sesión del admin ───────────
// createUserWithEmailAndPassword loguea a la cuenta nueva en la instancia
// donde corre: si se usa la principal, el admin queda expulsado de su
// propia sesión. Se usa una app SECUNDARIA descartable.
// (Patrón tomado de Casa Verde.)
export async function crearCuentaAuth(email, clave) {
  const app2 = getApps().find((a) => a.name === 'alta-usuarios')
    ?? initializeApp(firebaseConfig, 'alta-usuarios');
  const auth2 = getAuth(app2);
  const cred = await createUserWithEmailAndPassword(auth2, email, clave);
  const uid = cred.user.uid;
  await signOut(auth2);
  return uid;
}

export {
  app, db, auth, firebaseConfig,
  // Usado por el alta por invitación del panel: la persona crea SU propia
  // cuenta, así que acá sí corresponde la instancia principal.
  createUserWithEmailAndPassword,
  doc, getDoc, getDocs, setDoc, addDoc, updateDoc, deleteDoc,
  collection, serverTimestamp, writeBatch,
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  sendPasswordResetEmail
};

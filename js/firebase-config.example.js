/**
 * Copia este archivo como firebase-config.js y completa los valores.
 *
 * Configuracion Google / Firebase (una vez):
 * 1. https://console.firebase.google.com → Crear proyecto
 * 2. Authentication → Sign-in method → Google → Habilitar
 * 3. Authentication → Settings → Authorized domains → agregar:
 *    - lasucursaldelcafe-droid.github.io
 *    - localhost (ya viene)
 * 4. Firestore → Crear base de datos (modo produccion, ubicacion cercana)
 * 5. Project settings → Your apps → Web → copiar firebaseConfig
 * 6. Reglas Firestore (pegar en Rules):
 *
 *    rules_version = '2';
 *    service cloud.firestore {
 *      match /databases/{database}/documents {
 *        function signedIn() { return request.auth != null; }
 *        function isAdmin() {
 *          return signedIn() &&
 *            get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
 *        }
 *        match /users/{userId} {
 *          allow read: if signedIn() && (request.auth.uid == userId || isAdmin());
 *          allow create: if signedIn() && request.auth.uid == userId;
 *          allow update: if isAdmin() || (signedIn() && request.auth.uid == userId
 *            && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role']));
 *        }
 *        match /quotes/{quoteId} {
 *          allow read: if signedIn() && (resource.data.cotizador.uid == request.auth.uid || isAdmin());
 *          allow create: if signedIn() && request.resource.data.cotizador.uid == request.auth.uid;
 *          allow update, delete: if signedIn() &&
 *            (resource.data.cotizador.uid == request.auth.uid || isAdmin());
 *        }
 *      }
 *    }
 */
const VP_FIREBASE_CONFIG = {
  enabled: false,
  apiKey: 'TU_API_KEY',
  authDomain: 'TU_PROYECTO.firebaseapp.com',
  projectId: 'TU_PROYECTO',
  storageBucket: 'TU_PROYECTO.appspot.com',
  messagingSenderId: '000000000000',
  appId: '1:000000000000:web:xxxxxxxx',
  /** Correos que seran administradores al primer inicio de sesion */
  adminEmails: [
    'tu-correo@gmail.com'
  ]
};

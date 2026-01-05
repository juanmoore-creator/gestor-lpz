import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager
} from 'firebase/firestore';

const FALLBACK_PROJECT_ID = 'ttasaciones-5ce4d';
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID || FALLBACK_PROJECT_ID;

if (!import.meta.env.VITE_FIREBASE_PROJECT_ID) {
    console.warn(`Firebase: VITE_FIREBASE_PROJECT_ID missing, falling back to ${FALLBACK_PROJECT_ID}`);
} else if (import.meta.env.VITE_FIREBASE_PROJECT_ID.endsWith('_id')) {
    console.error("Firebase: CRITICAL ERROR! El ID del proyecto termina en '_id'. Esto es probablemente un error en las variables de entorno de Vercel (copiaste el nombre de un campo en lugar de su valor). Asegúrate de que el ID sea exactamente 'ttasaciones-5ce4d'.");
}

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

let db: any;
let auth: any;
const googleProvider = new GoogleAuthProvider();

try {
    const app = initializeApp(firebaseConfig);

    // Modern Persistence Initialization
    db = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        })
    });

    auth = getAuth(app);
    console.log(`Firebase Initialized for project: ${projectId} (Modern Persistence Enabled)`);
} catch (e) {
    console.error(`Firebase Initialization Failed for project ${projectId}:`, e);
}

export { db, auth, googleProvider };

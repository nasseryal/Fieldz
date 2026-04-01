// Initialisation Firebase — le "moteur" qui connecte l'app à la base de données
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// On récupère les clés depuis le fichier .env
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialise Firebase une seule fois
const app = initializeApp(firebaseConfig);

// Les 3 services qu'on utilise partout :
export const auth = getAuth(app);           // Connexion utilisateur
export const db = getFirestore(app);         // Base de données
export const storage = getStorage(app);      // Stockage photos

export default app;

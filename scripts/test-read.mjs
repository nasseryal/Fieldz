// Test rapide : est-ce que Firestore retourne des spots ?
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

import { firebaseConfig } from './firebase-config.mjs';
const app = initializeApp(firebaseConfig);

const db = getFirestore(app);

const q = query(collection(db, 'spots'), limit(5));
const snapshot = await getDocs(q);

console.log(`Nombre de spots récupérés: ${snapshot.size}`);
snapshot.docs.forEach(doc => {
  const d = doc.data();
  console.log(`- ${d.nom} (${d.sport}) — ${d.ville}`);
});

process.exit(0);

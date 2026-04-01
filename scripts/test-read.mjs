// Test rapide : est-ce que Firestore retourne des spots ?
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, limit } from 'firebase/firestore';

const app = initializeApp({
  apiKey: 'AIzaSyCAKkuuy-3uVKlyOf9B7lByUNbayNoMzFc',
  authDomain: 'fieldz-ac541.firebaseapp.com',
  projectId: 'fieldz-ac541',
  storageBucket: 'fieldz-ac541.firebasestorage.app',
  messagingSenderId: '87464748014',
  appId: '1:87464748014:web:b4fb5c7555d69876d964ff',
});

const db = getFirestore(app);

const q = query(collection(db, 'spots'), limit(5));
const snapshot = await getDocs(q);

console.log(`Nombre de spots récupérés: ${snapshot.size}`);
snapshot.docs.forEach(doc => {
  const d = doc.data();
  console.log(`- ${d.nom} (${d.sport}) — ${d.ville}`);
});

process.exit(0);

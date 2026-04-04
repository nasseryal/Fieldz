// Service des commentaires — gère les commentaires communautaires sur les spots
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  orderBy,
  increment,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Comment } from '../types';

// Récupère les commentaires d'un spot (du plus récent au plus ancien)
export const getComments = async (spotId: string): Promise<Comment[]> => {
  const q = query(
    collection(db, 'spots', spotId, 'comments'),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment));
};

// Ajoute un commentaire sur un spot
export const addComment = async (
  spotId: string,
  texte: string,
  auteurNom: string,
  auteurUid: string
): Promise<string> => {
  const docRef = await addDoc(collection(db, 'spots', spotId, 'comments'), {
    texte,
    auteurNom,
    auteurUid,
    createdAt: Timestamp.now(),
    signalements: 0,
  });
  return docRef.id;
};

// Supprime un commentaire
export const deleteComment = async (spotId: string, commentId: string) => {
  await deleteDoc(doc(db, 'spots', spotId, 'comments', commentId));
};

// Signale un commentaire
export const reportComment = async (spotId: string, commentId: string) => {
  await updateDoc(doc(db, 'spots', spotId, 'comments', commentId), {
    signalements: increment(1),
  });
};

// Service d'authentification — gère la connexion / déconnexion
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';

// Connexion avec email + mot de passe
export const signInWithEmail = async (email: string, password: string) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  return result.user;
};

// Inscription avec email + mot de passe
export const signUpWithEmail = async (
  email: string,
  password: string,
  displayName: string
) => {
  const result = await createUserWithEmailAndPassword(auth, email, password);
  // Met à jour le nom affiché
  await updateProfile(result.user, { displayName });
  // Crée le profil dans Firestore
  await createUserProfile(result.user);
  return result.user;
};

// Mot de passe oublié — Firebase envoie un email automatiquement
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// Envoie un email de vérification à l'utilisateur connecté
export const verifyEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};

// Déconnexion
export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Crée le profil utilisateur dans Firestore (appelé à la première connexion)
export const createUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);

  // Si le profil existe déjà, on ne le recrée pas
  if (userSnap.exists()) return;

  const profile: Omit<UserProfile, 'uid'> = {
    displayName: user.displayName,
    email: user.email,
    photoURL: user.photoURL,
    spotsAjoutes: 0,
    sportsExplores: [],
    favoris: [],
    createdAt: Timestamp.now(),
  };

  await setDoc(userRef, profile);
};

// Récupère le profil utilisateur
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return null;

  return { uid, ...userSnap.data() } as UserProfile;
};

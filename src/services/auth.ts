// Service d'authentification — gère la connexion / déconnexion
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  deleteUser as firebaseDeleteUser,
  updateProfile,
  OAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, deleteDoc, getDocs, query, where, collection, writeBatch, Timestamp } from 'firebase/firestore';
import { auth, db } from './firebase';
import { UserProfile } from '../types';
import * as AppleAuthentication from 'expo-apple-authentication';

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
  await updateProfile(result.user, { displayName });
  await createUserProfile(result.user);
  return result.user;
};

// Sign in with Apple
export const signInWithApple = async () => {
  // Demande les identifiants Apple à l'utilisateur
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  // Crée un credential Firebase avec le token Apple
  const oAuthProvider = new OAuthProvider('apple.com');
  const firebaseCredential = oAuthProvider.credential({
    idToken: credential.identityToken!,
  });

  // Connecte l'utilisateur dans Firebase
  const result = await signInWithCredential(auth, firebaseCredential);

  // Met à jour le nom si Apple l'a fourni (seulement à la première connexion)
  if (credential.fullName?.givenName) {
    const displayName = `${credential.fullName.givenName} ${credential.fullName.familyName ?? ''}`.trim();
    await updateProfile(result.user, { displayName });
  }

  // Crée le profil Firestore
  await createUserProfile(result.user);
  return result.user;
};

// Mot de passe oublié — Firebase envoie un email automatiquement
export const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};

// Envoie un email de vérification
export const verifyEmail = async () => {
  if (auth.currentUser) {
    await sendEmailVerification(auth.currentUser);
  }
};

// Déconnexion
export const signOut = async () => {
  await firebaseSignOut(auth);
};

// Crée le profil utilisateur dans Firestore
export const createUserProfile = async (user: User) => {
  const userRef = doc(db, 'users', user.uid);
  const userSnap = await getDoc(userRef);
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

// Supprime le compte utilisateur et TOUTES ses données (obligation Apple)
export const deleteAccount = async () => {
  const user = auth.currentUser;
  if (!user) return;

  // 1. Supprime tous les spots créés par l'utilisateur
  const spotsQuery = query(
    collection(db, 'spots'),
    where('ajoutePar', '==', user.uid)
  );
  const spotsSnap = await getDocs(spotsQuery);
  if (spotsSnap.size > 0) {
    const batch = writeBatch(db);
    spotsSnap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();
  }

  // 2. Supprime le profil Firestore
  const userRef = doc(db, 'users', user.uid);
  await deleteDoc(userRef);

  // 3. Supprime le compte Firebase Auth
  await firebaseDeleteUser(user);
};

// Récupère le profil utilisateur
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) return null;
  return { uid, ...userSnap.data() } as UserProfile;
};

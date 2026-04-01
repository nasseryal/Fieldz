// Hook d'authentification — surveille si l'utilisateur est connecté ou non
// C'est comme un vigile à l'entrée qui vérifie en permanence ton badge
import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../services/firebase';
import { getUserProfile, createUserProfile } from '../services/auth';
import { UserProfile } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Écoute les changements de connexion (connexion, déconnexion)
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // L'utilisateur est connecté → on récupère son profil
        await createUserProfile(firebaseUser); // Crée le profil si c'est la première fois
        const userProfile = await getUserProfile(firebaseUser.uid);
        setProfile(userProfile);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    // Nettoyage quand le composant disparaît
    return unsubscribe;
  }, []);

  return { user, profile, loading };
};

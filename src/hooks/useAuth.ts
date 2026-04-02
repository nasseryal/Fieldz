// Hook d'authentification — surveille si l'utilisateur est connecté ou non
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        setUser(firebaseUser);

        if (firebaseUser) {
          await createUserProfile(firebaseUser);
          const userProfile = await getUserProfile(firebaseUser.uid);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      } catch {
        // Si Firestore est inaccessible, on continue quand même
        // L'utilisateur est connecté mais le profil peut être null
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  return { user, profile, loading };
};

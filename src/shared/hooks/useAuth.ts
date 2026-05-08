import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

import { auth } from '../firebase';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    await signInAnonymously(auth);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  return { user, loading, signIn: handleSignIn, signOut: handleSignOut };
}

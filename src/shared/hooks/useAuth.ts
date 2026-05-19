import {
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';

import { auth } from '../firebase';

interface AuthState {
  user: FirebaseUser | null;
  loading: boolean;
  error: Error | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

export function useAuth(): AuthState {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  // Suppress auto sign-in after the user explicitly signs out.
  const explicitlySignedOut = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (!firebaseUser && !explicitlySignedOut.current) {
        signInAnonymously(auth).catch((err) => {
          setError(err instanceof Error ? err : new Error(String(err)));
          console.warn(
            '[Firebase] Anonymous sign-in failed. ' +
              'Enable Anonymous Auth in the Firebase console → Authentication → Sign-in method.',
          );
        });
      }
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    explicitlySignedOut.current = false;
    try {
      await signInAnonymously(auth);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    }
  };

  const handleSignOut = async () => {
    explicitlySignedOut.current = true;
    try {
      await signOut(auth);
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      setError(e);
      throw e;
    }
  };

  return { user, loading, error, signIn: handleSignIn, signOut: handleSignOut };
}

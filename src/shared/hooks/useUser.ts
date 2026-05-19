import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useEffect } from 'react';

import { db } from '../firebase';
import { User } from '../types/User';
import { useAuth } from './useAuth';
import { useFirestoreDoc } from './useFirestoreDoc';

// paymentStatus, credibilityScore, uid, and createdAt are server-write only.
type SafeUserUpdate = Omit<
  Partial<User>,
  'paymentStatus' | 'credibilityScore' | 'uid' | 'createdAt'
>;

interface UserState {
  user: User | null;
  loading: boolean;
  updateUser: (updates: SafeUserUpdate) => Promise<void>;
}

export function useUser(): UserState {
  const { user: firebaseUser } = useAuth();
  const { data: user, loading } = useFirestoreDoc<User>(
    'users',
    firebaseUser?.uid ?? null,
  );

  useEffect(() => {
    if (!firebaseUser || loading || user) return;
    const ref = doc(db, 'users', firebaseUser.uid);
    setDoc(
      ref,
      {
        uid: firebaseUser.uid,
        email: firebaseUser.email ?? '',
        displayName: firebaseUser.displayName ?? 'Anonymous',
        createdAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, [firebaseUser, user, loading]);

  const updateUser = async (updates: SafeUserUpdate): Promise<void> => {
    if (!firebaseUser) return;
    const ref = doc(db, 'users', firebaseUser.uid);
    await setDoc(ref, updates, { merge: true });
  };

  return { user, loading, updateUser };
}

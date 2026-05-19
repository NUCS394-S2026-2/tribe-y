import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import { db } from '../firebase';

interface FirestoreDocState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFirestoreDoc<T>(
  collectionPath: string,
  docId: string | null,
): FirestoreDocState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setData(null);
    setError(null);
    if (!docId) {
      setLoading(false);
      return;
    }
    setLoading(true);

    const ref = doc(db, collectionPath, docId);
    const unsubscribe = onSnapshot(
      ref,
      (snapshot) => {
        setData(snapshot.exists() ? (snapshot.data() as T) : null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );
    return unsubscribe;
  }, [collectionPath, docId]);

  return { data, loading, error };
}

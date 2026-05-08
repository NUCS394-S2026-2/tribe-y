import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously, User } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ?? 'AIzaSyA9N79rGKFxFRxNcpLZi1-y4woTXyB0Um4',
  authDomain: 'tribe-y.firebaseapp.com',
  projectId: 'tribe-y',
  storageBucket: 'tribe-y.firebasestorage.app',
  messagingSenderId: '115401645025',
  appId: '1:115401645025:web:90d42594070fa4fe3bd0a0',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Automatically sign in anonymously so every Firestore write has an auth context.
// If Anonymous Auth is not enabled in the console this will fail silently —
// the app still works, writes just get rejected by Firestore rules.
let currentUser: User | null = null;

onAuthStateChanged(auth, (user) => {
  currentUser = user;
  if (!user) {
    signInAnonymously(auth).catch(() => {
      console.warn(
        '[Firebase] Anonymous sign-in failed. ' +
          'Enable Anonymous Auth in the Firebase console → Authentication → Sign-in method.',
      );
    });
  }
});

/** Returns the current Firebase Auth UID, or a fallback for offline/unauthenticated sessions. */
export function getUid(): string {
  return currentUser?.uid ?? `anon-${Date.now()}`;
}

import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = import.meta.env;

const requiredEnv = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

for (const [key, value] of Object.entries(requiredEnv)) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(
      `Missing VITE_FIREBASE_${key.replace(/([A-Z])/g, '_$1').toUpperCase()}. ` +
        'Copy .env.example to .env.local and set your Firebase web config values.',
    );
  }
}

const app = initializeApp(requiredEnv);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Automatically sign in anonymously so every Firestore write has an auth context.
// If Anonymous Auth is not enabled in the console this fails — callers must check auth.currentUser.
onAuthStateChanged(auth, (user) => {
  if (!user) {
    signInAnonymously(auth).catch(() => {
      console.warn(
        '[Firebase] Anonymous sign-in failed. ' +
          'Enable Anonymous Auth in the Firebase console → Authentication → Sign-in method.',
      );
    });
  }
});

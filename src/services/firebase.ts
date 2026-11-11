import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { initializeFirestore, getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with force long-polling to prevent WebChannel streaming 10s timeouts in cloud/iframe environments
const firestoreSettings = {
  experimentalAutoDetectLongPolling: true,
  experimentalForceLongPolling: true,
};

export const db = (() => {
  try {
    return firebaseConfig.firestoreDatabaseId
      ? initializeFirestore(app, firestoreSettings, firebaseConfig.firestoreDatabaseId)
      : initializeFirestore(app, firestoreSettings);
  } catch {
    return firebaseConfig.firestoreDatabaseId
      ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
      : getFirestore(app);
  }
})();

// Initialize Auth
export const auth = getAuth(app);

// Initialize Messaging
import { getMessaging } from 'firebase/messaging';
export const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

// Authenticate anonymously so both users have valid security tokens without login friction
let authInitPromise: Promise<User | null> | null = null;

export const ensureAuthenticated = (): Promise<User | null> => {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  if (!authInitPromise) {
    authInitPromise = new Promise<User | null>((resolve) => {
      console.log('Starting Auth initialization...');
      // Safety timeout: resolve to null after 10 seconds if auth hangs
      const timeout = setTimeout(() => {
        console.error('Auth initialization TIMED OUT.');
        resolve(null);
      }, 10000);

      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          clearTimeout(timeout);
          if (user) {
            console.log('Auth state: User detected:', user.uid);
            unsubscribe();
            resolve(user);
          } else {
            console.log('Auth state: No user, attempting signInAnonymously...');
            signInAnonymously(auth)
              .then((credential) => {
                console.log('signInAnonymously SUCCESS:', credential.user.uid);
                unsubscribe();
                resolve(credential.user);
              })
              .catch((err) => {
                console.error('signInAnonymously FAILED:', err.code, err.message);
                unsubscribe();
                resolve(null);
              });
          }
        });
      } catch (err) {
        clearTimeout(timeout);
        console.error('Auth initialization CRITICAL ERROR:', err);
        resolve(null);
      }
    });
  }
  return authInitPromise;
};

// Test connection as required by Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (
      error instanceof Error &&
      (error.name === 'AbortError' ||
        error.message.includes('the client is offline') ||
        error.message.includes('signal is aborted') ||
        error.message.includes('aborted without reason'))
    ) {
      console.warn('Firebase client checking connection or aborted gracefully:', error.message);
    }
  }
}

// Initialise auth and connectivity test immediately
ensureAuthenticated().then(() => {
  testConnection();
}).catch(() => {
  // Silent catch for initial connectivity check
});

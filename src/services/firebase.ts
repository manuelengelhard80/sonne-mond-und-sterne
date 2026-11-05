import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with configured databaseId
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth
export const auth = getAuth(app);

// Authenticate anonymously so both users have valid security tokens without login friction
let authInitPromise: Promise<User | null> | null = null;

export const ensureAuthenticated = (): Promise<User | null> => {
  if (auth.currentUser) {
    return Promise.resolve(auth.currentUser);
  }
  if (!authInitPromise) {
    authInitPromise = new Promise<User | null>((resolve) => {
      try {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          } else {
            signInAnonymously(auth)
              .then((credential) => {
                unsubscribe();
                resolve(credential.user);
              })
              .catch((err) => {
                console.warn('Anonymous auth unavailable, running in local fallback mode:', err);
                resolve(null);
              });
          }
        });
      } catch (err) {
        console.warn('Auth initialization skipped:', err);
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
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or checking connection.');
    }
  }
}

// Initialise auth and connectivity test immediately
ensureAuthenticated().then(() => {
  testConnection();
}).catch(() => {
  // Silent catch for initial connectivity check
});

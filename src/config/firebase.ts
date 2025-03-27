import { initializeApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';

// Define the type for Firebase config with optional measurementId
type FirebaseConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
};

// Declare global window interface to add Firebase API key
declare global {
  interface Window {
    FIREBASE_API_KEY?: string;
  }
}

// Create a method to get Firebase config that doesn't directly expose values in code
const getFirebaseConfig = (): FirebaseConfig => {
  return {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 
            window.FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 
                'realms-of-war-f2eb5.firebaseapp.com',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 
               'realms-of-war-f2eb5',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 
                   'realms-of-war-f2eb5.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || 
                       '562743775258',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || 
           '1:562743775258:web:641dc1b274105f3ed781a3'
  };
};

// Initialize with proper types
let auth: Auth;
let db: Firestore;
let analytics: Promise<Analytics | null>;

try {
  const firebaseConfig = getFirebaseConfig();
  const app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  analytics = isSupported().then(yes => yes ? getAnalytics(app) : null);
} catch (error) {
  console.error("Firebase initialization error:", error);
  // Create fallback exports with proper types to prevent errors
  const app = initializeApp({
    apiKey: "dummy-key",
    authDomain: "dummy.firebaseapp.com",
    projectId: "dummy-project",
    storageBucket: "dummy.appspot.com",
    messagingSenderId: "000000000000",
    appId: "1:000000000000:web:0000000000000000000000"
  });
  auth = getAuth(app);
  db = getFirestore(app);
  analytics = Promise.resolve(null);
}

export { auth, db, analytics }; 
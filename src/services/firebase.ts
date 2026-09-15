import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import bundledConfig from '../../firebase-applet-config.json';

// Static configuration bundled directly with the application
const DEFAULT_FIREBASE_CONFIG = {
  projectId: bundledConfig?.projectId || "gen-lang-client-0073653212",
  appId: bundledConfig?.appId || "1:261526816314:web:3c4b6f4bcab95ec1cb5703",
  apiKey: bundledConfig?.apiKey || "AIzaSyAn147wHuqx-pRG4m2ZBwTs3dDET8CpyL0",
  authDomain: bundledConfig?.authDomain || "gen-lang-client-0073653212.firebaseapp.com",
  firestoreDatabaseId: bundledConfig?.firestoreDatabaseId || "ai-studio-f1ac63c2-70fd-4736-8f8e-f5ae88af793a",
  storageBucket: bundledConfig?.storageBucket || "gen-lang-client-0073653212.firebasestorage.app",
  messagingSenderId: bundledConfig?.messagingSenderId || "261526816314",
};

// Support Vite environment variables override if provided on Vercel
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || DEFAULT_FIREBASE_CONFIG.appId,
};

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || DEFAULT_FIREBASE_CONFIG.firestoreDatabaseId;

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Cloud Firestore with specified databaseId if present
export const db: Firestore = databaseId ? getFirestore(app, databaseId) : getFirestore(app);

export const isFirebaseConfigured = Boolean(firebaseConfig.projectId && firebaseConfig.apiKey);

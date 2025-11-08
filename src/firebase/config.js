import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Fallback configuration - Production values
const productionConfig = {
  apiKey: "AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8",
  authDomain: "dwts-11567.firebaseapp.com",
  projectId: "dwts-11567",
  storageBucket: "dwts-11567.firebasestorage.app",
  messagingSenderId: "514146765056",
  appId: "1:514146765056:web:ca13861ad9c2b1ac764be5",
  measurementId: "G-PFE3RG4LBJ"
};

// Use environment variables if available, otherwise use production config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || productionConfig.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || productionConfig.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || productionConfig.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || productionConfig.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || productionConfig.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || productionConfig.appId,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || productionConfig.measurementId,
};

// Log configuration source
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  console.log('🔧 Using built-in Firebase configuration');
} else {
  console.log('✅ Using environment variables for Firebase');
}

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error('❌ Firebase configuration is missing!');
  console.error('Required variables:');
  console.error('- VITE_FIREBASE_API_KEY');
  console.error('- VITE_FIREBASE_PROJECT_ID');
  console.error('- VITE_FIREBASE_AUTH_DOMAIN');
  throw new Error('Firebase configuration is incomplete');
}

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('✅ Firebase initialized successfully');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  throw error;
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics (optional, only in browser)
let analytics = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.warn('Analytics initialization failed:', error);
  }
}
export { analytics };

export default app;

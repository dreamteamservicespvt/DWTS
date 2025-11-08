/**
 * Seed Admin User Script
 * Creates default admin account if it doesn't exist
 * Run: node scripts/seedAdmin.js
 */

import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "dwts-11567.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "dwts-11567",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "dwts-11567.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "514146765056",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:514146765056:web:ca13861ad9c2b1ac764be5",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-PFE3RG4LBJ"
};

const ADMIN_EMAIL = 'chalamalasrinu2003@gmail.com';
const ADMIN_PASSWORD = 'chalamalasrinu2003@gmail.com';
const ADMIN_NAME = 'Srinu Admin';

async function seedAdmin() {
  console.log('🌱 Starting admin seed...');
  
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  try {
    // Try to sign in first to check if user exists
    let userCredential;
    try {
      userCredential = await signInWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
      console.log('✅ Admin user already exists');
    } catch (signInError) {
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/wrong-password') {
        // Create new admin user
        console.log('📝 Creating new admin user...');
        userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        
        // Update profile
        await updateProfile(userCredential.user, {
          displayName: ADMIN_NAME,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(ADMIN_NAME)}&background=0057FF&color=fff&size=200`
        });
        
        console.log('✅ Admin user created successfully');
      } else {
        throw signInError;
      }
    }

    const user = userCredential.user;

    // Check if user document exists
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // Create user document
      const userData = {
        uid: user.uid,
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        role: 'admin',
        photoURL: user.photoURL,
        joinDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        performanceScore: 100,
        assignedTasks: [],
        isSystemAdmin: true, // Cannot be deleted
        permissions: ['all'], // Full permissions
        status: 'active'
      };

      await setDoc(userDocRef, userData);
      console.log('✅ Admin user document created');
    } else {
      // Update to ensure admin role
      const existingData = userDoc.data();
      if (existingData.role !== 'admin') {
        await setDoc(userDocRef, {
          ...existingData,
          role: 'admin',
          isSystemAdmin: true,
          permissions: ['all'],
          updatedAt: new Date().toISOString()
        }, { merge: true });
        console.log('✅ Admin role updated');
      } else {
        console.log('✅ Admin document already exists with correct role');
      }
    }

    console.log('\n🎉 Admin seed completed successfully!');
    console.log('\n📧 Login credentials:');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    console.log(`   Password: ${ADMIN_PASSWORD}`);
    console.log(`\n🔗 Access: http://localhost:3002/admin\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
}

// Run seed
seedAdmin();

import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import toast from 'react-hot-toast';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Sign up new user
  const signup = async (email, password, name, role = 'member', photoURL = '') => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update profile with display name
      await updateProfile(user, { displayName: name, photoURL });

      // Create user document in Firestore
      const userDoc = {
        uid: user.uid,
        name,
        email,
        role,
        photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1890ff&color=fff`,
        joinDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', user.uid), userDoc);
      setUserProfile(userDoc);

      toast.success('Account created successfully!');
      return user;
    } catch (error) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back!');
      return userCredential.user;
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Failed to login';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  // Logout user
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
      throw error;
    }
  };

  // Fetch user profile from Firestore
  const fetchUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        const profile = userDoc.data();
        setUserProfile(profile);
        return profile;
      } else {
        // User document doesn't exist - this is a new user
        console.warn('User profile not found, creating default profile...');
        const defaultProfile = {
          uid: uid,
          email: auth.currentUser?.email || '',
          name: auth.currentUser?.displayName || 'User',
          role: 'member',
          photoURL: auth.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || 'User')}&background=1890ff&color=fff`,
          joinDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        // Try to create the profile
        try {
          await setDoc(doc(db, 'users', uid), defaultProfile);
          setUserProfile(defaultProfile);
          return defaultProfile;
        } catch (createError) {
          console.error('Failed to create user profile:', createError);
          // Set profile anyway to prevent infinite loading
          setUserProfile(defaultProfile);
          return defaultProfile;
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      
      // Check if it's a permissions error
      if (error.code === 'permission-denied') {
        toast.error('Database permissions error. Check Firestore rules.');
        console.error('🔥 FIRESTORE PERMISSION DENIED:');
        console.error('📋 Fix: Go to Firebase Console → Firestore → Rules');
        console.error('📋 Set: allow read, write: if request.auth != null;');
      }
      
      // Create a temporary profile to prevent app crash
      const tempProfile = {
        uid: uid,
        email: auth.currentUser?.email || '',
        name: auth.currentUser?.displayName || 'User',
        role: 'member',
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(auth.currentUser?.displayName || 'User')}&background=1890ff&color=fff`,
      };
      setUserProfile(tempProfile);
      return tempProfile;
    }
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;

    try {
      await setDoc(doc(db, 'users', currentUser.uid), updates, { merge: true });
      setUserProfile(prev => ({ ...prev, ...updates }));
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  };

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        await fetchUserProfile(user.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    signup,
    login,
    logout,
    updateUserProfile,
    isAdmin: userProfile?.role === 'admin',
    isMember: userProfile?.role === 'member',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;

# 🔥 Firebase Setup Guide - DWTS AI

## Current Error: Firestore 400 Bad Request

This error means your Firebase project needs proper configuration. Follow these steps:

---

## ✅ Step 1: Enable Firestore Database

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **dwts-11567**
3. Click **"Build"** in left sidebar
4. Click **"Firestore Database"**
5. Click **"Create Database"**
6. Choose **"Start in test mode"** (for development)
7. Select your region (e.g., us-central)
8. Click **"Enable"**

---

## ✅ Step 2: Enable Authentication

1. In Firebase Console, go to **"Authentication"**
2. Click **"Get Started"**
3. Click **"Sign-in method"** tab
4. Enable **"Email/Password"**
5. Save changes

---

## ✅ Step 3: Enable Storage

1. In Firebase Console, go to **"Storage"**
2. Click **"Get Started"**
3. Choose **"Start in test mode"**
4. Click **"Next"** → **"Done"**

---

## ✅ Step 4: Update Firestore Security Rules

Go to **Firestore Database** → **Rules** tab and paste:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // Admin-only collections
    match /audits/{auditId} {
      allow read: if request.auth.token.role == 'admin';
      allow create: if request.auth != null;
      allow update, delete: if false;
    }
    
    // Allow everything else for now (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **"Publish"**

---

## ✅ Step 5: Update Storage Security Rules

Go to **Storage** → **Rules** tab and paste:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      // Allow authenticated users to upload files
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.resource.size < 10 * 1024 * 1024 // Max 10MB
        && request.resource.contentType.matches('image/.*|video/.*|application/pdf');
    }
  }
}
```

Click **"Publish"**

---

## ✅ Step 6: Verify Environment Variables

Check your `.env` file in the project root:

```env
VITE_FIREBASE_API_KEY=AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
VITE_FIREBASE_AUTH_DOMAIN=dwts-11567.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dwts-11567
VITE_FIREBASE_STORAGE_BUCKET=dwts-11567.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=514146765056
VITE_FIREBASE_APP_ID=1:514146765056:web:ca13861ad9c2b1ac764be5
VITE_FIREBASE_MEASUREMENT_ID=G-PFE3RG4LBJ
```

**IMPORTANT**: After editing `.env`, you MUST restart the dev server:

```bash
# Press Ctrl+C to stop the server, then:
npm run dev
```

---

## ✅ Step 7: Create First Admin User

After Firebase is configured, create your first user:

1. Open the app at `http://localhost:3001/login`
2. Click **"Sign Up"** (or create Register page)
3. Create account with your email
4. Go to Firebase Console → **Firestore Database**
5. Find your user document in the **"users"** collection
6. Edit the document and change `role` from `"member"` to `"admin"`

---

## 🔍 Troubleshooting

### Error: "Firebase configuration is missing"
- Make sure `.env` file exists in project root (not in `src/`)
- Restart dev server after changing `.env`
- Check environment variables are prefixed with `VITE_`

### Error: "Permission denied"
- Make sure Firestore rules are set to **test mode** (allow read, write: if request.auth != null)
- Verify you're logged in (check browser DevTools → Application → Local Storage)

### Error: "Project not found"
- Verify `VITE_FIREBASE_PROJECT_ID` matches your Firebase Console project
- Check for typos in `.env` file

### App redirects to login immediately
- This is **CORRECT** behavior! You need to create an account first
- The authentication system is working properly

---

## ✅ Quick Test

After setup, open browser DevTools (F12) and check:

1. **Console tab**: Should show "✅ Firebase initialized successfully"
2. **Network tab**: No 400 errors
3. **Application tab** → Local Storage: Should have Firebase auth tokens after login

---

## 📞 Need Help?

If you still see errors after following all steps:

1. Share the exact error message from browser console
2. Verify Firebase Console shows Firestore, Auth, and Storage are enabled
3. Double-check your `.env` file exists and has correct values
4. Restart your dev server

---

**Current Status**: Your Firebase project ID is `dwts-11567` and credentials are in `.env`.

**Next Step**: Enable Firestore Database in Firebase Console (Step 1 above).

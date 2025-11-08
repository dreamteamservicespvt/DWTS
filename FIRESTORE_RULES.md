# 🔒 Firestore Security Rules - Development Mode

## Copy and paste these rules into Firebase Console

**Location**: https://console.firebase.google.com/project/dwts-11567/firestore/rules

---

## 📋 Development Rules (Allow All for Authenticated Users)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow all authenticated users to read/write everything (DEVELOPMENT ONLY)
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## 🚀 How to Apply:

1. Open: https://console.firebase.google.com/project/dwts-11567/firestore/rules
2. Delete all existing rules
3. Copy-paste the rules above
4. Click **"Publish"** button (top-right)
5. Wait 10 seconds
6. Refresh your app at http://localhost:3001

---

## ⚠️ Why This Works:

The error `Missing or insufficient permissions` means:
- ✅ Firestore is enabled
- ✅ Your app can connect
- ❌ Security rules are blocking reads/writes

By setting `allow read, write: if request.auth != null`, any authenticated user can access the database (perfect for development).

---

## 🔐 Production Rules (Apply Later)

Once you're ready to deploy, replace with proper role-based rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is admin
    function isAdmin() {
      return request.auth != null && 
             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId || isAdmin();
    }
    
    // Tasks collection
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && 
                      request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && 
                              (resource.data.userId == request.auth.uid || isAdmin());
    }
    
    // Sessions (user-specific)
    match /users/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // MFA data (highly sensitive)
    match /users/{userId}/mfa/{document=**} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Audit logs (admin-only read, anyone can create)
    match /audits/{auditId} {
      allow read: if isAdmin();
      allow create: if request.auth != null;
      allow update, delete: if false; // Immutable
    }
    
    // Exports (user can read their own, admins can read all)
    match /exports/{exportId} {
      allow read: if request.auth.uid == resource.data.userId || isAdmin();
      allow create: if request.auth != null;
      allow update: if false; // Read-only after creation
      allow delete: if isAdmin();
    }
    
    // Conflicts (user-specific)
    match /conflicts/{conflictId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## 🎯 Quick Fix Summary:

**Problem**: Firestore rules are blocking your app

**Solution**: Set rules to allow authenticated users (development mode)

**Action**: 
1. Go to: https://console.firebase.google.com/project/dwts-11567/firestore/rules
2. Replace with the simple rules at the top
3. Click "Publish"
4. Refresh app

**Result**: No more "Missing or insufficient permissions" error! ✅

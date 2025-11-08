# 🔧 Fix Vercel Environment Variables

## ❌ Problem
Your app is deployed but shows Firebase error because environment variables are missing.

## ✅ Solution

### **Method 1: Vercel Dashboard (Easiest - Recommended)**

1. **Go to**: https://vercel.com/dashboard
2. **Select your project**: DWTS
3. **Click**: Settings → Environment Variables
4. **Add these variables** (click "Add" for each):

```
Name: VITE_FIREBASE_API_KEY
Value: AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
Environment: Production, Preview, Development

Name: VITE_FIREBASE_AUTH_DOMAIN
Value: dwts-11567.firebaseapp.com
Environment: Production, Preview, Development

Name: VITE_FIREBASE_PROJECT_ID
Value: dwts-11567
Environment: Production, Preview, Development

Name: VITE_FIREBASE_STORAGE_BUCKET
Value: dwts-11567.firebasestorage.app
Environment: Production, Preview, Development

Name: VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 514146765056
Environment: Production, Preview, Development

Name: VITE_FIREBASE_APP_ID
Value: 1:514146765056:web:ca13861ad9c2b1ac764be5
Environment: Production, Preview, Development

Name: VITE_FIREBASE_MEASUREMENT_ID
Value: G-PFE3RG4LBJ
Environment: Production, Preview, Development

Name: VITE_CLOUDINARY_CLOUD_NAME
Value: do46xxegj
Environment: Production, Preview, Development

Name: VITE_CLOUDINARY_UPLOAD_PRESET
Value: dwtsystem
Environment: Production, Preview, Development
```

5. **After adding all**, go to **Deployments** tab
6. **Click** the three dots (•••) on latest deployment
7. **Click** "Redeploy"

---

### **Method 2: Using Script (Automated)**

Run this command in your terminal:

```bash
.\setup-vercel-env.bat
```

This will:
- Add all environment variables to Vercel
- Redeploy your app automatically

---

### **Method 3: Manual CLI (Advanced)**

Login first:
```bash
vercel login
```

Then link your project:
```bash
vercel link
```

Add each variable:
```bash
vercel env add VITE_FIREBASE_API_KEY
# Paste: AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
# Select: Production
```

Repeat for all 9 variables, then redeploy:
```bash
vercel --prod
```

---

## 🎯 Quick Steps (If you prefer dashboard)

1. Open: https://vercel.com/dreamteamservicespvt
2. Click your DWTS project
3. Settings → Environment Variables
4. Copy-paste from the list above
5. Redeploy

---

## ✅ After Setup

Your app will work with:
- ✅ Firebase Authentication
- ✅ Firestore Database
- ✅ Cloudinary Uploads
- ✅ All features functional

---

## 🔍 Verify It Works

After redeployment:
1. Visit your Vercel URL
2. Open browser console (F12)
3. Should see: "✅ Firebase initialized successfully"
4. No more errors!

---

**Time to fix**: 5 minutes  
**Recommended method**: Dashboard (Method 1)


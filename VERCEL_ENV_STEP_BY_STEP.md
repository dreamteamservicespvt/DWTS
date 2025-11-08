# 🎯 VERCEL ENV SETUP - STEP BY STEP

## 📍 You Are Here
Your app is deployed but shows Firebase errors because Vercel doesn't have the environment variables.

---

## ✅ FIX IN 5 STEPS (2 minutes)

### **Step 1: Open Vercel Dashboard**
```
https://vercel.com/dashboard
```
- Login if not already logged in
- You'll see your projects list

### **Step 2: Select Your Project**
- Click on **DWTS** (or whatever you named it)
- You'll see the project overview

### **Step 3: Go to Environment Variables**
- Click **Settings** (top navigation)
- Click **Environment Variables** (left sidebar)

### **Step 4: Add Each Variable**

Click **"Add New"** button and add these **9 variables**:

#### Variable 1:
```
Name:  VITE_FIREBASE_API_KEY
Value: AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2:
```
Name:  VITE_FIREBASE_AUTH_DOMAIN
Value: dwts-11567.firebaseapp.com
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 3:
```
Name:  VITE_FIREBASE_PROJECT_ID
Value: dwts-11567
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 4:
```
Name:  VITE_FIREBASE_STORAGE_BUCKET
Value: dwts-11567.firebasestorage.app
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 5:
```
Name:  VITE_FIREBASE_MESSAGING_SENDER_ID
Value: 514146765056
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 6:
```
Name:  VITE_FIREBASE_APP_ID
Value: 1:514146765056:web:ca13861ad9c2b1ac764be5
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 7:
```
Name:  VITE_FIREBASE_MEASUREMENT_ID
Value: G-PFE3RG4LBJ
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 8:
```
Name:  VITE_CLOUDINARY_CLOUD_NAME
Value: do46xxegj
Environment: ✅ Production ✅ Preview ✅ Development
```

#### Variable 9:
```
Name:  VITE_CLOUDINARY_UPLOAD_PRESET
Value: dwtsystem
Environment: ✅ Production ✅ Preview ✅ Development
```

### **Step 5: Redeploy**
- Go to **Deployments** tab (top navigation)
- Find your latest deployment
- Click **•••** (three dots menu)
- Click **"Redeploy"**
- Wait 1-2 minutes

---

## 🎉 DONE!

After redeployment, your app will work perfectly!

Visit your Vercel URL and check - no more Firebase errors! ✅

---

## 📝 Quick Copy-Paste Format

If Vercel allows bulk import, use this:

```env
VITE_FIREBASE_API_KEY=AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
VITE_FIREBASE_AUTH_DOMAIN=dwts-11567.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dwts-11567
VITE_FIREBASE_STORAGE_BUCKET=dwts-11567.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=514146765056
VITE_FIREBASE_APP_ID=1:514146765056:web:ca13861ad9c2b1ac764be5
VITE_FIREBASE_MEASUREMENT_ID=G-PFE3RG4LBJ
VITE_CLOUDINARY_CLOUD_NAME=do46xxegj
VITE_CLOUDINARY_UPLOAD_PRESET=dwtsystem
```

---

## ❓ Need Help?

- **Can't find Settings?** Look for a gear icon ⚙️ at the top
- **Don't see Environment Variables?** Make sure you're in the project, not the team overview
- **Variables not saving?** Make sure to check all 3 environments (Production, Preview, Development)

---

**⏱️ Total Time**: 2-3 minutes  
**Difficulty**: Easy ⭐  
**Success Rate**: 100% ✅


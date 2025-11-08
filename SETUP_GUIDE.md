# 🚀 DWTS Setup Guide

## Quick Start (5 Minutes)

### 1. Install Dependencies

```bash
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication:
   - Go to Authentication → Sign-in method
   - Enable "Email/Password"
4. Create Firestore Database:
   - Go to Firestore Database
   - Click "Create database"
   - Start in **production mode** (or test mode for development)
5. Get your configuration:
   - Go to Project Settings → General
   - Scroll to "Your apps" section
   - Click "Add app" → Web (</>) icon
   - Copy the configuration values

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
copy .env.example .env
```

Then edit `.env` with your Firebase credentials:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Cloudinary (for file uploads)
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_UPLOAD_PRESET=your_preset
```

### 4. Firestore Security Rules

In Firebase Console → Firestore Database → Rules, paste:

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
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }
    
    // Analytics collection
    match /analytics/{docId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

Click **Publish**.

### 5. Create Admin User

Run the development server first:

```bash
npm run dev
```

Then:
1. Open http://localhost:3000
2. Click "Sign Up"
3. Create an account with your email
4. Go to Firebase Console → Firestore Database
5. Find your user document in the `users` collection
6. Edit the document and change `role` from `"member"` to `"admin"`
7. Refresh your app - you now have admin access!

### 6. Cloudinary Setup (Optional - for file uploads)

1. Go to [Cloudinary](https://cloudinary.com/) and sign up
2. Go to Dashboard
3. Copy your **Cloud Name**
4. Go to Settings → Upload → Upload presets
5. Create an upload preset (set to "unsigned")
6. Add these to your `.env` file

**Note:** If you skip Cloudinary setup, the app will use placeholder images for proof uploads.

---

## 🎯 Features Checklist

✅ Firebase Authentication (Email/Password)
✅ Role-based access (Admin & Member)
✅ Real-time dashboard with stats
✅ Task management with CRUD operations
✅ Work score calculation algorithm
✅ AI-powered insights & summaries
✅ Analytics with beautiful charts
✅ Admin panel with team overview
✅ Dark/Light mode toggle
✅ Fully responsive design
✅ Export to CSV functionality
✅ Cloudinary image uploads
✅ Performance tracking
✅ Motivational messages

---

## 📁 Project Structure

```
dwts/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── TaskCard.jsx
│   │   ├── ProgressRing.jsx
│   │   └── Loading.jsx
│   ├── context/         # React Context
│   │   └── AuthContext.jsx
│   ├── firebase/        # Firebase config
│   │   └── config.js
│   ├── pages/           # Application pages
│   │   ├── Login.jsx
│   │   ├── Dashboard.jsx
│   │   ├── Tasks.jsx
│   │   ├── TaskForm.jsx
│   │   ├── Analytics.jsx
│   │   ├── AdminPanel.jsx
│   │   └── Settings.jsx
│   ├── utils/           # Utility functions
│   │   ├── calculateScore.js
│   │   └── aiSummary.js
│   ├── App.jsx          # Main app component
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/
├── .env                 # Environment variables (create this)
├── .env.example         # Environment template
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 🎨 Customization

### Change Theme Colors

Edit `tailwind.config.js`:

```javascript
colors: {
  primary: {
    500: '#1890ff', // Change this
  },
  aqua: {
    500: '#13c2c2', // Change this
  },
}
```

### Modify Work Score Algorithm

Edit `src/utils/calculateScore.js`:

```javascript
const TASK_WEIGHTS = {
  Creative: 1.3,    // Adjust weights
  Technical: 1.2,
  // ...
};
```

### Add More Task Types

Edit `src/pages/TaskForm.jsx`:

```javascript
const TASK_TYPES = ['Creative', 'Technical', 'YourNewType'];
```

---

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables in Vercel dashboard
5. Deploy!

Your app will be live at `https://your-project.vercel.app`

---

## 🐛 Troubleshooting

**Issue: Firebase connection error**
- Check if `.env` file exists and has correct values
- Verify Firebase project is in production mode
- Check browser console for specific errors

**Issue: "Permission denied" in Firestore**
- Verify security rules are published
- Check if user is authenticated
- Ensure user UID matches document owner

**Issue: Dark mode not working**
- Clear browser cache
- Check localStorage for `darkMode` key
- Verify Tailwind dark mode is set to 'class'

**Issue: Cloudinary uploads failing**
- Verify cloud name and upload preset
- Check if preset is set to "unsigned"
- App will work without Cloudinary (uses placeholders)

---

## 📚 Tech Stack Details

- **React 18** - UI library
- **Vite** - Build tool (faster than CRA)
- **TailwindCSS** - Utility-first CSS
- **Framer Motion** - Animations
- **Firebase Auth** - Authentication
- **Firestore** - NoSQL database
- **Recharts** - Chart library
- **Lucide React** - Icon library
- **React Router** - Routing
- **React Hot Toast** - Notifications
- **date-fns** - Date utilities

---

## 🎓 Learning Resources

- [React Docs](https://react.dev)
- [Firebase Docs](https://firebase.google.com/docs)
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Framer Motion](https://www.framer.com/motion/)

---

## 💡 Next Steps

1. Add email notifications (using Firebase Cloud Functions)
2. Integrate real AI API (OpenAI/Claude) for better insights
3. Add real-time updates using Firestore listeners
4. Implement data export to PDF
5. Add team chat functionality
6. Create mobile app version (React Native)

---

## 📝 Support

For issues or questions:
1. Check this documentation
2. Review Firebase console for errors
3. Check browser console for client-side errors
4. Verify all environment variables are set

---

**Built with ❤️ using Claude Sonnet 4.5 AI assistance**

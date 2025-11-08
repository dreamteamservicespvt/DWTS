# 🚀 DWTS V2.0 - Production Deployment Checklist

## ✅ Pre-Deployment Checklist

### 1. Environment Setup
- [ ] `.env` file created with all Firebase credentials
- [ ] `.env` file added to `.gitignore`
- [ ] Cloudinary credentials verified (Cloud Name: `do46xxegj`, Preset: `dwtsystem`)
- [ ] Firebase project created and configured
- [ ] Firebase Authentication enabled (Email/Password)
- [ ] Firestore database created
- [ ] Firebase Storage bucket created

### 2. Firebase Configuration
```bash
# Install Firebase CLI globally
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize Firebase (if not done)
firebase init

# Deploy Firestore security rules
firebase deploy --only firestore:rules

# Deploy Firestore indexes
firebase deploy --only firestore:indexes
```

### 3. Dependencies Check
```bash
# Install all dependencies
npm install

# Check for vulnerabilities
npm audit

# Fix non-breaking vulnerabilities
npm audit fix
```

### 4. Build Test
```bash
# Test production build
npm run build

# Check build output
ls -la dist/

# Test build locally
npm run preview
```

---

## 🔧 Deployment Steps

### Option A: Deploy to Vercel (Recommended)

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy
```bash
# First deployment (test)
vercel

# Production deployment
vercel --prod
```

#### Step 4: Set Environment Variables in Vercel Dashboard
Go to: https://vercel.com/your-project/settings/environment-variables

Add:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

#### Step 5: Redeploy after env vars
```bash
vercel --prod
```

---

### Option B: Deploy to Firebase Hosting

#### Step 1: Initialize Hosting
```bash
firebase init hosting
```

Settings:
- Public directory: `dist`
- Single-page app: `yes`
- Automatic builds with GitHub: `optional`

#### Step 2: Build
```bash
npm run build
```

#### Step 3: Deploy
```bash
firebase deploy --only hosting
```

---

## 🔑 Post-Deployment Configuration

### 1. Seed Admin User
**IMPORTANT:** Run this ONCE after deployment

```bash
# Navigate to scripts directory
cd scripts

# Run seed script
node seedAdmin.js
```

**Credentials Created:**
- Email: `chalamalasrinu2003@gmail.com`
- Password: `chalamalasrinu2003@gmail.com`
- Role: `admin`
- System Admin: `true`

**⚠️ CHANGE PASSWORD IMMEDIATELY AFTER FIRST LOGIN**

### 2. Create First Client
1. Login as admin
2. Navigate to "Clients" page
3. Click "Add Client"
4. Fill in details:
   - Name: e.g., "Sreerasthu Silvers"
   - Industry: e.g., "Jewelry"
   - Contact: Email, phone
   - Upload logo via Cloudinary
5. Save client

### 3. Create First Project
1. Navigate to "Projects" page
2. Click "Add Project"
3. Select client from dropdown
4. Fill details:
   - Month: November 2025
   - Week: 1
   - Title: "Week 1 - Social Media Content"
   - Deliverables: 3 Reels, 1 Story, 1 AI Ad, 2 Posters
5. Save project

### 4. Create First Task
1. Navigate to "Tasks" page
2. Click "Add Task"
3. Fill details:
   - Client: Select created client
   - Project: Select created project
   - Assign to: Select team member
   - Task Type: e.g., "Shooting"
   - Date & Time: Select slot
   - Impact: Set priority
   - Description: Add details
5. Save task

### 5. Invite Team Members
1. Firebase Console → Authentication
2. Add users manually:
   - Click "Add user"
   - Enter email and temporary password
   - Send credentials to team member

3. After user signs up, set role in Firestore:
   - Navigate to Firestore Console
   - Collection: `users`
   - Document: User's UID
   - Add/Update field: `role: "member"`

---

## 🧪 Testing Checklist

### Authentication
- [ ] Admin can login
- [ ] Member can login
- [ ] Logout works
- [ ] Password reset works (if enabled)
- [ ] Session persists on refresh

### Client Management
- [ ] Create client
- [ ] Upload logo (Cloudinary)
- [ ] Edit client
- [ ] View client detail
- [ ] Delete client (admin only)
- [ ] Search clients
- [ ] Filter clients

### Project Management
- [ ] Create project linked to client
- [ ] Edit project
- [ ] View project list
- [ ] Filter by client
- [ ] Delete project (admin only)

### Task Management
- [ ] Create task
- [ ] Assign to member
- [ ] Member sees assigned task
- [ ] Update task status
- [ ] Upload deliverable (Cloudinary)
- [ ] Submit for review
- [ ] Admin approves task
- [ ] Admin requests rework
- [ ] Activity logged

### File Uploads
- [ ] Drag-and-drop works
- [ ] Upload progress displays
- [ ] Image preview shows
- [ ] File validation works
- [ ] Multiple files upload
- [ ] Cloudinary URL returned

### Calendar
- [ ] Month/Week/Day views work
- [ ] Tasks display correctly
- [ ] Color coding by client
- [ ] Hover tooltip shows details
- [ ] Click opens task detail
- [ ] Admin can drag-drop (reschedule)
- [ ] Activity logged on reschedule

### Notifications
- [ ] Notification bell shows in navbar
- [ ] Unread badge updates
- [ ] Task assignment creates notification
- [ ] Click notification navigates correctly
- [ ] Mark as read works
- [ ] Mark all as read works

### Offline Mode
- [ ] App works offline
- [ ] Actions queued in IndexedDB
- [ ] Auto-sync when online
- [ ] Conflict detection works
- [ ] Resolution modal appears
- [ ] Resolution strategies work

### Analytics
- [ ] Task scoring calculates
- [ ] User performance displays
- [ ] Team leaderboard works
- [ ] Client stats accurate
- [ ] Trends chart updates

### Dark Mode
- [ ] Toggle switches theme
- [ ] Preference saved
- [ ] All pages support dark mode
- [ ] Colors contrast properly

### Mobile Responsive
- [ ] Layout adapts on mobile (320px+)
- [ ] Navigation works on mobile
- [ ] Forms usable on mobile
- [ ] Calendar navigable on mobile
- [ ] File upload works on mobile
- [ ] Modals display correctly

---

## 🔒 Security Verification

### Firestore Rules
- [ ] Unauthenticated users cannot read data
- [ ] Members can only see assigned tasks
- [ ] Members cannot modify others' tasks
- [ ] Only admins can create clients/projects
- [ ] System admin cannot be deleted
- [ ] Activity log is append-only
- [ ] Notifications are user-scoped

### Test Security
```bash
# Open Firestore emulator (optional)
firebase emulators:start --only firestore

# Test rules
firebase emulators:exec "npm test"
```

### Cloudinary Security
- [ ] Upload preset configured correctly
- [ ] Unsigned upload enabled for preset `dwtsystem`
- [ ] Folder structure enforced (`dwts/clients`, `dwts/tasks`)
- [ ] File size limits enforced (10MB)
- [ ] File types restricted

---

## 📊 Performance Optimization

### Enable Compression
Vercel/Firebase automatically compresses assets. Verify:
- [ ] Gzip enabled
- [ ] Brotli enabled (Vercel)

### Image Optimization
Cloudinary automatically optimizes. Verify:
- [ ] Images served from Cloudinary CDN
- [ ] Transformations applied (width, quality)
- [ ] Responsive images loaded

### Lazy Loading
- [ ] Routes code-split
- [ ] Heavy components lazy loaded
- [ ] Images lazy loaded

### Caching
- [ ] Static assets cached
- [ ] API responses cached (if applicable)
- [ ] Service worker registered (optional PWA)

---

## 📱 PWA Setup (Optional)

### 1. Update manifest.json
```json
{
  "name": "DWTS - ManaCLG",
  "short_name": "DWTS",
  "description": "Daily Work Tracking System for Creative Agency",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#0057FF",
  "background_color": "#F8FAFC",
  "icons": [...]
}
```

### 2. Add Service Worker
```bash
# Install workbox
npm install workbox-webpack-plugin -D
```

### 3. Configure Vite for PWA
```bash
# Install PWA plugin
npm install vite-plugin-pwa -D
```

---

## 🔔 Scheduled Jobs Setup (Optional)

### Cloud Functions for Notifications
Create `functions/index.js`:

```javascript
const functions = require('firebase-functions');
const { checkDueSoonTasks, checkOverdueTasks } = require('../src/lib/notificationService');

// Run every hour
exports.checkDueSoon = functions.pubsub.schedule('every 1 hours').onRun(async (context) => {
  await checkDueSoonTasks();
});

// Run every day at 9 AM
exports.checkOverdue = functions.pubsub.schedule('every day 09:00').onRun(async (context) => {
  await checkOverdueTasks();
});
```

Deploy:
```bash
firebase deploy --only functions
```

---

## 📧 Email Notifications Setup (Optional)

### Using SendGrid

1. Install dependencies:
```bash
npm install @sendgrid/mail
```

2. Add to environment:
```env
SENDGRID_API_KEY=your_api_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

3. Create email service:
```javascript
// src/lib/emailService.js
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export async function sendTaskAssignmentEmail(user, task) {
  const msg = {
    to: user.email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'New Task Assigned',
    html: `<p>You have been assigned: <strong>${task.title}</strong></p>`
  };
  
  await sgMail.send(msg);
}
```

---

## 🌐 Custom Domain Setup

### Vercel
1. Go to: https://vercel.com/your-project/settings/domains
2. Add custom domain: e.g., `dwts.manaclg.com`
3. Update DNS records (provided by Vercel)
4. Wait for SSL certificate (automatic)

### Firebase
1. Run: `firebase hosting:sites:create dwts-manaclg`
2. Add domain in Firebase Console → Hosting → Add custom domain
3. Update DNS records (provided by Firebase)
4. Wait for SSL provisioning (automatic)

---

## 📈 Monitoring & Analytics

### Firebase Analytics
Already configured! Check dashboard:
- https://console.firebase.google.com/project/YOUR_PROJECT/analytics

### Vercel Analytics
Enable in Vercel dashboard:
- https://vercel.com/your-project/analytics

### Custom Event Tracking
Add to critical actions:
```javascript
import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase/config';

// Track task completion
logEvent(analytics, 'task_completed', {
  task_id: taskId,
  client_id: clientId,
  user_id: userId
});
```

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Firebase Permission Errors
- Check Firestore rules are deployed
- Verify user role in Firestore console
- Check indexes are created

### Cloudinary Upload Fails
- Verify cloud name and upload preset
- Check browser console for CORS errors
- Ensure unsigned upload enabled in Cloudinary settings

### Offline Sync Issues
- Check IndexedDB in DevTools → Application → IndexedDB
- Clear IndexedDB and retry
- Check network tab for failed requests

### Calendar Not Rendering
- Verify `moment` is installed
- Check console for CSS import errors
- Ensure Firestore data has correct timestamp format

---

## 📞 Support Contacts

- **Firebase Issues:** https://firebase.google.com/support
- **Vercel Issues:** https://vercel.com/support
- **Cloudinary Issues:** https://support.cloudinary.com
- **Project Owner:** chalamalasrinu2003@gmail.com

---

## 🎉 Launch Checklist

### Pre-Launch
- [ ] All tests pass
- [ ] Security rules deployed
- [ ] Environment variables set
- [ ] Admin user created
- [ ] First client/project/task created
- [ ] Team members invited
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Monitoring enabled

### Launch Day
- [ ] Deploy to production
- [ ] Send access credentials to team
- [ ] Conduct team training session
- [ ] Monitor error logs
- [ ] Test critical user flows
- [ ] Announce to stakeholders

### Post-Launch (Week 1)
- [ ] Daily monitoring of errors
- [ ] User feedback collection
- [ ] Performance monitoring
- [ ] Backup Firestore data
- [ ] Address critical bugs
- [ ] Plan next features

---

## 📚 Additional Resources

- **Firebase Documentation:** https://firebase.google.com/docs
- **Vercel Documentation:** https://vercel.com/docs
- **React Documentation:** https://react.dev
- **Tailwind CSS:** https://tailwindcss.com/docs
- **Framer Motion:** https://www.framer.com/motion
- **React Big Calendar:** https://jquense.github.io/react-big-calendar

---

**Ready to Deploy? Let's GO! 🚀**

*Last Updated: November 6, 2025*

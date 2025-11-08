# 🔍 Troubleshooting Guide - DWTS 2.0

## Common Issues & Solutions

### 1. ✅ FIXED - "Unsupported field value: undefined" Error

**Symptom**: Error when creating clients or projects  
**Error Message**: `Function addDoc() called with invalid data. Unsupported field value: undefined (found in field createdBy)`

**Solution**: ✅ Already fixed!
- Updated `ClientForm.jsx` to use `currentUser` instead of `user`
- Updated `ProjectForm.jsx` to use `currentUser` instead of `user`

---

### 2. Firebase Connection Issues

**Symptom**: Data not saving or loading

**Check**:
```bash
# Verify .env file exists and has correct values
VITE_FIREBASE_API_KEY=AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8
VITE_FIREBASE_PROJECT_ID=dwts-11567
```

**Solution**:
1. Restart dev server: `npm run dev`
2. Check Firebase Console → Firestore → Rules
3. Ensure rules allow authenticated users

---

### 3. Images Not Uploading

**Symptom**: Logo upload fails

**Check**:
```bash
# Verify Cloudinary config in .env
VITE_CLOUDINARY_CLOUD_NAME=do46xxegj
VITE_CLOUDINARY_UPLOAD_PRESET=dwtsystem
```

**Solution**:
1. Check Cloudinary dashboard for API status
2. Verify upload preset exists
3. Check browser console for CORS errors

---

### 4. Module Not Found Errors

**Symptom**: `Cannot find module 'X'`

**Solution**:
```bash
# Reinstall dependencies
npm install

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

### 5. Port Already in Use

**Symptom**: `Port 3000 is in use`

**Solution**:
- Vite will automatically try next available port (3001, 3002, etc.)
- Or manually kill the process using the port
- Check terminal output for actual port number

---

### 6. Dark Mode Not Working

**Symptom**: Dark mode toggle doesn't work

**Check**:
- Look for `dark` class on `<html>` element
- Check browser DevTools → Elements

**Solution**:
1. Verify `tailwind.config.js` has `darkMode: 'class'`
2. Check if theme toggle button exists in Navbar
3. Ensure localStorage persists theme preference

---

### 7. Login Issues

**Symptom**: Can't login with admin credentials

**Check**:
```
Email: chalamalasrinu2003@gmail.com
Password: chalamalasrinu2003@gmail.com
```

**Solution**:
1. Check Firebase Console → Authentication → Users
2. Verify user exists with admin role
3. Check browser console for authentication errors
4. Try password reset if needed

---

### 8. Components Not Showing

**Symptom**: Blank page or missing components

**Check**:
1. Browser console for errors
2. Network tab for failed requests
3. React DevTools for component tree

**Solution**:
```bash
# Check if dev server is running
npm run dev

# Rebuild if needed
npm run build
npm run preview
```

---

### 9. Styling Issues

**Symptom**: Components look broken or unstyled

**Check**:
1. Verify Tailwind classes are working
2. Check if `index.css` imports are present
3. Look for CSS conflicts

**Solution**:
```bash
# Rebuild Tailwind
npm run build

# Clear browser cache
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

---

### 10. Real-time Updates Not Working

**Symptom**: Changes don't appear immediately

**Check**:
1. Firestore listeners are set up correctly
2. Network connection is stable
3. Firestore rules allow reads

**Solution**:
1. Check browser Network tab for WebSocket connections
2. Verify Firestore onSnapshot listeners in code
3. Check Firebase Console → Firestore → Usage

---

## Quick Fixes

### Clear All Caches
```bash
# Stop dev server
Ctrl + C

# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart
npm run dev
```

### Reset Browser State
1. Open DevTools (F12)
2. Application → Storage → Clear site data
3. Hard refresh (Ctrl + Shift + R)

### Check Firestore Rules
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

---

## Debugging Steps

### 1. Check Console
```javascript
// Open browser DevTools
F12 or Ctrl + Shift + I

// Look for red errors
// Click on error for stack trace
```

### 2. Check Network
```javascript
// DevTools → Network tab
// Look for failed requests (red)
// Check response status codes
```

### 3. Check Firestore
```javascript
// Firebase Console → Firestore
// Verify collections exist
// Check document structure
```

### 4. Check Auth
```javascript
// Firebase Console → Authentication
// Verify users exist
// Check sign-in methods enabled
```

---

## Performance Issues

### Slow Loading
**Solution**:
1. Check image sizes (use Cloudinary optimization)
2. Verify Firestore queries are indexed
3. Use pagination for large datasets

### Memory Leaks
**Solution**:
1. Ensure Firestore listeners are cleaned up
2. Check for unsubscribed useEffect hooks
3. Use React DevTools Profiler

---

## Still Having Issues?

### Check These Files
1. **`src/firebase/config.js`** - Firebase setup
2. **`src/context/AuthContext.jsx`** - Authentication
3. **`src/App.jsx`** - Routing
4. **`.env`** - Environment variables

### Common Fixes
```bash
# Restart everything
npm run dev

# Check all environment variables are set
cat .env  # Mac/Linux
type .env # Windows

# Verify Firebase project is active
# Check Firebase Console
```

---

## Error Messages Decoded

| Error | Meaning | Solution |
|-------|---------|----------|
| `Unsupported field value: undefined` | Trying to save undefined to Firestore | Check all fields have values |
| `Missing or insufficient permissions` | Firestore rules blocking | Update security rules |
| `Network request failed` | Connection issue | Check internet, Firebase status |
| `Module not found` | Missing dependency | Run `npm install` |
| `Port in use` | Dev server port taken | Kill process or use different port |

---

## Prevention Tips

1. **Always check console** for errors before asking for help
2. **Test in incognito** to rule out cache issues
3. **Keep dependencies updated** but test first
4. **Follow component patterns** from existing code
5. **Use TypeScript** for better error catching (future)

---

## Getting Help

1. Check this troubleshooting guide first
2. Look at documentation files (LAUNCH_GUIDE.md, etc.)
3. Check component examples in `src/components/PremiumUI.jsx`
4. Review similar working components

---

**Most issues are solved by restarting the dev server and clearing cache!** 🎯

---

**Last Updated**: After fixing the `createdBy: undefined` bug  
**Status**: All known issues resolved ✅

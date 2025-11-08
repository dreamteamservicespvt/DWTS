# 🔐 Creating Demo Admin User

## Problem:
The demo credentials shown on the login page don't exist yet in your Firebase database.

---

## Solution: Create Admin User Manually

### Method 1: Create Via Sign Up (Recommended)

1. **Go to Login Page**: http://localhost:3001/login
2. **Click "Sign Up" Tab**
3. **Fill in details**:
   - Full Name: `Admin User`
   - Email: `admin@dwts.com`
   - Password: `admin123`
   - Confirm Password: `admin123`
4. **Click "Create Account"**
5. **You'll be logged in automatically**

### Method 2: Set User as Admin in Firebase Console

After creating the account above:

1. **Open Firebase Console**: https://console.firebase.google.com/project/dwts-11567/firestore
2. **Go to Firestore Database**
3. **Click on "users" collection**
4. **Find your newly created user document**
5. **Click on the document**
6. **Find the "role" field** (currently says "member")
7. **Click the "member" value to edit**
8. **Change it to**: `admin`
9. **Click "Update"**
10. **Refresh your app** - You're now an admin!

---

## ✅ Quick Test:

After creating the admin user:

1. **Logout** (if logged in)
2. **Go back to login page**
3. **Try demo credentials**:
   - Email: `admin@dwts.com`
   - Password: `admin123`
4. **Should login successfully** ✅

---

## 🎯 Alternative: Use Your Own Email

Instead of using demo credentials, you can:

1. **Sign up with your real email**
2. **Use a strong password** (min 6 characters)
3. **Set yourself as admin in Firebase Console** (follow Method 2 above)
4. **Use your own credentials**

---

## 📝 Creating Member Demo User (Optional)

If you also want to create the demo member user:

1. **Logout from admin account**
2. **Go to Sign Up**
3. **Fill in**:
   - Name: `Member User`
   - Email: `member@dwts.com`
   - Password: `member123`
4. **Create account**
5. **This user will have "member" role by default** ✅

---

## 🔒 Password Requirements:

Current requirements (can be enhanced with Zod validation):
- Minimum 6 characters
- Can include letters, numbers, symbols

**Recommended for production**:
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 number
- At least 1 special character

---

## 🐛 Troubleshooting:

### Error: "Email already in use"
**Solution**: The user already exists. Try logging in instead.

### Error: "Password is too weak"
**Solution**: Use at least 6 characters for Firebase Auth.

### Error: "Invalid email"
**Solution**: Check email format (must have @ and domain).

### User created but can't login
**Solution**: 
1. Check Firebase Console → Authentication → Users
2. Verify the user exists there
3. Check if email is correct
4. Try password reset if needed

### Logged in but shows as "Member" instead of "Admin"
**Solution**: Update the `role` field in Firestore to `admin` (see Method 2 above)

---

## 🚀 What Happens After Admin Login:

Once logged in as admin, you'll have access to:

✅ **Dashboard** - Overview of all team members
✅ **My Tasks** - Your personal tasks
✅ **Analytics** - Team performance metrics
✅ **Admin Panel** - Manage users, view all tasks, system settings
✅ **Settings** - Profile and preferences

---

## 📊 Admin vs Member Differences:

| Feature | Admin | Member |
|---------|-------|--------|
| View own tasks | ✅ | ✅ |
| Add own tasks | ✅ | ✅ |
| View team dashboard | ✅ | ❌ |
| View all users | ✅ | ❌ |
| Manage users | ✅ | ❌ |
| Access Admin Panel | ✅ | ❌ |
| View audit logs | ✅ | ❌ |
| Export data | ✅ | Limited |
| Invite users | ✅ | ❌ |

---

## 🎯 Next Steps After Creating Admin:

1. ✅ Create your admin account
2. ✅ Set role to "admin" in Firestore
3. ✅ Login with admin credentials
4. ✅ Explore the Dashboard
5. ✅ Add your first task
6. ✅ Test all admin features

---

**Quick Link to Sign Up**: http://localhost:3001/login (click "Sign Up" tab)

**Quick Link to Firebase Console**: https://console.firebase.google.com/project/dwts-11567/firestore/data/users

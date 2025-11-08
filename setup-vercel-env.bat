@echo off
echo ====================================
echo Adding Environment Variables to Vercel
echo ====================================
echo.

echo Adding VITE_FIREBASE_API_KEY...
echo AIzaSyAIR24_S-Le_819D0O1EANSCJlra-2_MY8 | vercel env add VITE_FIREBASE_API_KEY production
echo.

echo Adding VITE_FIREBASE_AUTH_DOMAIN...
echo dwts-11567.firebaseapp.com | vercel env add VITE_FIREBASE_AUTH_DOMAIN production
echo.

echo Adding VITE_FIREBASE_PROJECT_ID...
echo dwts-11567 | vercel env add VITE_FIREBASE_PROJECT_ID production
echo.

echo Adding VITE_FIREBASE_STORAGE_BUCKET...
echo dwts-11567.firebasestorage.app | vercel env add VITE_FIREBASE_STORAGE_BUCKET production
echo.

echo Adding VITE_FIREBASE_MESSAGING_SENDER_ID...
echo 514146765056 | vercel env add VITE_FIREBASE_MESSAGING_SENDER_ID production
echo.

echo Adding VITE_FIREBASE_APP_ID...
echo 1:514146765056:web:ca13861ad9c2b1ac764be5 | vercel env add VITE_FIREBASE_APP_ID production
echo.

echo Adding VITE_FIREBASE_MEASUREMENT_ID...
echo G-PFE3RG4LBJ | vercel env add VITE_FIREBASE_MEASUREMENT_ID production
echo.

echo Adding VITE_CLOUDINARY_CLOUD_NAME...
echo do46xxegj | vercel env add VITE_CLOUDINARY_CLOUD_NAME production
echo.

echo Adding VITE_CLOUDINARY_UPLOAD_PRESET...
echo dwtsystem | vercel env add VITE_CLOUDINARY_UPLOAD_PRESET production
echo.

echo ====================================
echo All environment variables added!
echo Now redeploying to Vercel...
echo ====================================
echo.

vercel --prod

echo.
echo ====================================
echo Deployment complete!
echo ====================================

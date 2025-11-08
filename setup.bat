@echo off
echo ============================================
echo   DWTS - Daily Work Tracking System
echo   Quick Start Setup
echo ============================================
echo.

REM Check if node is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/4] Node.js detected: 
node --version
echo.

REM Check if .env file exists
if not exist ".env" (
    echo [2/4] Creating .env file from template...
    copy .env.example .env
    echo.
    echo [!] IMPORTANT: Please edit .env file with your Firebase credentials
    echo     Open .env in a text editor and add your Firebase config
    echo.
) else (
    echo [2/4] .env file already exists
    echo.
)

REM Install dependencies
echo [3/4] Installing dependencies (this may take a few minutes)...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install dependencies
    pause
    exit /b 1
)
echo.

echo [4/4] Setup complete!
echo.
echo ============================================
echo   Next Steps:
echo ============================================
echo.
echo 1. Configure Firebase:
echo    - Go to: https://console.firebase.google.com
echo    - Create a project and enable Auth + Firestore
echo    - Copy config to .env file
echo.
echo 2. Start development server:
echo    npm run dev
echo.
echo 3. Open browser:
echo    http://localhost:3000
echo.
echo 4. Read documentation:
echo    - SETUP_GUIDE.md (detailed setup)
echo    - PROJECT_SUMMARY.md (features overview)
echo    - README.md (quick reference)
echo.
echo ============================================
echo.

REM Ask if user wants to start dev server
set /p start_server="Start development server now? (y/n): "
if /i "%start_server%"=="y" (
    echo.
    echo Starting development server...
    echo Press Ctrl+C to stop the server
    echo.
    call npm run dev
) else (
    echo.
    echo Run 'npm run dev' when you're ready to start!
    echo.
)

pause

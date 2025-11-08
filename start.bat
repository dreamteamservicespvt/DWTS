@echo off
echo.
echo ========================================
echo   DWTS - Daily Work Tracking System
echo   Quick Start Script
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [1/3] Installing dependencies...
    echo.
    call npm install
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install dependencies
        echo Please run: npm install
        pause
        exit /b 1
    )
) else (
    echo [1/3] Dependencies already installed ✓
)

echo.
echo [2/3] Checking environment configuration...
if not exist ".env" (
    echo ERROR: .env file not found!
    echo Please create .env file with your Firebase and Cloudinary credentials.
    pause
    exit /b 1
) else (
    echo Environment variables configured ✓
)

echo.
echo [3/3] Starting development server...
echo.
echo ========================================
echo   Server will start at:
echo   http://localhost:5173
echo.
echo   Press Ctrl+C to stop the server
echo ========================================
echo.

call npm run dev

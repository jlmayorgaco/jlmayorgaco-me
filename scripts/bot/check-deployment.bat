@echo off
REM Windows Deployment Helper for JLMT Lab Bot
REM This script checks if you're ready to deploy

echo.
echo ========================================
echo  JLMT Lab Bot - Pre-Deployment Check
echo ========================================
echo.

REM Check Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [X] Node.js not found
    echo     Install from: https://nodejs.org (version 22+)
    exit /b 1
) else (
    for /f "tokens=*" %%a in ('node --version') do set NODE_VER=%%a
    echo [OK] Node.js found: %NODE_VER%
)

echo.

REM Check if .env exists
if exist "scripts\bot\.env" (
    echo [OK] Environment file found
    
    REM Check required variables
    findstr /C:"TELEGRAM_BOT_TOKEN=" "scripts\bot\.env" >nul
    if %errorlevel% equ 0 (
        echo [OK] TELEGRAM_BOT_TOKEN configured
    ) else (
        echo [X] TELEGRAM_BOT_TOKEN missing
    )
    
    findstr /C:"GEMINI_API_KEY=" "scripts\bot\.env" >nul
    if %errorlevel% equ 0 (
        echo [OK] GEMINI_API_KEY configured
    ) else (
        echo [X] GEMINI_API_KEY missing
    )
    
    findstr /C:"TELEGRAM_CHAT_ID=" "scripts\bot\.env" >nul
    if %errorlevel% equ 0 (
        echo [OK] TELEGRAM_CHAT_ID configured
    ) else (
        echo [X] TELEGRAM_CHAT_ID missing
    )
    
) else (
    echo [X] Environment file NOT found
    echo     Create: scripts\bot\.env
    echo     See: .env.example for template
)

echo.

REM Check dependencies
if exist "node_modules" (
    echo [OK] Dependencies installed
) else (
    echo [!] Dependencies not installed
    echo     Run: npm install
)

echo.

REM Run tests
echo [*] Running tests...
npm run test:bot > test_output.txt 2>&1
if %errorlevel% equ 0 (
    echo [OK] All tests passing
    del test_output.txt
) else (
    echo [!] Some tests failed
    echo     Check: test_output.txt
)

echo.
echo ========================================
echo  Check Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. Ensure all [X] items are resolved
echo 2. Choose your hosting provider (see DEPLOYMENT_GUIDE.md)
echo 3. Run deployment commands
echo.
pause

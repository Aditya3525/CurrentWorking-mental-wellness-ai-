@echo off
REM Quick Push to GitHub - Windows Batch File
REM Double-click this file to instantly push changes to GitHub

echo.
echo ========================================
echo    Quick GitHub Push
echo ========================================
echo.

cd /d "%~dp0"

REM Check if PowerShell script exists
if not exist "quick-push.ps1" (
    echo ERROR: quick-push.ps1 not found!
    pause
    exit /b 1
)

REM Run PowerShell script
powershell.exe -ExecutionPolicy Bypass -File "quick-push.ps1"

echo.
pause

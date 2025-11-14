@echo off
echo ========================================
echo Starting Proctoring Service...
echo ========================================
echo.

REM Check if port 8082 is already in use
netstat -ano | findstr :8082 >nul
if %errorlevel% == 0 (
    echo [WARNING] Port 8082 is already in use!
    echo Finding and stopping the process...
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082') do (
        echo Stopping process PID: %%a
        taskkill /F /PID %%a >nul 2>&1
    )
    timeout /t 2 /nobreak >nul
)

echo Starting service on port 8082...
echo.

cd /d %~dp0
node server.js

pause


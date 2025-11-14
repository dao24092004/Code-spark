@echo off
echo ========================================
echo Stopping Proctoring Service...
echo ========================================
echo.

REM Find and stop process using port 8082
netstat -ano | findstr :8082 >nul
if %errorlevel% == 0 (
    echo Found process using port 8082:
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8082') do (
        echo Stopping process PID: %%a
        taskkill /F /PID %%a >nul 2>&1
        if %errorlevel% == 0 (
            echo [OK] Process stopped successfully
        ) else (
            echo [ERROR] Failed to stop process
        )
    )
) else (
    echo [INFO] No process found using port 8082
)

echo.
pause


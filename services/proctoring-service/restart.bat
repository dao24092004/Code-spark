@echo off
echo ========================================
echo Restarting Proctoring Service...
echo ========================================
echo.

call stop.bat
timeout /t 2 /nobreak >nul
call start.bat


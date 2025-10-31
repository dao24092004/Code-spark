@echo off
REM Script khởi động toàn bộ Proctoring Service (Windows)
REM Chạy cả Python AI Service và Node.js Service

echo ========================================
echo   KHOI DONG PROCTORING SERVICE
echo ========================================
echo.

REM Kiểm tra Node.js
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js chua duoc cai dat!
    echo Vui long tai va cai dat Node.js tu https://nodejs.org
    pause
    exit /b 1
)

REM Kiểm tra Python
where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python chua duoc cai dat!
    echo Vui long tai va cai dat Python tu https://python.org
    pause
    exit /b 1
)

echo [1/3] Kiem tra cac dependencies...
echo.

REM Kiểm tra node_modules
if not exist "node_modules\" (
    echo [INFO] Chua cai dat node modules. Dang cai dat...
    call npm install
)

REM Kiểm tra Python dependencies
echo [INFO] Kiem tra Python dependencies...
cd ai-service
pip install -r requirements.txt
cd ..

echo.
echo [2/3] Khoi dong Python AI Service (Port 8000)...
echo.

REM Start Python AI Service trong background
start "Python AI Service" cmd /k "cd ai-service && python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

REM Đợi 3 giây để Python service khởi động
timeout /t 3 /nobreak >nul

echo.
echo [3/3] Khoi dong Node.js Proctoring Service (Port 8082)...
echo.

REM Start Node.js Service
start "Node.js Proctoring Service" cmd /k "npm start"

echo.
echo ========================================
echo   TAT CA SERVICES DA KHOI DONG!
echo ========================================
echo.
echo Python AI Service: http://127.0.0.1:8000
echo Node.js Service:   http://127.0.0.1:8082
echo.
echo De dung cac service, dong cac cua so terminal.
echo.

pause


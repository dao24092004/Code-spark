#!/bin/bash
# Script khởi động toàn bộ Proctoring Service (Linux/Mac)
# Chạy cả Python AI Service và Node.js Service

echo "========================================"
echo "  KHỞI ĐỘNG PROCTORING SERVICE"
echo "========================================"
echo ""

# Kiểm tra Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js chưa được cài đặt!"
    echo "Vui lòng tải và cài đặt Node.js từ https://nodejs.org"
    exit 1
fi

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python chưa được cài đặt!"
    echo "Vui lòng tải và cài đặt Python từ https://python.org"
    exit 1
fi

echo "[1/3] Kiểm tra các dependencies..."
echo ""

# Kiểm tra node_modules
if [ ! -d "node_modules" ]; then
    echo "[INFO] Chưa cài đặt node modules. Đang cài đặt..."
    npm install
fi

# Kiểm tra Python virtual environment
if [ ! -d "ai-service/venv" ]; then
    echo "[INFO] Chưa có virtual environment. Đang tạo..."
    cd ai-service
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
else
    echo "[INFO] Virtual environment đã tồn tại"
fi

echo ""
echo "[2/3] Khởi động Python AI Service (Port 8000)..."
echo ""

# Start Python AI Service trong background
cd ai-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
PYTHON_PID=$!
cd ..

# Đợi 3 giây để Python service khởi động
sleep 3

echo ""
echo "[3/3] Khởi động Node.js Proctoring Service (Port 8082)..."
echo ""

# Start Node.js Service
npm start &
NODE_PID=$!

echo ""
echo "========================================"
echo "  TẤT CẢ SERVICES ĐÃ KHỞI ĐỘNG!"
echo "========================================"
echo ""
echo "Python AI Service: http://localhost:8000"
echo "Node.js Service:   http://localhost:8082"
echo ""
echo "Python PID: $PYTHON_PID"
echo "Node.js PID: $NODE_PID"
echo ""
echo "Nhấn Ctrl+C để dừng tất cả services"
echo ""

# Đợi cho đến khi user nhấn Ctrl+C
wait


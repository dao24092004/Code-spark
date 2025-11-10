# Script để tạo file .env cho multisig-service
# Usage: .\scripts\create-env.ps1

$envFile = ".env"
$envExample = ".env.example"

Write-Host "🔧 Đang tạo file .env cho multisig-service..." -ForegroundColor Cyan

# Nội dung file .env
$envContent = @"
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=development

# ============================================
# DATABASE CONFIGURATION (PostgreSQL)
# ============================================
# Kết nối đến PostgreSQL container trong Docker
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASS=postgres

# ⚠️ LƯU Ý: 
# - Password mặc định là "postgres" nếu dùng Docker Compose mặc định
# - Nếu bạn có file .env ở thư mục gốc với POSTGRES_PASSWORD, dùng giá trị đó
# - Để kiểm tra password hiện tại: docker exec postgres-db psql -U postgres -c "SELECT 1;"

# ============================================
# BLOCKCHAIN CONFIGURATION (Ganache)
# ============================================
# Ganache trong docker-compose.yml chạy trên port 7545
# Nhưng service có thể dùng port 8545 nếu Ganache chạy local
# Kiểm tra port Ganache đang chạy và cập nhật RPC_URL tương ứng
RPC_URL=http://localhost:8545

# ⚠️ QUAN TRỌNG: Private keys từ Ganache (KHÔNG có prefix "0x")
# Ganache mặc định sử dụng mnemonic deterministic, các private keys mặc định:
# Account #0: 4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
# Account #1: 6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
# Account #2: 6370fd033278c143179d81c5526140625662b8daa446c22ee2d73db3707e620
# Account #3: 646f1ce2fdad0e6deeeb5c7e8e5543bdde65e86029e2fd9fc169899c440a791
# Account #4: add53f9a7e8d81c8bc0ce9516909724d222db38873c47684135de32e44514cc

# DEPLOYER_PRIVATE_KEY: Private key để deploy contracts (có thể dùng Account #0)
DEPLOYER_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d

# SERVICE_ACCOUNT_PRIVATE_KEY: Private key để service tự động ký transactions
# ⚠️ QUAN TRỌNG: Address tương ứng với private key này PHẢI là một owner khi tạo ví
# Để lấy address từ private key, xem logs khi server khởi động: "Service Account: 0x..."
SERVICE_ACCOUNT_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d

# ============================================
# SERVICE DISCOVERY (Optional - Tắt nếu không dùng Eureka)
# ============================================
EUREKA_ENABLED=false
EUREKA_HOST=localhost
EUREKA_PORT=9999

# ============================================
# JWT SECRET (for future authentication)
# ============================================
JWT_SECRET=multisig-service-secret-key-change-this-in-production

# ============================================
# HƯỚNG DẪN SỬ DỤNG
# ============================================
# 1. Kiểm tra Ganache đang chạy:
#    docker ps --filter "name=ganache"
#    
# 2. Nếu Ganache chạy qua Docker (port 7545):
#    RPC_URL=http://localhost:7545
#    
# 3. Nếu Ganache chạy local hoặc ganache-cli (port 8545):
#    RPC_URL=http://localhost:8545
#
# 4. Lấy private keys từ Ganache:
#    - Mở Ganache GUI → Accounts → Copy private key (không có "0x")
#    - Hoặc: docker logs ganache (nếu dùng container)
#
# 5. Lấy Service Account address:
#    - Khởi động server: npm run dev
#    - Xem log: "Service Account: 0x..."
#    - Dùng address này làm một owner khi tạo ví
"@

# Kiểm tra file .env đã tồn tại chưa
if (Test-Path $envFile) {
    $overwrite = Read-Host "File .env đã tồn tại. Bạn có muốn ghi đè? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Không tạo file .env. File hiện tại được giữ nguyên." -ForegroundColor Yellow
        exit 0
    }
}

# Tạo file .env
try {
    $envContent | Out-File -FilePath $envFile -Encoding UTF8 -NoNewline
    Write-Host "✅ File .env đã được tạo thành công!" -ForegroundColor Green
    Write-Host "📝 File: $((Get-Location).Path)\$envFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "⚠️  LƯU Ý:" -ForegroundColor Yellow
    Write-Host "  1. Kiểm tra DB_PASS phù hợp với PostgreSQL container" -ForegroundColor White
    Write-Host "  2. Kiểm tra RPC_URL phù hợp với port Ganache (7545 hoặc 8545)" -ForegroundColor White
    Write-Host "  3. Cập nhật SERVICE_ACCOUNT_PRIVATE_KEY nếu dùng Ganache khác" -ForegroundColor White
    Write-Host ""
    Write-Host "💡 Tiếp theo: Chỉnh sửa file .env và chạy: npm install && npm run dev" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Lỗi khi tạo file .env: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}


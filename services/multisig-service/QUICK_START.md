# 🚀 Quick Start - Multisig Service

## ⚡ Khởi động nhanh (5 phút)

### 1. Cấu hình .env

Tạo file `.env` trong `services/multisig-service/`:

```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASS=postgres

RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
SERVICE_ACCOUNT_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d

EUREKA_ENABLED=false
JWT_SECRET=test-secret-key
```

**Lưu ý:** Private keys ở trên là mặc định của Ganache. Nếu dùng Ganache khác, lấy keys từ Ganache.

### 2. Khởi động Infrastructure

```powershell
# Từ thư mục gốc dự án
docker-compose up -d postgres-db ganache
```

### 3. Cài đặt và chạy Service

```powershell
cd services/multisig-service
npm install
npm run dev
```

### 4. Test API

**Tạo ví:**
```powershell
$body = '{
    "name": "Test Wallet",
    "owners": [
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "0x8ba1f109551bD432803012645Hac136c22C4e2"
    ],
    "threshold": 2
}'

Invoke-RestMethod -Uri http://localhost:3001/api/v1/multisig `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

**Kiểm tra Health:**
```powershell
Invoke-RestMethod -Uri http://localhost:3001/health
```

## ✅ Xong!

Nếu thấy server chạy và health check trả về `UP`, bạn đã setup thành công!

Xem `CHECKLIST.md` để biết các bước chi tiết hơn.


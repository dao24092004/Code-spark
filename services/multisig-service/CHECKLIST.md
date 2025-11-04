# ✅ Checklist: Các bước tiếp theo để chạy Multisig Service

## 📋 Danh sách việc cần làm

### ✅ Đã hoàn thành:
- [x] Tạo cấu trúc project
- [x] Tạo các file source code
- [x] Setup PostgreSQL qua Docker
- [x] Database `multisig_db` đã tạo và có tables

### 🔄 Cần làm tiếp theo:

## BƯỚC 1: Cấu hình Environment Variables (.env)

### 1.1. Tạo file `.env`
```powershell
cd services/multisig-service
# Tạo file .env (nếu chưa có)
New-Item -ItemType File -Path .env -Force
```

### 1.2. Cấu hình `.env`

Mở file `.env` và thêm nội dung sau (cập nhật các giá trị):

```env
# ============================================
# SERVER CONFIGURATION
# ============================================
PORT=3001
NODE_ENV=development

# ============================================
# DATABASE CONFIGURATION (PostgreSQL)
# ============================================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASS=your_password_here

# ⚠️ QUAN TRỌNG: Kiểm tra POSTGRES_PASSWORD từ docker-compose.yml hoặc file .env gốc
# Nếu dùng Docker, có thể là: postgres (mặc định)
# Nếu có file .env ở thư mục gốc, xem POSTGRES_PASSWORD ở đó

# ============================================
# BLOCKCHAIN CONFIGURATION (Ganache)
# ============================================
RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=your_ganache_private_key_1
SERVICE_ACCOUNT_PRIVATE_KEY=your_ganache_private_key_2

# ⚠️ QUAN TRỌNG: 
# 1. Khởi động Ganache trước (xem BƯỚC 2)
# 2. Lấy private keys từ Ganache (không có prefix "0x")
# 3. SERVICE_ACCOUNT_PRIVATE_KEY phải là một trong các keys từ Ganache

# ============================================
# SERVICE DISCOVERY (Optional - Tắt nếu không dùng)
# ============================================
EUREKA_ENABLED=false
EUREKA_HOST=localhost
EUREKA_PORT=9999

# ============================================
# JWT SECRET (for future authentication)
# ============================================
JWT_SECRET=your-secret-jwt-key-change-this-in-production
```

**Lưu ý:**
- Thay `your_password_here` bằng password PostgreSQL từ docker-compose.yml hoặc .env gốc
- Lấy private keys từ Ganache sau khi khởi động (BƯỚC 2)

---

## BƯỚC 2: Khởi động Ganache (Local Blockchain)

### 2.1. Khởi động Ganache container

**Cách 1: Docker Compose (Khuyến nghị)**
```powershell
# Từ thư mục gốc dự án
docker-compose up -d ganache
```

**Cách 2: Kiểm tra Ganache đã chạy**
```powershell
docker ps --filter "name=ganache"
```

### 2.2. Lấy Private Keys từ Ganache

**Cách 1: Dùng Docker Compose với Ganache GUI**
```powershell
# Mở Ganache GUI (nếu đã cài)
# Hoặc dùng Docker và xem logs:
docker logs ganache
```

**Cách 2: Dùng Ganache CLI (nếu dùng container)**
```powershell
# Xem accounts từ container (nếu có output)
docker exec ganache ganache-cli --accounts=10
```

**Cách 3: Ganache mặc định (deterministic)**
Nếu dùng ganache-cli với mnemonic mặc định, private keys thường là:
```
Account #0: 0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
Account #1: 0x6cbed15c793ce57650b9877cf6fa156fbef513c4e6134f022a85b1ffdd59b2a1
```

**Lưu ý:** Private keys trong `.env` không có prefix `0x`

### 2.3. Cập nhật .env với Private Keys
```env
DEPLOYER_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
SERVICE_ACCOUNT_PRIVATE_KEY=4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d
```

### 2.4. Kiểm tra RPC URL
```powershell
# Test kết nối Ganache
curl http://localhost:8545
# Hoặc
Invoke-WebRequest -Uri http://localhost:8545 -Method POST -ContentType "application/json" -Body '{"jsonrpc":"2.0","method":"eth_accounts","params":[],"id":1}'
```

---

## BƯỚC 3: Cài đặt Dependencies

### 3.1. Cài đặt Node modules
```powershell
cd services/multisig-service
npm install
```

### 3.2. Kiểm tra cài đặt
```powershell
# Kiểm tra các package quan trọng đã cài
npm list web3
npm list express
npm list sequelize
npm list @openzeppelin/contracts
```

---

## BƯỚC 4: Chạy Service

### 4.1. Development Mode (với auto-reload)
```powershell
cd services/multisig-service
npm run dev
```

### 4.2. Production Mode
```powershell
cd services/multisig-service
npm start
```

### 4.3. Kiểm tra Server đã chạy

Bạn sẽ thấy output tương tự:
```
✅ Web3 đã khởi tạo.
✅ Service Account: 0x...
✅ Hợp đồng MultiSigWallet đã được biên dịch.
✅ Database đã đồng bộ.
🚀 Multisig Service đang chạy trên cổng 3001
```

### 4.4. Test Health Check
```powershell
# Mở browser hoặc dùng curl
curl http://localhost:3001/health
# Hoặc
Invoke-WebRequest -Uri http://localhost:3001/health
```

Kết quả mong đợi: `UP`

---

## BƯỚC 5: Test API

### 5.1. Test tạo ví mới

**Lưu ý:** Service Account address phải nằm trong mảng `owners`

```powershell
# Lấy Service Account address từ logs khi server khởi động
# Ví dụ: Service Account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

# Request tạo ví
$body = @{
    name = "Test Wallet"
    description = "Ví test đầu tiên"
    owners = @(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
        "0x8ba1f109551bD432803012645Hac136c22C4e2"
    )
    threshold = 2
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:3001/api/v1/multisig `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### 5.2. Lưu lại Wallet ID

Từ response, copy `id` và `contractAddress` để dùng cho các bước tiếp theo.

### 5.3. Test Submit Transaction

```powershell
$walletId = "YOUR_WALLET_ID_HERE"
$txBody = @{
    destination = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
    value = "0.01"
    data = "0x"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/v1/multisig/$walletId/transactions" `
    -Method POST `
    -ContentType "application/json" `
    -Body $txBody
```

### 5.4. Test Confirm Transaction

```powershell
$txId = "YOUR_TRANSACTION_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/multisig/transactions/$txId/confirm" `
    -Method POST
```

### 5.5. Test Execute Transaction

**Lưu ý:** Chỉ execute khi đủ confirmations (>= threshold)

```powershell
$txId = "YOUR_TRANSACTION_ID_HERE"
Invoke-RestMethod -Uri "http://localhost:3001/api/v1/multisig/transactions/$txId/execute" `
    -Method POST
```

---

## BƯỚC 6: Kiểm tra Database

### 6.1. Xem Wallets đã tạo
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "SELECT id, name, \"contractAddress\", threshold FROM \"MultisigWallets\";"
```

### 6.2. Xem Transactions
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "SELECT id, status, \"txHash\", destination, value FROM \"MultisigTransactions\";"
```

---

## ⚠️ Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra PostgreSQL container đang chạy: `docker ps --filter "name=postgres"`
- Kiểm tra password trong `.env` đúng chưa
- Test connection: `docker exec postgres-db psql -U postgres -d multisig_db`

### Lỗi: "Cannot connect to blockchain"
- Kiểm tra Ganache đang chạy: `docker ps --filter "name=ganache"`
- Kiểm tra RPC_URL trong `.env`: `http://localhost:8545`
- Test: `curl http://localhost:8545`

### Lỗi: "Service Account phải nằm trong danh sách owners"
- Lấy Service Account address từ server logs khi khởi động
- Thêm address này vào mảng `owners` khi tạo ví

### Lỗi: "Insufficient funds for gas"
- Mở Ganache UI
- Chuyển ETH từ account khác sang Service Account
- Hoặc chọn account có nhiều ETH hơn làm Service Account

---

## 🎯 Mục tiêu hoàn thành

- [ ] File `.env` đã cấu hình đầy đủ
- [ ] Ganache đang chạy và có thể kết nối
- [ ] Dependencies đã cài đặt (`npm install`)
- [ ] Server khởi động thành công (port 3001)
- [ ] Health check trả về `UP`
- [ ] Tạo ví mới thành công
- [ ] Submit transaction thành công
- [ ] Confirm transaction thành công
- [ ] Execute transaction thành công

---

## 📚 Tài liệu tham khảo

- `README.md` - Hướng dẫn tổng quan
- `HUONG_DAN.md` - Hướng dẫn chi tiết từng bước
- `POSTGRES_DOCKER.md` - Hướng dẫn dùng PostgreSQL qua Docker


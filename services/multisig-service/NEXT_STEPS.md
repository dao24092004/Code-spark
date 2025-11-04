# 🎯 Các bước tiếp theo - Đã hoàn thành!

## ✅ Đã hoàn thành:

1. ✅ **File .env đã được tạo** từ `env.template`
   - Location: `services/multisig-service/.env`
   - Password PostgreSQL: `password`
   - Private keys mặc định từ Ganache deterministic

2. ✅ **Database đã sẵn sàng**
   - Database: `multisig_db`
   - Container: `postgres-db` đang chạy
   - Tables đã tạo: `MultisigWallets`, `MultisigTransactions`

## 🚀 Bước tiếp theo:

### 1. Khởi động Ganache (nếu chưa chạy)

```powershell
# Từ thư mục gốc dự án
docker-compose up -d ganache
```

### 2. Kiểm tra Ganache đã chạy

```powershell
docker ps --filter "name=ganache"
```

### 3. Cài đặt Dependencies

```powershell
cd services/multisig-service
npm install
```

### 4. Chạy Service

```powershell
# Development mode (với auto-reload)
npm run dev

# Hoặc Production mode
npm start
```

### 5. Kiểm tra Server

Mở browser hoặc dùng PowerShell:

```powershell
Invoke-RestMethod -Uri http://localhost:3001/health
```

Kết quả mong đợi: `UP`

### 6. Test API - Tạo ví mới

**Lưu ý:** Service Account address phải nằm trong mảng `owners`

```powershell
# Lấy Service Account address từ logs khi server khởi động
# Ví dụ: Service Account: 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb

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

## 📝 File .env đã có sẵn:

File `.env` đã được tạo với các giá trị mặc định:

- **DB_PASS**: `password` (từ docker-compose.yml)
- **Private Keys**: Mặc định từ Ganache deterministic
- **RPC_URL**: `http://localhost:8545`

**Lưu ý:** Nếu dùng Ganache khác, cần cập nhật private keys trong `.env`

## 🔍 Kiểm tra cấu hình .env

```powershell
cd services/multisig-service
Get-Content .env | Select-String "DB_PASS|SERVICE_ACCOUNT_PRIVATE_KEY"
```

## ⚠️ Lưu ý quan trọng

1. **Service Account phải là Owner**: 
   - Khi tạo ví, phải bao gồm địa chỉ của `SERVICE_ACCOUNT_PRIVATE_KEY` trong mảng `owners`
   - Lấy address từ server logs khi khởi động: `Service Account: 0x...`

2. **Password PostgreSQL**: 
   - Đã cấu hình: `password`
   - Nếu có lỗi kết nối database, kiểm tra lại password trong docker-compose.yml

3. **Ganache Port**: 
   - RPC_URL: `http://localhost:8545`
   - Nếu Ganache chạy trên port khác, cập nhật `RPC_URL` trong `.env`

## 🎉 Hoàn thành!

Bạn đã sẵn sàng chạy service! Chỉ cần:

```powershell
cd services/multisig-service
npm install
npm run dev
```

Xem `CHECKLIST.md` để biết các bước chi tiết hơn!


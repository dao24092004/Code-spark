# 🚀 Next Steps - Multisig Service Setup

## ✅ Đã hoàn thành:

1. ✅ File `.env` đã được cấu hình với:
   - Database: `multisig_db`, user: `postgres`, password: `password`
   - Blockchain: Ganache tại `http://localhost:7545`
   - Deployer address và private key đã có

2. ✅ Dependencies đã được cài đặt
3. ✅ Source code đã được tạo đầy đủ

## ⚠️ Cần xử lý:

### 1. Truffle Compile Issue

Truffle báo "Everything is up to date" nhưng không tạo artifacts. **Giải pháp:**

Contracts sẽ được compile tự động khi deploy qua API, hoặc bạn có thể:

```powershell
# Thử compile lại với verbose
truffle compile --verbose

# Hoặc kiểm tra contract file encoding
Get-Content contracts/MultiSigWallet.sol | Select-Object -First 5
```

**Lưu ý:** Service có thể chạy mà không cần compile trước vì contract sẽ được compile khi deploy qua API endpoint.

### 2. Database Setup

Đảm bảo PostgreSQL đang chạy và database đã được tạo:

```powershell
# Kiểm tra PostgreSQL
pg_isready

# Tạo database nếu chưa có
createdb multisig_db

# Hoặc với psql
psql -U postgres
CREATE DATABASE multisig_db;
```

### 3. Ganache Setup

Đảm bảo Ganache đang chạy:

1. Mở Ganache Desktop hoặc chạy `ganache-cli` trên port 7545
2. Kiểm tra có accounts và ETH
3. Lưu lại 2-3 accounts (address + private key) để test

### 4. Start Service

```powershell
# Chạy service
npm run dev

# Hoặc
npm start
```

Service sẽ chạy tại: **http://localhost:3001**

## 🧪 Testing với Postman

### Test 1: Health Check

```
GET http://localhost:3001/health
```

Expected: `200 OK` với status `UP`

### Test 2: Tạo Ví

```
POST http://localhost:3001/api/v1/wallets
Content-Type: application/json

{
  "name": "Test Wallet",
  "description": "Wallet để test",
  "owners": [
    "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
    "<address_2_từ_Ganache>"
  ],
  "threshold": 2,
  "deployerAddress": "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
  "deployerPrivateKey": "cfa19f3e41ec1cf77c88f6122835c049163b69c9c3ca02e4ba1dba9ff196cd23"
}
```

**Lưu ý:** 
- Thay `address_2_từ_Ganache` bằng một address khác từ Ganache
- Contract sẽ được compile và deploy tự động khi tạo ví

### Test 3: Submit Transaction

Sau khi tạo ví thành công, sử dụng `walletId` từ response:

```
POST http://localhost:3001/api/v1/wallets/{walletId}/transactions
Content-Type: application/json

{
  "destination": "<address_nhận_ETH>",
  "value": "1.0",
  "data": "0x",
  "from": "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
  "privateKey": "cfa19f3e41ec1cf77c88f6122835c049163b69c9c3ca02e4ba1dba9ff196cd23"
}
```

### Test 4: Confirm & Execute

Xem chi tiết trong `QUICKSTART.md` hoặc `MULTISIG_GUIDE.md`

## 📋 Checklist Hoàn Thành

- [ ] PostgreSQL đang chạy
- [ ] Database `multisig_db` đã được tạo
- [ ] Ganache đang chạy trên port 7545
- [ ] Service đang chạy tại port 3001
- [ ] Health check thành công
- [ ] Test tạo ví thành công
- [ ] Test submit transaction thành công
- [ ] Test confirm transaction thành công
- [ ] Test execute transaction thành công

## 🆘 Troubleshooting

### Lỗi: "Database connection failed"
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra database đã được tạo
- Kiểm tra credentials trong `.env`

### Lỗi: "Blockchain connection failed"
- Kiểm tra Ganache đang chạy
- Kiểm tra port 7545
- Kiểm tra `WEB3_PROVIDER_URL` trong `.env`

### Lỗi: "Contract artifact not found"
- Contract sẽ được compile khi deploy qua API
- Hoặc chạy `truffle compile` thủ công

### Lỗi: "Service không start"
- Kiểm tra port 3001 có bị chiếm không
- Kiểm tra logs: `npm start` hoặc `npm run dev`
- Kiểm tra `.env` có đúng format không

## 📚 Tài Liệu

- `README.md` - Tài liệu chính
- `MULTISIG_GUIDE.md` - Hướng dẫn chi tiết
- `QUICKSTART.md` - Quick start

## 🎉 Hoàn Thành!

Khi tất cả tests pass, service đã sẵn sàng để sử dụng! 🚀


# 🔗 Hướng dẫn: Tích hợp Ganache App với Multisig Service

## 📋 Tổng quan

Hướng dẫn chi tiết cách sử dụng Ganache App để lấy private keys, địa chỉ owners và số ETH để sử dụng với Multisig Service.

---

## 🎯 Từ Ganache App

### Thông tin bạn có trong Ganache:

1. **Địa chỉ owners** (Address) - Dùng để tạo ví và confirm transactions
2. **Private keys** - Dùng để confirm transactions từ owners khác
3. **Số ETH còn lại** - Kiểm tra balance trước khi thực hiện giao dịch

---

## 📖 Bước 1: Lấy Private Key từ Ganache

### Cách lấy Private Key:

1. Mở **Ganache App**
2. Vào tab **"ACCOUNTS"**
3. Click vào **icon key (🔑)** bên cạnh account bạn muốn
4. **Copy private key** (có thể có hoặc không có prefix `0x`)

**Ví dụ từ Ganache của bạn:**
- **Account 1:** `0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB` → Click key icon để lấy private key
- **Account 2:** `0x7Cae68d39A4dd45a02D80935c72310F711474286` → Click key icon để lấy private key
- **Account 3:** `0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE` → Click key icon để lấy private key

---

## 🏦 Bước 2: Lấy Địa chỉ Owners

### Từ Ganache App:

1. Mở tab **"ACCOUNTS"**
2. **Copy ADDRESS** của các accounts bạn muốn làm owners
3. Lưu vào mảng để dùng khi tạo ví

**Ví dụ owners từ Ganache của bạn:**
```json
{
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",  // Account 1 - 99.41 ETH
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",  // Account 2 - 99.84 ETH
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE"   // Account 3 - 100.00 ETH
  ],
  "threshold": 2
}
```

---

## 💰 Bước 3: Kiểm tra Balance từ Ganache

### Trong Ganache App:

1. Mở tab **"ACCOUNTS"**
2. Xem cột **"BALANCE"** để biết số ETH còn lại
3. Đảm bảo có đủ ETH để:
   - **Deploy contract:** ~0.04 ETH
   - **Submit transaction:** ~0.001 ETH
   - **Confirm transaction:** ~0.001 ETH (mỗi confirmation)
   - **Execute transaction:** ~0.001 ETH

**Từ Ganache của bạn:**
- Account 1: **99.41 ETH** ✅ (đủ)
- Account 2: **99.84 ETH** ✅ (đủ)
- Account 3: **100.00 ETH** ✅ (đủ)

---

## 🔐 Bước 4: Xác định Service Account

### Tìm Service Account:

Service Account là account được dùng để deploy contract và thực thi transactions. Thường là account đầu tiên trong Ganache hoặc account có trong `.env` file.

**Kiểm tra Service Account:**
```powershell
cd services/multisig-service
Get-Content .env | Select-String "SERVICE_ACCOUNT"
```

Hoặc xem logs khi server khởi động:
```
✅ Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

**⚠️ QUAN TRỌNG:** 
- Service Account **PHẢI có** trong danh sách `owners` khi tạo ví
- Service Account phải có đủ ETH để deploy contract

---

## 📝 Bước 5: Tạo Ví Multisig với Owners từ Ganache

### Request Body trong Postman:

```json
{
  "name": "Team Wallet",
  "description": "Ví đa chữ ký với owners từ Ganache",
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",  // Account 1
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",  // Account 2
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE",   // Account 3
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"    // Service Account (PHẢI CÓ!)
  ],
  "threshold": 2
}
```

**Lưu ý:**
- ✅ Thêm Service Account vào `owners`
- ✅ `threshold = 2` → Cần 2 confirmations để execute
- ✅ Tất cả owners phải có đủ ETH (ít nhất 0.1 ETH mỗi owner)

---

## 🔑 Bước 6: Confirm Transaction với Private Key từ Ganache

### Ví dụ Workflow:

#### 1. Submit Transaction (dùng Service Account - không cần private key):
```http
POST http://localhost:3001/api/v1/multisig/{walletId}/transactions

Body:
{
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "0.01"
}

Response:
{
  "id": "tx-id-123",
  "status": "submitted",
  "confirmations": []
}
```

#### 2. Confirm từ Owner #1 (lấy private key từ Ganache):
```http
POST http://localhost:3001/api/v1/multisig/transactions/tx-id-123/confirm

Body:
{
  "privateKey": "PRIVATE_KEY_FROM_GANACHE_ACCOUNT_1"
}
```

**Cách lấy private key:**
1. Mở Ganache App
2. Click icon key (🔑) của Account 1 (`0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB`)
3. Copy private key
4. Paste vào `privateKey` trong Postman

#### 3. Confirm từ Owner #2 (lấy private key từ Ganache):
```http
POST http://localhost:3001/api/v1/multisig/transactions/tx-id-123/confirm

Body:
{
  "privateKey": "PRIVATE_KEY_FROM_GANACHE_ACCOUNT_2"
}
```

**Đủ 2 confirmations → Có thể execute!**

#### 4. Execute Transaction:
```http
POST http://localhost:3001/api/v1/multisig/transactions/tx-id-123/execute
```

---

## 📊 Bước 7: Quản lý Owners từ Ganache

### Tạo bảng Owners để dễ quản lý:

| Index | Address | Balance | Private Key | Sử dụng |
|-------|---------|---------|-------------|---------|
| 0 | `0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB` | 99.41 ETH | `[Lấy từ Ganache]` | Owner #1 |
| 1 | `0x7Cae68d39A4dd45a02D80935c72310F711474286` | 99.84 ETH | `[Lấy từ Ganache]` | Owner #2 |
| 2 | `0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE` | 100.00 ETH | `[Lấy từ Ganache]` | Owner #3 |

**Lưu ý:**
- ✅ **KHÔNG BAO GIỜ** commit private keys vào Git
- ✅ Chỉ dùng private keys trong môi trường test/development
- ✅ Lưu private keys ở nơi an toàn (không chia sẻ)

---

## 🔍 Bước 8: Kiểm tra Balance trực tiếp từ Ganache

### Trong Ganache App:

1. Mở tab **"ACCOUNTS"**
2. Xem cột **"BALANCE"** để kiểm tra nhanh
3. Click vào account để xem chi tiết transactions

### Kiểm tra qua Script:

```powershell
cd services/multisig-service
.\scripts\check-balance.ps1
```

### Kiểm tra một account cụ thể:

```powershell
$account = "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB"
$body = @{
    jsonrpc = "2.0"
    method = "eth_getBalance"
    params = @($account, "latest")
    id = 1
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "http://localhost:7545" `
    -Method POST -ContentType "application/json" -Body $body

$wei = [Convert]::ToInt64($resp.result, 16)
$eth = $wei / 1000000000000000000
Write-Host "Balance: $eth ETH"
```

---

## 🎯 Ví dụ hoàn chỉnh

### Scenario: Tạo ví với 3 owners từ Ganache, threshold = 2

#### Step 1: Chuẩn bị Owners từ Ganache
```
Owner 1: 0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB (99.41 ETH)
Owner 2: 0x7Cae68d39A4dd45a02D80935c72310F711474286 (99.84 ETH)
Owner 3: 0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE (100.00 ETH)
Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

#### Step 2: Tạo Ví
```json
POST /api/v1/multisig

{
  "name": "Ganache Wallet",
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE",
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  ],
  "threshold": 2
}
```

#### Step 3: Submit Transaction
```json
POST /api/v1/multisig/{walletId}/transactions

{
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "0.01"
}

→ Lưu txId từ response
```

#### Step 4: Confirm từ Owner #1
```
1. Mở Ganache App
2. Click key icon của Account 1
3. Copy private key
```

```json
POST /api/v1/multisig/transactions/{txId}/confirm

{
  "privateKey": "PRIVATE_KEY_OF_ACCOUNT_1_FROM_GANACHE"
}
```

#### Step 5: Confirm từ Owner #2
```
1. Mở Ganache App
2. Click key icon của Account 2
3. Copy private key
```

```json
POST /api/v1/multisig/transactions/{txId}/confirm

{
  "privateKey": "PRIVATE_KEY_OF_ACCOUNT_2_FROM_GANACHE"
}
```

#### Step 6: Execute Transaction
```
POST /api/v1/multisig/transactions/{txId}/execute

→ Thành công! (Đủ 2/3 confirmations)
```

---

## ⚠️ Lưu ý bảo mật

### 🔒 QUAN TRỌNG:

1. **KHÔNG BAO GIỜ** chia sẻ private keys
2. **KHÔNG BAO GIỜ** commit private keys vào Git
3. **KHÔNG BAO GIỜ** log private keys ra console
4. **CHỈ DÙNG** private keys trong môi trường test/development
5. Trong **production**, owners sẽ sign transactions ở frontend (MetaMask)

---

## 📋 Checklist

Trước khi tạo ví và thực hiện transactions:

- [ ] Lấy địa chỉ owners từ Ganache App
- [ ] Lấy private keys từ Ganache App (lưu ở nơi an toàn)
- [ ] Kiểm tra balance của mỗi owner (>= 0.1 ETH)
- [ ] Xác định Service Account
- [ ] Đảm bảo Service Account có trong danh sách owners
- [ ] Đảm bảo Service Account có đủ ETH (>= 0.05 ETH)
- [ ] Tạo ví với owners từ Ganache
- [ ] Submit transaction
- [ ] Confirm từ từng owner (dùng private keys từ Ganache)
- [ ] Execute transaction khi đủ confirmations

---

## 🎯 Tóm tắt

### Từ Ganache App bạn có:
1. ✅ **Địa chỉ owners** → Dùng để tạo ví
2. ✅ **Private keys** → Dùng để confirm transactions
3. ✅ **Balance ETH** → Kiểm tra trước khi thực hiện giao dịch

### Workflow:
1. **Lấy owners** từ Ganache → Tạo ví
2. **Lấy private key** từ Ganache → Confirm transaction
3. **Kiểm tra balance** từ Ganache → Đảm bảo đủ ETH

---

## 📚 File liên quan

- `CONFIRM_WITH_PRIVATE_KEY.md` - Hướng dẫn confirm với private key
- `CHECK_BALANCE_GUIDE.md` - Hướng dẫn kiểm tra balance
- `POSTMAN_API.md` - Tài liệu API đầy đủ


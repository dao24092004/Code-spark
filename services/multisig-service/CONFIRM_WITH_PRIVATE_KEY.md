# 🔐 Hướng dẫn: Confirm Transaction với Private Key

## 📋 Tổng quan

API `Confirm Transaction` đã được cập nhật để cho phép **các owners khác** confirm transaction bằng cách gửi **private key** của họ trong body.

---

## 🎯 Cách hoạt động

### Trước đây (Chỉ Service Account):
- ❌ Chỉ Service Account có thể confirm
- ❌ Không thể confirm từ owners khác
- ❌ Với threshold = 2, không thể đạt đủ confirmations

### Bây giờ (Hỗ trợ tất cả Owners):
- ✅ Service Account vẫn có thể confirm (không cần private key)
- ✅ **Owners khác có thể confirm bằng private key của họ**
- ✅ Với threshold = 2, có thể confirm từ 2 owners khác nhau
- ✅ Mỗi owner chỉ confirm được 1 lần

---

## 📝 API Request

### Endpoint:
```
POST http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm
```

### Headers:
```
Content-Type: application/json
```

### Body (JSON):
```json
{
  "privateKey": "YOUR_PRIVATE_KEY_HERE"
}
```

**⚠️ Lưu ý:**
- `privateKey` là **optional**
- Nếu **không có** `privateKey` → Dùng Service Account (như cũ)
- Nếu **có** `privateKey` → Dùng owner tương ứng với private key đó

---

## 🔑 Lấy Private Key

### 1. Từ Ganache

#### Cách 1: Ganache CLI (Logs)
```bash
# Xem logs của Ganache container
docker logs ganache

# Hoặc nếu chạy local Ganache
# Private keys sẽ hiển thị trong console khi start
```

#### Cách 2: Ganache GUI
1. Mở Ganache GUI
2. Click vào account bạn muốn
3. Click "Key" icon để xem private key
4. Copy private key (không cần prefix `0x`)

#### Cách 3: Ganache với Mnemonic
Nếu bạn biết mnemonic, có thể generate private keys:
```javascript
const { Web3 } = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

const mnemonic = "your mnemonic here";
const provider = new HDWalletProvider(mnemonic, "http://localhost:7545");
const accounts = await provider.getAddresses();
```

### 2. Từ MetaMask

1. Mở MetaMask extension
2. Click vào 3 chấm (⋮) → Settings
3. Security & Privacy → Show Private Key
4. Nhập password MetaMask
5. Copy private key

**⚠️ CẢNH BÁO:** 
- **KHÔNG BAO GIỜ** chia sẻ private key của bạn
- **KHÔNG BAO GIỜ** commit private key vào Git
- Chỉ dùng private key trong môi trường test/development

---

## 📊 Ví dụ thực tế

### Scenario: Ví có 3 owners, threshold = 2

#### Bước 1: Submit Transaction
```json
POST /api/v1/multisig/{walletId}/transactions
{
  "destination": "0xXYZ...",
  "value": "0.01"
}

Response:
{
  "id": "tx-id-123",
  "status": "submitted",
  "confirmations": []
}
```

#### Bước 2: Confirm từ Owner #1 (Service Account - không cần private key)
```json
POST /api/v1/multisig/transactions/tx-id-123/confirm
Body: {}  // Không cần private key

Response:
{
  "id": "tx-id-123",
  "status": "confirmed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"  // Service Account
  ]
}
```

#### Bước 3: Confirm từ Owner #2 (cần private key)
```json
POST /api/v1/multisig/transactions/tx-id-123/confirm
Body: {
  "privateKey": "0x86927d46c63029ae5865c994a0f2dfbe03ac6268..."  // Private key của Owner #2
}

Response:
{
  "id": "tx-id-123",
  "status": "confirmed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",  // Owner #1 (Service Account)
    "0x86927d46c63029ae5865c994a0f2dfbe03ac6268"   // Owner #2
  ]
}
```

#### Bước 4: Execute Transaction (Đủ 2/3 confirmations)
```json
POST /api/v1/multisig/transactions/tx-id-123/execute

Response:
{
  "id": "tx-id-123",
  "status": "executed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x86927d46c63029ae5865c994a0f2dfbe03ac6268"
  ],
  "txHash": "0x..."
}
```

---

## 🔍 Kiểm tra Private Key tương ứng với Address

### Trong Node.js:
```javascript
const { Web3 } = require('web3');
const web3 = new Web3();

// Tạo account từ private key
const account = web3.eth.accounts.privateKeyToAccount('0x' + 'YOUR_PRIVATE_KEY');
console.log('Address:', account.address);
```

### Trong Postman/API:
Khi confirm với private key, nếu address không khớp với owners, API sẽ trả về lỗi:
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Địa chỉ 0xABC... không phải là owner của ví này"
}
```

---

## ✅ Validation và Error Handling

### 1. Kiểm tra Owner
- ✅ Private key phải tương ứng với một owner trong danh sách owners
- ❌ Nếu không → Lỗi: "Địa chỉ ... không phải là owner của ví này"

### 2. Kiểm tra Đã Confirm
- ✅ Mỗi owner chỉ confirm được 1 lần
- ❌ Nếu đã confirm → Lỗi: "Địa chỉ ... đã xác nhận giao dịch này rồi"

### 3. Kiểm tra Transaction
- ✅ Transaction phải tồn tại
- ✅ Transaction chưa được execute
- ❌ Nếu đã execute → Lỗi: "Giao dịch đã được thực thi"

---

## 🚀 Postman Collection

### Request 1: Confirm với Service Account (không cần private key)
```http
POST http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm
Content-Type: application/json

{}
```

### Request 2: Confirm với Owner khác (có private key)
```http
POST http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm
Content-Type: application/json

{
  "privateKey": "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
}
```

**Format private key:**
- ✅ Có `0x`: `"0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"`
- ✅ Không có `0x`: `"4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"`

---

## ⚠️ Lưu ý bảo mật

### ⚠️ QUAN TRỌNG:

1. **KHÔNG BAO GIỜ** commit private key vào Git
2. **KHÔNG BAO GIỜ** log private key ra console
3. **KHÔNG BAO GIỜ** gửi private key qua email/Slack
4. **CHỈ DÙNG** private key trong môi trường test/development
5. Trong **production**, owners sẽ sign transaction ở frontend (MetaMask) và gửi signature lên API

### 🔒 Production Solution (Tương lai):

Trong production, thay vì gửi private key:
1. Frontend: Owner dùng MetaMask để sign transaction
2. Frontend: Gửi signature (không phải private key) lên API
3. Backend: Verify signature và cập nhật database

---

## 📋 Checklist

- [x] API nhận `privateKey` từ body
- [x] Tạo account từ private key
- [x] Verify owner có trong danh sách owners
- [x] Kiểm tra owner chưa confirm
- [x] Sign transaction với account tương ứng
- [x] Cập nhật database với owner address
- [x] Hỗ trợ format private key có/không có `0x`

---

## 🎯 Tóm tắt

1. **Submit Transaction** → Tạo giao dịch mới
2. **Confirm từ Owner #1** → Dùng Service Account (không cần private key)
3. **Confirm từ Owner #2** → Gửi private key của owner đó trong body
4. **Execute Transaction** → Khi đủ confirmations >= threshold

**File liên quan:**
- `MULTISIG_WALLET_EXPLAINED.md` - Giải thích cách hoạt động
- `POSTMAN_API.md` - Tài liệu API đầy đủ


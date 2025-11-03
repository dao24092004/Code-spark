# 📮 Hướng dẫn Test từng bước trên Postman - Multisig Service

## 🎯 Mục tiêu

Hướng dẫn chi tiết cách test toàn bộ workflow của Multisig Service trên Postman, từ tạo ví đến execute transaction.

---

## 📋 Bước 0: Chuẩn bị

### 0.1. Kiểm tra Service đang chạy

**Request:**
```
GET http://localhost:3001/health
```

**Expected Response:**
```
UP
```

**Nếu lỗi:** Kiểm tra server đang chạy tại `http://localhost:3001`

---

### 0.2. Lấy Owners từ Ganache

**Cách 1: Dùng Script (Khuyến nghị)**
```powershell
cd services/multisig-service
.\scripts\get-owners-from-ganache.ps1
```

Script sẽ tạo file `ganache-owners.json` với danh sách owners.

**Cách 2: Lấy thủ công từ Ganache App**
1. Mở Ganache App
2. Vào tab "ACCOUNTS"
3. Copy addresses của các accounts bạn muốn làm owners
4. Lưu lại để dùng sau

**Ví dụ owners từ Ganache:**
```
Owner 1: 0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB
Owner 2: 0x7Cae68d39A4dd45a02D80935c72310F711474286
Owner 3: 0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE
```

---

### 0.3. Lấy Service Account

**Kiểm tra Service Account trong logs khi server khởi động:**
```
✅ Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

**Hoặc kiểm tra trong .env file:**
```powershell
cd services/multisig-service
Get-Content .env | Select-String "SERVICE_ACCOUNT"
```

**Lưu lại Service Account address** - Sẽ cần thêm vào danh sách owners!

---

### 0.4. Lấy Private Keys từ Ganache (cho Confirm)

**Trong Ganache App:**
1. Vào tab "ACCOUNTS"
2. Click icon **key (🔑)** bên cạnh mỗi account
3. Copy private key (có thể có hoặc không có prefix `0x`)
4. Lưu lại ở nơi an toàn (chỉ dùng cho test!)

**Ví dụ:**
- Owner 1 private key: `[Copy từ Ganache Account 1]`
- Owner 2 private key: `[Copy từ Ganache Account 2]`

**⚠️ QUAN TRỌNG:** KHÔNG BAO GIỜ commit private keys vào Git!

---

## 🏦 Bước 1: Tạo Ví Multisig (Create Wallet)

### Request:

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Test Wallet from Postman",
  "description": "Ví test đa chữ ký từ Postman",
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE",
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  ],
  "threshold": 2
}
```

**⚠️ Lưu ý:**
- ✅ Thêm Service Account (`0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`) vào `owners`
- ✅ `threshold = 2` → Cần 2 confirmations để execute
- ✅ Tất cả owners phải có đủ ETH (>= 0.1 ETH mỗi owner)

### Expected Response (Success - 201):

```json
{
  "id": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "contractAddress": "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
  "name": "Test Wallet from Postman",
  "description": "Ví test đa chữ ký từ Postman",
  "creatorId": "123e4567-e89b-12d3-a456-426614174000",
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE",
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  ],
  "threshold": 2,
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

**💡 Lưu lại:**
- `id` → Đây là `walletId` (dùng cho các bước sau)
- `contractAddress` → Địa chỉ contract trên blockchain

**Nếu lỗi "insufficient funds":**
- Chuyển ETH vào Service Account
- Chạy: `.\scripts\check-and-fund.ps1`

---

## 📤 Bước 2: Submit Transaction (Đề xuất giao dịch)

### Request:

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}/transactions`

**Thay `{walletId}` bằng ID từ Bước 1:**
```
POST http://localhost:3001/api/v1/multisig/fa981c89-f6d3-4da9-88a4-e202fcc68dca/transactions
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "0.01",
  "data": "0x"
}
```

**Giải thích:**
- `destination`: Địa chỉ nhận ETH (có thể là bất kỳ địa chỉ nào)
- `value`: Số lượng ETH (trong đơn vị Ether, không phải Wei)
- `data`: Data cho transaction (optional, mặc định: "0x")

### Expected Response (Success - 201):

```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "txIndexOnChain": 0,
  "txHash": "0xc44c653f85fb1de97f74983e659a24c8f133d275b561c84dfcfa1ba7816c446a",
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "10000000000000000",
  "data": "0x",
  "status": "submitted",
  "confirmations": [],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

**💡 Lưu lại:**
- `id` → Đây là `txId` (dùng cho Confirm và Execute)
- `status: "submitted"` → Chưa có confirmations nào
- `confirmations: []` → Chưa ai confirm

---

## ✅ Bước 3: Confirm Transaction - Lần 1 (Owner #1)

### Request:

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm`

**Thay `{txId}` bằng ID từ Bước 2:**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "privateKey": "PRIVATE_KEY_OF_OWNER_1_FROM_GANACHE"
}
```

**Cách lấy private key:**
1. Mở Ganache App
2. Vào tab "ACCOUNTS"
3. Tìm account `0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB` (Owner #1)
4. Click icon **key (🔑)**
5. Copy private key
6. Paste vào `privateKey` trong Postman

**⚠️ Lưu ý:**
- Private key có thể có hoặc không có prefix `0x` (cả hai đều OK)
- Đảm bảo private key tương ứng với một owner trong ví

### Expected Response (Success - 200):

```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "txIndexOnChain": 0,
  "txHash": "0xeef56659cd2e22a773b0fe12d2215b4060f250885f4939b935be91d78818ff94",
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "10000000000000000",
  "data": "0x",
  "status": "confirmed",
  "confirmations": [
    "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb"
  ],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:05:00.000Z"
}
```

**💡 Kiểm tra:**
- ✅ `status: "confirmed"` → Đã có confirmation
- ✅ `confirmations: [1 address]` → Có 1 confirmation
- ⏳ **Chờ thêm confirmation** (cần 2 confirmations vì threshold = 2)

---

## ✅ Bước 4: Confirm Transaction - Lần 2 (Owner #2)

### Request:

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm`

**Cùng `txId` như Bước 3:**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm
```

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "privateKey": "PRIVATE_KEY_OF_OWNER_2_FROM_GANACHE"
}
```

**Cách lấy private key:**
1. Mở Ganache App
2. Tìm account `0x7Cae68d39A4dd45a02D80935c72310F711474286` (Owner #2)
3. Click icon **key (🔑)**
4. Copy private key
5. Paste vào `privateKey` trong Postman

### Expected Response (Success - 200):

```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "txIndexOnChain": 0,
  "txHash": "0xdef4567890123456789012345678901234567890123456789012345678901234",
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "10000000000000000",
  "data": "0x",
  "status": "confirmed",
  "confirmations": [
    "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
    "0x7cae68d39a4dd45a02d80935c72310f711474286"
  ],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:10:00.000Z"
}
```

**💡 Kiểm tra:**
- ✅ `confirmations: [2 addresses]` → Có 2 confirmations
- ✅ **Đủ threshold (2)** → Có thể execute!

**⚠️ Nếu lỗi "Địa chỉ đã xác nhận":**
- Mỗi owner chỉ confirm được 1 lần
- Chọn owner khác để confirm

---

## ⚡ Bước 5: Execute Transaction (Thực thi giao dịch)

### Request:

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/transactions/{txId}/execute`

**Cùng `txId` như các bước trước:**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/execute
```

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

**⚠️ CHỈ execute được khi:**
- ✅ Đủ confirmations >= threshold (2 confirmations)
- ✅ Transaction chưa được execute

### Expected Response (Success - 200):

```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "txIndexOnChain": 0,
  "txHash": "0xghi7890123456789012345678901234567890123456789012345678901234",
  "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
  "value": "10000000000000000",
  "data": "0x",
  "status": "executed",
  "confirmations": [
    "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
    "0x7cae68d39a4dd45a02d80935c72310f711474286"
  ],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:15:00.000Z"
}
```

**💡 Kiểm tra:**
- ✅ `status: "executed"` → Giao dịch đã được thực thi!
- ✅ ETH đã được chuyển đến `destination`

**Nếu lỗi "Chưa đủ số lượng xác nhận":**
- Confirm thêm cho đến khi đủ threshold

---

## 📋 Bước 6: Get Wallet (Xem thông tin ví)

### Request:

**Method:** `GET`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}`

**Thay `{walletId}` bằng ID từ Bước 1:**
```
GET http://localhost:3001/api/v1/multisig/fa981c89-f6d3-4da9-88a4-e202fcc68dca
```

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

### Expected Response (Success - 200):

```json
{
  "id": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
  "contractAddress": "0xe78A0F7E598Cc8b0Bb87894B0F60dD2a88d6a8Ab",
  "name": "Test Wallet from Postman",
  "description": "Ví test đa chữ ký từ Postman",
  "creatorId": "123e4567-e89b-12d3-a456-426614174000",
  "owners": [
    "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
    "0x7Cae68d39A4dd45a02D80935c72310F711474286",
    "0x47dd5A8235a56570Ea4e3e5E464459406CB9C2AE",
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  ],
  "threshold": 2,
  "onChainBalance": "0.089",
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

**💡 Kiểm tra:**
- ✅ `onChainBalance`: Số dư ETH còn lại trong ví (đã trừ 0.01 ETH đã chuyển)
- ✅ `owners`: Danh sách owners
- ✅ `threshold`: Ngưỡng cần thiết

---

## 📜 Bước 7: Get Transactions (Xem danh sách giao dịch)

### Request:

**Method:** `GET`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}/transactions`

**Thay `{walletId}` bằng ID từ Bước 1:**
```
GET http://localhost:3001/api/v1/multisig/fa981c89-f6d3-4da9-88a4-e202fcc68dca/transactions
```

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

### Expected Response (Success - 200):

```json
[
  {
    "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
    "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca",
    "txIndexOnChain": 0,
    "txHash": "0xghi7890123456789012345678901234567890123456789012345678901234",
    "destination": "0xEc07D1d4Ff2D48337F1b7fa4d497c95Acd0471fB",
    "value": "10000000000000000",
    "data": "0x",
    "status": "executed",
    "confirmations": [
      "0xec07d1d4ff2d48337f1b7fa4d497c95acd0471fb",
      "0x7cae68d39a4dd45a02d80935c72310f711474286"
    ],
    "createdAt": "2025-11-03T14:00:00.000Z",
    "updatedAt": "2025-11-03T14:15:00.000Z"
  }
]
```

**💡 Kiểm tra:**
- ✅ Danh sách tất cả transactions của ví
- ✅ Mỗi transaction có `status` và `confirmations`
- ✅ Transaction đã executed có `status: "executed"`

---

## 🔄 Tổng kết Workflow

```
┌─────────────────────────────────────────────────────┐
│ Bước 0: Chuẩn bị                                    │
│ - Lấy owners từ Ganache                             │
│ - Lấy private keys từ Ganache                       │
│ - Kiểm tra Service Account                          │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 1: Tạo Ví                                      │
│ POST /api/v1/multisig                               │
│ → Lưu walletId                                      │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 2: Submit Transaction                          │
│ POST /api/v1/multisig/{walletId}/transactions      │
│ → Lưu txId                                          │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 3: Confirm lần 1 (Owner #1)                   │
│ POST /api/v1/multisig/transactions/{txId}/confirm  │
│ Body: { "privateKey": "..." }                      │
│ → confirmations: [1]                                │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 4: Confirm lần 2 (Owner #2)                   │
│ POST /api/v1/multisig/transactions/{txId}/confirm  │
│ Body: { "privateKey": "..." }                      │
│ → confirmations: [2] ✅ Đủ threshold!               │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 5: Execute Transaction                        │
│ POST /api/v1/multisig/transactions/{txId}/execute  │
│ → status: "executed" ✅                            │
└────────────────┬────────────────────────────────────┘
                 ▼
┌─────────────────────────────────────────────────────┐
│ Bước 6 & 7: Kiểm tra                               │
│ GET /api/v1/multisig/{walletId}                     │
│ GET /api/v1/multisig/{walletId}/transactions        │
└─────────────────────────────────────────────────────┘
```

---

## 📝 Postman Collection Template

Tạo Collection trong Postman với các requests sau:

### Collection: "Multisig Service"

1. **Health Check**
   - GET `http://localhost:3001/health`

2. **Create Wallet**
   - POST `http://localhost:3001/api/v1/multisig`
   - Body: `{ "name": "...", "owners": [...], "threshold": 2 }`

3. **Submit Transaction**
   - POST `http://localhost:3001/api/v1/multisig/{{walletId}}/transactions`
   - Body: `{ "destination": "...", "value": "0.01" }`

4. **Confirm Transaction #1**
   - POST `http://localhost:3001/api/v1/multisig/transactions/{{txId}}/confirm`
   - Body: `{ "privateKey": "{{owner1PrivateKey}}" }`

5. **Confirm Transaction #2**
   - POST `http://localhost:3001/api/v1/multisig/transactions/{{txId}}/confirm`
   - Body: `{ "privateKey": "{{owner2PrivateKey}}" }`

6. **Execute Transaction**
   - POST `http://localhost:3001/api/v1/multisig/transactions/{{txId}}/execute`

7. **Get Wallet**
   - GET `http://localhost:3001/api/v1/multisig/{{walletId}}`

8. **Get Transactions**
   - GET `http://localhost:3001/api/v1/multisig/{{walletId}}/transactions`

### Postman Variables:

Tạo variables trong Postman để dùng lại:
- `baseUrl`: `http://localhost:3001`
- `walletId`: (sẽ update sau khi tạo ví)
- `txId`: (sẽ update sau khi submit transaction)
- `owner1PrivateKey`: (private key của Owner #1 từ Ganache)
- `owner2PrivateKey`: (private key của Owner #2 từ Ganache)

---

## ⚠️ Lưu ý quan trọng

### 1. Service Account phải có trong owners
- ✅ Luôn thêm Service Account vào danh sách owners
- ❌ Nếu không → Lỗi khi tạo ví

### 2. Private keys chỉ dùng cho test
- ✅ CHỈ dùng trong môi trường test/development
- ❌ KHÔNG BAO GIỜ commit vào Git
- ❌ KHÔNG BAO GIỜ chia sẻ

### 3. Threshold logic
- `threshold = 2` → Cần ít nhất 2 confirmations
- Mỗi owner chỉ confirm được 1 lần
- Phải confirm từ 2 owners khác nhau

### 4. Insufficient funds
- Service Account cần >= 0.05 ETH để deploy contract
- Mỗi owner cần >= 0.1 ETH để confirm transactions
- Chạy `.\scripts\check-and-fund.ps1` nếu thiếu ETH

---

## 🎯 Quick Reference

### Thứ tự thực hiện:
1. ✅ Health Check
2. ✅ Create Wallet → Lưu `walletId`
3. ✅ Submit Transaction → Lưu `txId`
4. ✅ Confirm #1 (Owner 1) → Dùng private key của Owner 1
5. ✅ Confirm #2 (Owner 2) → Dùng private key của Owner 2
6. ✅ Execute Transaction → Khi đủ confirmations
7. ✅ Get Wallet → Kiểm tra balance
8. ✅ Get Transactions → Kiểm tra danh sách

### Variables cần lưu:
- `walletId`: Từ response Create Wallet
- `txId`: Từ response Submit Transaction
- `owner1PrivateKey`: Từ Ganache App
- `owner2PrivateKey`: Từ Ganache App

---

## 📚 File liên quan

- `POSTMAN_API.md` - Tài liệu API đầy đủ
- `GANACHE_INTEGRATION.md` - Hướng dẫn tích hợp Ganache
- `CONFIRM_WITH_PRIVATE_KEY.md` - Hướng dẫn confirm với private key
- `MULTISIG_WALLET_EXPLAINED.md` - Giải thích cách hoạt động


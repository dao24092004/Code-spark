# 📮 Postman API Collection - Multisig Service

## 🔗 Base URL
```
http://localhost:3001
```

## 📋 API Endpoints

---

### 1. Health Check

**GET** `/health`

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

**Response:**
```
UP
```

---

### 2. Tạo Ví Mới (Create Wallet)

**POST** `/api/v1/multisig`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Team Wallet",
  "description": "Ví đa chữ ký của team development",
  "owners": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x8ba1f109551bD432803012645Hac136c22C4e2",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  ],
  "threshold": 2
}
```

**⚠️ LƯU Ý QUAN TRỌNG:**
- `owners` phải bao gồm **Service Account address** (`0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` - từ logs khi server khởi động)
- `threshold` phải <= số lượng owners
- `threshold` phải >= 1

**Response (Success - 201):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "name": "Team Wallet",
  "description": "Ví đa chữ ký của team development",
  "creatorId": "123e4567-e89b-12d3-a456-426614174000",
  "owners": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x8ba1f109551bD432803012645Hac136c22C4e2",
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
  ],
  "threshold": 2,
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Service Account 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1 phải nằm trong danh sách owners để ký giao dịch"
}
```

---

### 3. Liên Kết Ví Đã Có (Link Existing Wallet)

**POST** `/api/v1/multisig/link`

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "name": "Existing Wallet",
  "description": "Liên kết ví đã deploy sẵn",
  "contractAddress": "0x1234567890123456789012345678901234567890"
}
```

**Response (Success - 201):**
```json
{
  "id": "uuid-wallet-id",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "name": "Existing Wallet",
  "description": "Liên kết ví đã deploy sẵn",
  "owners": ["0x...", "0x..."],
  "threshold": 2,
  "createdAt": "...",
  "updatedAt": "..."
}
```

---

### 4. Lấy Thông Tin Ví (Get Wallet)

**GET** `/api/v1/multisig/{walletId}`

**URL Parameters:**
- `walletId`: UUID của ví (từ response khi tạo ví)

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

**Example:**
```
GET http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000
```

**Response (Success - 200):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "contractAddress": "0x1234567890123456789012345678901234567890",
  "name": "Team Wallet",
  "description": "Ví đa chữ ký của team development",
  "creatorId": "123e4567-e89b-12d3-a456-426614174000",
  "owners": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x8ba1f109551bD432803012645Hac136c22C4e2"
  ],
  "threshold": 2,
  "onChainBalance": "0.0",
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

---

### 5. Lấy Danh Sách Giao Dịch (Get Transactions)

**GET** `/api/v1/multisig/{walletId}/transactions`

**URL Parameters:**
- `walletId`: UUID của ví

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

**Example:**
```
GET http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000/transactions
```

**Response (Success - 200):**
```json
[
  {
    "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",  // 👈 Đây là txId - dùng cho confirm/execute
    "walletId": "123e4567-e89b-12d3-a456-426614174000",
    "txIndexOnChain": 0,
    "txHash": "0xabc123...",
    "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "value": "10000000000000000",
    "data": "0x",
    "status": "submitted",
    "confirmations": [],
    "createdAt": "2025-11-03T14:00:00.000Z",
    "updatedAt": "2025-11-03T14:00:00.000Z"
  }
]
```

**💡 Lưu ý:**
- Mỗi transaction trong danh sách có field `"id"` - Đây chính là `txId`
- Bạn có thể dùng `txId` này để confirm hoặc execute transaction tương ứng

---

### 6. Submit Giao Dịch Mới (Submit Transaction)

**POST** `/api/v1/multisig/{walletId}/transactions`

**URL Parameters:**
- `walletId`: UUID của ví

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "0.01",
  "data": "0x"
}
```

**Fields:**
- `destination`: Địa chỉ nhận ETH (required)
- `value`: Số lượng ETH (trong đơn vị Ether, không phải Wei) (required)
- `data`: Data cho transaction (optional, mặc định: "0x")

**Example:**
```
POST http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000/transactions
```

**Response (Success - 201):**
```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",  // 👈 Đây là txId - LƯU LẠI để confirm/execute sau!
  "walletId": "123e4567-e89b-12d3-a456-426614174000",
  "txIndexOnChain": 0,
  "txHash": "0xabc123...",
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "10000000000000000",
  "data": "0x",
  "status": "submitted",
  "confirmations": [],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:00:00.000Z"
}
```

**⚠️ QUAN TRỌNG:** 
- **Lưu lại field `"id"`** từ response này - Đây chính là `txId` cần dùng cho Confirm (API #7) và Execute (API #8)!
- Ví dụ: `"id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0"` → Dùng `txId = 708645c2-bf9d-48ba-bd8f-2e6fdac231c0`

**Response (Error - 400):**
```json
{
  "error": "Thiếu destination hoặc value"
}
```

---

### 7. Xác Nhận Giao Dịch (Confirm Transaction)

**POST** `/api/v1/multisig/transactions/{txId}/confirm`

**URL Parameters:**
- `txId`: **UUID của transaction trong database** (không phải txHash!)

**📍 Lấy `txId` ở đâu?**
1. **Từ Response khi Submit Transaction** (API #6):
   - Submit transaction → Response có field `"id"` → Đó chính là `txId`
   - Ví dụ: `"id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0"` → Dùng `txId = 708645c2-bf9d-48ba-bd8f-2e6fdac231c0`

2. **Từ Response khi Get Transactions** (API #5):
   - Get transactions → Mỗi transaction có field `"id"` → Đó chính là `txId`

**🎯 Tác dụng của `txId`:**
- Xác định transaction cần confirm
- Mỗi transaction có một `txId` duy nhất trong database
- Không thể nhầm lẫn với `txHash` (hash trên blockchain)

**⚠️ Lưu ý:**
- `txId` ≠ `txHash` (txHash là hash trên blockchain, không dùng cho confirm)
- `txId` là UUID trong database (ví dụ: `708645c2-bf9d-48ba-bd8f-2e6fdac231c0`)

**Headers:**
```
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "privateKey": "YOUR_PRIVATE_KEY_HERE"  // Optional: Nếu không có sẽ dùng Service Account
}
```

**⚠️ Lưu ý về `privateKey`:**
- **Optional:** Nếu không gửi `privateKey`, API sẽ dùng Service Account để confirm
- **Private key từ Ganache:** Lấy từ Ganache UI hoặc logs
- **Private key từ MetaMask:** Export từ MetaMask (Settings → Security & Privacy → Show Private Key)
- **Format:** Có thể có hoặc không có prefix `0x` (cả hai đều được chấp nhận)
  - `"0xabc123..."` ✅
  - `"abc123..."` ✅

**Example 1: Confirm với private key (khuyến nghị):**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm

Body:
{
  "privateKey": "4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d"
}
```

**Example 2: Confirm với Service Account (không cần privateKey):**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm

Body: {}  // Hoặc không gửi body
```

**Response (Success - 200):**
```json
{
  "id": "tx-uuid-123",
  "walletId": "123e4567-e89b-12d3-a456-426614174000",
  "txIndexOnChain": 0,
  "txHash": "0xdef456...",
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "10000000000000000",
  "data": "0x",
  "status": "confirmed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
  ],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:01:00.000Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Service account đã xác nhận giao dịch này"
}
```

---

### 8. Thực Thi Giao Dịch (Execute Transaction)

**POST** `/api/v1/multisig/transactions/{txId}/execute`

**URL Parameters:**
- `txId`: **UUID của transaction trong database** (giống như khi confirm)

**📍 Lấy `txId` ở đâu?**
- Cùng cách như Confirm Transaction (API #7):
  1. Từ Response khi Submit Transaction (API #6) → Field `"id"`
  2. Từ Response khi Get Transactions (API #5) → Field `"id"` của mỗi transaction

**🎯 Tác dụng của `txId`:**
- Xác định transaction cần execute
- Phải là `txId` của transaction đã được confirm đủ số lượng (>= threshold)

**⚠️ LƯU Ý:**
- Chỉ execute được khi `confirmations.length >= threshold`
- Ví dụ: Nếu threshold = 2, cần ít nhất 2 confirmations
- Phải confirm transaction trước khi execute

**Headers:**
```
(none)
```

**Body:**
```
(none)
```

**Example:**
```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/execute
                                                     👆 txId từ response Submit Transaction (giống confirm)
```

**Response (Success - 200):**
```json
{
  "id": "tx-uuid-123",
  "walletId": "123e4567-e89b-12d3-a456-426614174000",
  "txIndexOnChain": 0,
  "txHash": "0xghi789...",
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "10000000000000000",
  "data": "0x",
  "status": "executed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x8ba1f109551bD432803012645Hac136c22C4e2"
  ],
  "createdAt": "2025-11-03T14:00:00.000Z",
  "updatedAt": "2025-11-03T14:02:00.000Z"
}
```

**Response (Error - 400):**
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Chưa đủ số lượng xác nhận. Cần 2, mới có 1"
}
```

---

## 📝 Postman Collection JSON

Tạo file **Postman Collection** để import trực tiếp:

1. Tạo Collection mới trong Postman
2. Import JSON sau đây:

```json
{
  "info": {
    "name": "Multisig Service API",
    "description": "API collection cho Multisig Wallet Service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:3001",
      "type": "string"
    },
    {
      "key": "walletId",
      "value": "",
      "type": "string"
    },
    {
      "key": "txId",
      "value": "",
      "type": "string"
    }
  ],
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/health",
          "host": ["{{baseUrl}}"],
          "path": ["health"]
        }
      }
    },
    {
      "name": "Create Wallet",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Team Wallet\",\n  \"description\": \"Ví đa chữ ký của team development\",\n  \"owners\": [\n    \"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1\",\n    \"0x8ba1f109551bD432803012645Hac136c22C4e2\",\n    \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\"\n  ],\n  \"threshold\": 2\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig"]
        }
      }
    },
    {
      "name": "Get Wallet",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig/{{walletId}}",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig", "{{walletId}}"]
        }
      }
    },
    {
      "name": "Get Transactions",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig/{{walletId}}/transactions",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig", "{{walletId}}", "transactions"]
        }
      }
    },
    {
      "name": "Submit Transaction",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"destination\": \"0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb\",\n  \"value\": \"0.01\",\n  \"data\": \"0x\"\n}"
        },
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig/{{walletId}}/transactions",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig", "{{walletId}}", "transactions"]
        }
      }
    },
    {
      "name": "Confirm Transaction",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig/transactions/{{txId}}/confirm",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig", "transactions", "{{txId}}", "confirm"]
        }
      }
    },
    {
      "name": "Execute Transaction",
      "request": {
        "method": "POST",
        "header": [],
        "url": {
          "raw": "{{baseUrl}}/api/v1/multisig/transactions/{{txId}}/execute",
          "host": ["{{baseUrl}}"],
          "path": ["api", "v1", "multisig", "transactions", "{{txId}}", "execute"]
        }
      }
    }
  ]
}
```

---

## 🎯 Workflow Test

### Bước 1: Health Check
```
GET http://localhost:3001/health
```
→ Kiểm tra server đang chạy

### Bước 2: Tạo Ví
```
POST http://localhost:3001/api/v1/multisig
```
→ Copy `id` từ response → Lưu vào biến `walletId`

### Bước 3: Lấy Thông Tin Ví
```
GET http://localhost:3001/api/v1/multisig/{walletId}
```
→ Kiểm tra ví đã tạo

### Bước 4: Submit Transaction
```
POST http://localhost:3001/api/v1/multisig/{walletId}/transactions
```
→ Copy `id` từ response → Lưu vào biến `txId`

### Bước 5: Confirm Transaction
```
POST http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm
```
→ Có thể confirm nhiều lần (nếu có nhiều owners)

### Bước 6: Execute Transaction (nếu đủ confirmations)
```
POST http://localhost:3001/api/v1/multisig/transactions/{txId}/execute
```
→ Chỉ execute khi `confirmations.length >= threshold`

---

## ⚠️ Lưu Ý Quan Trọng

1. **Service Account Address**: 
   - Khi server khởi động, log sẽ hiển thị: `✅ Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`
   - Address này PHẢI có trong mảng `owners` khi tạo ví

2. **Threshold Logic**:
   - Nếu `threshold = 2`, cần ít nhất 2 confirmations mới execute được
   - Mỗi owner chỉ có thể confirm 1 lần

3. **Value Format**:
   - Gửi value dưới dạng Ether (ví dụ: `"0.01"`)
   - Service sẽ tự động chuyển sang Wei

4. **Transaction Status**:
   - `submitted`: Đã submit nhưng chưa có confirmation
   - `confirmed`: Đã có ít nhất 1 confirmation
   - `executed`: Đã thực thi thành công
   - `failed`: Thất bại

---

## 🐛 Troubleshooting

### Lỗi: "Service Account phải nằm trong danh sách owners"
- **Giải pháp**: Thêm Service Account address vào mảng `owners`

### Lỗi: "Chưa đủ số lượng xác nhận"
- **Giải pháp**: Confirm thêm cho đến khi đủ threshold

### Lỗi: "Insufficient funds for gas"
- **Giải pháp**: Đảm bảo Service Account có đủ ETH trong Ganache

### Lỗi: Connection Refused
- **Giải pháp**: Kiểm tra server đang chạy tại `http://localhost:3001`

---

## 📚 Tài liệu tham khảo

- Server chạy tại: `http://localhost:3001`
- Logs server để xem Service Account address
- Ganache UI để kiểm tra transactions trên blockchain


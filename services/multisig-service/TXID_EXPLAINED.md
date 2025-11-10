# 📝 Giải thích về `txId` trong API

## 🤔 `txId` là gì?

**`txId`** (Transaction ID) là **UUID** (Universally Unique Identifier) của một transaction trong database PostgreSQL.

- **Định dạng:** UUID v4 (ví dụ: `708645c2-bf9d-48ba-bd8f-2e6fdac231c0`)
- **Vị trí lưu trữ:** Cột `id` trong bảng `MultisigTransaction` (PostgreSQL)
- **Tự động tạo:** Khi bạn **Submit Transaction** mới, hệ thống tự động tạo `txId` cho transaction đó

---

## 🎯 Tác dụng của `txId`

`txId` được dùng để:

1. **Xác định transaction cần xử lý**
   - Khi bạn muốn **confirm** hoặc **execute** một transaction
   - API cần biết bạn đang nói về transaction nào

2. **Tra cứu transaction trong database**
   - Mỗi transaction có một `txId` duy nhất
   - Không thể nhầm lẫn giữa các transactions

3. **Quản lý trạng thái transaction**
   - Theo dõi transaction từ `submitted` → `confirmed` → `executed`
   - Kiểm tra số lượng confirmations

---

## 📍 Lấy `txId` ở đâu?

Có **2 cách** để lấy `txId`:

### ✅ Cách 1: Từ Response khi Submit Transaction

Khi bạn **Submit Transaction** mới, response sẽ trả về `txId`:

```http
POST http://localhost:3001/api/v1/multisig/{walletId}/transactions
Content-Type: application/json

{
  "destination": "0xe9ee7518d77b438d72c1f1fc15c35fce80e7752b",
  "value": "0.01"
}
```

**Response:**
```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",  // 👈 Đây là txId
  "txIndexOnChain": 0,
  "txHash": "0xc44c653f85fb1de97f74983e659a24c8f133d275b561c84dfcfa1ba7816c446a",
  "destination": "0xe9ee7518d77b438d72c1f1fc15c35fce80e7752b",
  "value": "10000000000000000",
  "data": "0x",
  "status": "submitted",
  "confirmations": [],
  "createdAt": "2025-11-03T09:13:36.358Z",
  "updatedAt": "2025-11-03T09:13:36.358Z",
  "walletId": "fa981c89-f6d3-4da9-88a4-e202fcc68dca"
}
```

👉 **Lưu lại `id`** để dùng cho các bước tiếp theo!

---

### ✅ Cách 2: Từ Response khi Get Transactions

Lấy danh sách transactions của một wallet, mỗi transaction có `id` (txId):

```http
GET http://localhost:3001/api/v1/multisig/{walletId}/transactions
```

**Response:**
```json
[
  {
    "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",  // 👈 txId
    "status": "submitted",
    "destination": "0xe9ee7518d77b438d72c1f1fc15c35fce80e7752b",
    "value": "10000000000000000",
    "confirmations": []
  },
  {
    "id": "da7771ed-e4a1-470e-bc03-60429c8ea871",  // 👈 txId khác
    "status": "confirmed",
    "destination": "0xe9ee7518d77b438d72c1f1fc15c35fce80e7752b",
    "value": "20000000000000000",
    "confirmations": ["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"]
  }
]
```

---

## 🔄 Workflow sử dụng `txId`

### Ví dụ thực tế:

```mermaid
graph LR
    A[Submit Transaction] --> B[Nhận txId]
    B --> C[Confirm Transaction]
    C --> D[Execute Transaction]
```

**Bước 1: Submit Transaction**
```bash
POST http://localhost:3001/api/v1/multisig/fa981c89-f6d3-4da9-88a4-e202fcc68dca/transactions
Body: { "destination": "0x...", "value": "0.01" }

Response: { "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0", ... }
         👆 Lưu lại txId này!
```

**Bước 2: Confirm Transaction (dùng txId từ bước 1)**
```bash
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm
                                           👆 txId từ bước 1
```

**Bước 3: Execute Transaction (dùng txId từ bước 1)**
```bash
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/execute
                                           👆 txId từ bước 1
```

---

## 🧪 Test thực tế với Postman

### 1️⃣ Submit Transaction và lấy txId:

```
POST http://localhost:3001/api/v1/multisig/fa981c89-f6d3-4da9-88a4-e202fcc68dca/transactions

Body (JSON):
{
  "destination": "0xe9ee7518d77b438d72c1f1fc15c35fce80e7752b",
  "value": "0.01"
}

Response:
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0"  👈 Copy txId này
}
```

### 2️⃣ Dùng txId để Confirm:

```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/confirm
                                                      👆 Paste txId vào đây
```

### 3️⃣ Dùng txId để Execute:

```
POST http://localhost:3001/api/v1/multisig/transactions/708645c2-bf9d-48ba-bd8f-2e6fdac231c0/execute
                                                      👆 Paste txId vào đây
```

---

## ⚠️ Lưu ý quan trọng

### ✅ Đúng:
- `txId` là UUID trong database (ví dụ: `708645c2-bf9d-48ba-bd8f-2e6fdac231c0`)
- Lấy từ response khi submit transaction hoặc get transactions
- Mỗi transaction có một `txId` duy nhất

### ❌ Sai:
- **KHÔNG phải** `txHash` (hash trên blockchain)
- **KHÔNG phải** `txIndexOnChain` (index trên contract)
- **KHÔNG phải** `walletId` (ID của ví)

---

## 📊 So sánh các ID liên quan

| Loại ID | Ví dụ | Mục đích |
|---------|-------|----------|
| **txId** (Transaction ID) | `708645c2-bf9d-48ba-bd8f-2e6fdac231c0` | ID trong database, dùng để confirm/execute |
| **txHash** | `0xc44c653f85fb1de97f74983e659a24c8f133d275b561c84dfcfa1ba7816c446a` | Hash trên blockchain |
| **txIndexOnChain** | `0` | Index trong mảng transactions của contract |
| **walletId** | `fa981c89-f6d3-4da9-88a4-e202fcc68dca` | ID của ví trong database |

---

## 💡 Tóm tắt

1. **`txId` là gì?** → UUID của transaction trong database
2. **Tác dụng?** → Xác định transaction cần confirm/execute
3. **Lấy ở đâu?** → 
   - ✅ Response khi Submit Transaction (`id` field)
   - ✅ Response khi Get Transactions (`id` field trong mỗi transaction)

---

## 🚀 Quick Reference

```javascript
// 1. Submit transaction
const submitResponse = await fetch(
  'http://localhost:3001/api/v1/multisig/{walletId}/transactions',
  { method: 'POST', body: {...} }
);
const { id: txId } = await submitResponse.json();
// 👆 Lưu txId

// 2. Confirm transaction
await fetch(
  `http://localhost:3001/api/v1/multisig/transactions/${txId}/confirm`,
  { method: 'POST' }
);

// 3. Execute transaction
await fetch(
  `http://localhost:3001/api/v1/multisig/transactions/${txId}/execute`,
  { method: 'POST' }
);
```


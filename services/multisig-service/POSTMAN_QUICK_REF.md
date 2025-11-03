# ⚡ Postman Quick Reference - Multisig Service

## 🔗 Base URL
```
http://localhost:3001
```

---

## 📋 Quick API Examples

### ✅ 1. Health Check
```
GET http://localhost:3001/health
```

---

### ✅ 2. Tạo Ví Mới

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig`  
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "name": "My Wallet",
  "description": "Ví của tôi",
  "owners": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x8ba1f109551bD432803012645Hac136c22C4e2"
  ],
  "threshold": 2
}
```

**⚠️ QUAN TRỌNG:** Thay `0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1` bằng **Service Account address** từ server logs khi khởi động.

**Copy `id` từ response để dùng cho các request tiếp theo!**

---

### ✅ 3. Xem Thông Tin Ví

**Method:** `GET`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}`

**Ví dụ:**
```
GET http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000
```

**Thay `{walletId}` bằng `id` từ bước 2!**

---

### ✅ 4. Submit Giao Dịch

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}/transactions`  
**Headers:** `Content-Type: application/json`

**Body:**
```json
{
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "0.01"
}
```

**Ví dụ:**
```
POST http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000/transactions
```

**Copy `id` từ response để dùng cho confirm/execute!**

---

### ✅ 5. Confirm Giao Dịch

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/transactions/{txId}/confirm`

**Ví dụ:**
```
POST http://localhost:3001/api/v1/multisig/transactions/tx-uuid-123/confirm
```

**Thay `{txId}` bằng `id` từ bước 4!**

**Có thể confirm nhiều lần (nếu có nhiều owners) để đạt threshold.**

---

### ✅ 6. Execute Giao Dịch

**Method:** `POST`  
**URL:** `http://localhost:3001/api/v1/multisig/transactions/{txId}/execute`

**Ví dụ:**
```
POST http://localhost:3001/api/v1/multisig/transactions/tx-uuid-123/execute
```

**⚠️ CHỈ execute được khi đủ confirmations (>= threshold)!**

---

### ✅ 7. Xem Danh Sách Giao Dịch

**Method:** `GET`  
**URL:** `http://localhost:3001/api/v1/multisig/{walletId}/transactions`

**Ví dụ:**
```
GET http://localhost:3001/api/v1/multisig/123e4567-e89b-12d3-a456-426614174000/transactions
```

---

## 🎯 Workflow Test Đơn Giản

1. **Health Check** → Kiểm tra server chạy
2. **Tạo Ví** → Copy `id` → Đây là `walletId`
3. **Submit Transaction** → Copy `id` → Đây là `txId`
4. **Confirm Transaction** (có thể nhiều lần nếu threshold > 1)
5. **Execute Transaction** (chỉ khi đủ confirmations)

---

## 💡 Lấy Service Account Address

Khi server khởi động, bạn sẽ thấy trong logs:
```
✅ Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
```

**Địa chỉ này PHẢI có trong mảng `owners` khi tạo ví!**

---

## 📝 Postman Environment Variables

Tạo variables trong Postman để dễ dàng:

- `baseUrl` = `http://localhost:3001`
- `walletId` = (sẽ update sau khi tạo ví)
- `txId` = (sẽ update sau khi submit transaction)

Sau đó dùng: `{{baseUrl}}/api/v1/multisig/{{walletId}}`


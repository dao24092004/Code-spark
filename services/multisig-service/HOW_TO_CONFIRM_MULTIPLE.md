# 🔐 Hướng dẫn: Xác nhận thêm để đạt Threshold

## ❓ Vấn đề

Bạn đã confirm 1 lần nhưng threshold = 2, nên cần **thêm 1 confirmation nữa** để execute.

**Lỗi gặp phải:**
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Chưa đủ số lượng xác nhận. Cần 2, mới có 1"
}
```

---

## ⚠️ Hạn chế hiện tại

**Trong code hiện tại:**
- API `confirmTransaction` **chỉ dùng Service Account** để confirm
- Service Account chỉ có thể confirm **1 lần** cho mỗi transaction
- **Không thể** confirm lại từ cùng một địa chỉ

---

## ✅ Giải pháp

### Cách 1: Confirm thêm từ Service Account (Không khả thi)

❌ **KHÔNG THỂ** vì Service Account đã confirm rồi. Code sẽ báo lỗi:
```
"Service account đã xác nhận giao dịch này"
```

### Cách 2: Dùng các Owners khác (Cần sửa code)

Để confirm từ owners khác, bạn cần:
1. Sửa API để nhận `ownerAddress` từ request body
2. Cho phép owners khác confirm (không chỉ Service Account)

**Hiện tại:**
- Chỉ Service Account có private key → Chỉ Service Account có thể sign transaction
- Các owners khác **không thể confirm** vì không có private key của họ

### Cách 3: Test nhanh - Cập nhật Database trực tiếp

⚠️ **CHỈ DÙNG CHO TEST, KHÔNG DÙNG TRONG PRODUCTION!**

**Cách làm:**
1. Lấy danh sách owners từ ví
2. Lấy một owner khác (không phải Service Account)
3. Cập nhật trực tiếp vào database PostgreSQL

**Ví dụ SQL:**
```sql
-- Lấy một owner khác (ví dụ owner thứ 2 trong danh sách)
UPDATE "MultisigTransactions"
SET 
    "confirmations" = ARRAY_APPEND("confirmations", '0x86927d46c63029ae5865c994a0f2dfbe03ac6268'),
    "status" = 'confirmed',
    "updatedAt" = NOW()
WHERE id = 'c77db38c-6531-41fe-a9e9-283f1c75cdcc';  -- Thay bằng txId của bạn
```

**Kiểm tra sau khi update:**
```sql
SELECT id, confirmations, status 
FROM "MultisigTransactions" 
WHERE id = 'c77db38c-6531-41fe-a9e9-283f1c75cdcc';
```

**Kết quả mong đợi:**
```
confirmations = ['0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1', '0x86927d46c63029ae5865c994a0f2dfbe03ac6268']
status = 'confirmed'
```

Sau đó bạn có thể gọi API Execute và nó sẽ thành công! ✅

---

## 📋 Hướng dẫn thực tế

### Bước 1: Kiểm tra transaction hiện tại

```sql
-- Kết nối PostgreSQL (qua Docker)
docker exec -it postgres-db psql -U postgres -d multisig_db

-- Kiểm tra transaction
SELECT id, confirmations, status, "txIndexOnChain"
FROM "MultisigTransactions" 
WHERE id = 'YOUR_TX_ID_HERE';
```

### Bước 2: Lấy danh sách owners

```sql
-- Lấy wallet ID từ transaction
SELECT "walletId" FROM "MultisigTransactions" WHERE id = 'YOUR_TX_ID_HERE';

-- Lấy owners từ wallet
SELECT owners FROM "MultisigWallets" WHERE id = 'YOUR_WALLET_ID_HERE';
```

### Bước 3: Chọn owner khác để confirm

Ví dụ owners: `["0xABC...", "0xDEF...", "0x123..."]`
- Service Account đã confirm: `0xABC...`
- Chọn owner khác: `0xDEF...` hoặc `0x123...`

### Bước 4: Cập nhật database

```sql
UPDATE "MultisigTransactions"
SET 
    "confirmations" = ARRAY_APPEND("confirmations", '0xDEF...'),  -- Owner khác
    "status" = 'confirmed',
    "updatedAt" = NOW()
WHERE id = 'YOUR_TX_ID_HERE';
```

### Bước 5: Verify và Execute

```sql
-- Kiểm tra lại
SELECT confirmations, status FROM "MultisigTransactions" WHERE id = 'YOUR_TX_ID_HERE';
```

Bây giờ bạn có thể gọi API Execute và nó sẽ thành công! ✅

---

## 🎯 Production Solution (Tương lai)

Trong production, để confirm từ owners khác, bạn cần:

1. **Frontend:** Owners dùng MetaMask/web3 để sign transaction
2. **API:** Nhận signature từ frontend
3. **Backend:** Verify signature và cập nhật database
4. **Blockchain:** Owner tự ký transaction và gửi lên chain

**Ví dụ workflow:**
```
Owner → Frontend (MetaMask) → Sign Transaction → API → Backend → Database
```

---

## 📝 Tóm tắt

### Hiện tại:
- ✅ Confirm 1 lần từ Service Account → OK
- ❌ Không thể confirm thêm từ Service Account (đã confirm rồi)
- ❌ Không thể confirm từ owners khác (chưa có chức năng này)

### Giải pháp Test:
- ✅ Cập nhật database trực tiếp để thêm confirmation
- ⚠️ Chỉ dùng cho test, không dùng trong production

### Giải pháp Production:
- ✅ Frontend dùng MetaMask để owners sign transaction
- ✅ API nhận signature và verify
- ✅ Lưu vào database và blockchain

---

**File liên quan:**
- `MULTISIG_WALLET_EXPLAINED.md` - Giải thích chi tiết cách hoạt động
- `TEST_RESULTS.md` - Kết quả test API


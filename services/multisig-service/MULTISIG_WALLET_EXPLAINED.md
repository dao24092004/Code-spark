# 📚 Giải thích chi tiết: Multisig Wallet và API Confirm/Execute

## 🎯 Multisig Wallet là gì?

**Multisig Wallet** (Ví đa chữ ký) là một loại ví Ethereum **yêu cầu nhiều chữ ký** (confirmations) từ các owners trước khi có thể thực thi một giao dịch.

### Ví dụ thực tế:
- **Ví thường:** 1 người có quyền → ký 1 lần → giao dịch được thực thi
- **Multisig Wallet:** 3 người có quyền → cần **ít nhất 2 người ký** (threshold = 2) → giao dịch mới được thực thi

---

## 🔐 Các thành phần chính

### 1. **Owners** (Chủ sở hữu)
- Danh sách các địa chỉ Ethereum có quyền quản lý ví
- Ví dụ: `["0xABC...", "0xDEF...", "0x123..."]` (3 owners)

### 2. **Threshold** (Ngưỡng)
- Số lượng **tối thiểu** confirmations cần thiết để thực thi giao dịch
- Ví dụ: `threshold = 2` → cần **ít nhất 2 confirmations**
- Phải thỏa: `1 <= threshold <= số lượng owners`

### 3. **Smart Contract** (Hợp đồng thông minh)
- Code Solidity chạy trên blockchain
- Quản lý owners, threshold, transactions, confirmations
- Đảm bảo logic multisig được thực thi đúng

---

## 📊 Kiến trúc hệ thống

```
┌─────────────────┐
│  Postman/API    │
│   (Client)      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Node.js Service │  ◄─── PostgreSQL Database
│ (Backend API)   │      (Lưu thông tin ví, transactions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Contract │  ◄─── Ganache (Local Blockchain)
│ MultiSigWallet  │      (Chứa logic multisig, confirmations)
└─────────────────┘
```

### Hai nguồn dữ liệu:
1. **PostgreSQL Database:** Lưu metadata (tên ví, mô tả, owners, threshold)
2. **Blockchain (Smart Contract):** Lưu logic thực thi (transactions, confirmations, execute)

---

## 🔄 Luồng hoạt động từ đầu đến cuối

### Bước 1: Tạo Ví (Create Wallet)

```
POST /api/v1/multisig
{
  "owners": ["0xABC...", "0xDEF...", "0x123..."],
  "threshold": 2
}
```

**Điều gì xảy ra:**
1. ✅ Deploy Smart Contract lên blockchain với `owners` và `threshold`
2. ✅ Lưu thông tin ví vào PostgreSQL
3. ✅ Trả về `walletId` và `contractAddress`

**Kết quả:**
- Trên Blockchain: Smart Contract đã được deploy
- Trong Database: Record ví mới với owners và threshold

---

### Bước 2: Submit Transaction (Đề xuất giao dịch)

```
POST /api/v1/multisig/{walletId}/transactions
{
  "destination": "0xXYZ...",
  "value": "0.01"
}
```

**Điều gì xảy ra:**
1. ✅ Service Account (owner) gọi function `submitTransaction()` trên Smart Contract
2. ✅ Smart Contract **tạo transaction mới** trong mảng `transactions[]`
   - Transaction chưa được execute (`executed = false`)
   - Chưa có confirmations (`numConfirmations = 0`)
3. ✅ Lưu transaction vào PostgreSQL với:
   - `status = "submitted"` (đã đề xuất)
   - `confirmations = []` (chưa ai confirm)
   - `txIndexOnChain = 0` (index của transaction trong contract)

**Trạng thái sau bước này:**
- ✅ Transaction đã được **tạo** (nhưng chưa được execute)
- ⚠️ Chưa có confirmations nào
- ⏳ Chờ confirmations để đạt threshold

---

## 🔍 Bước 5: Confirm Transaction (Xác nhận giao dịch)

### API:
```
POST /api/v1/multisig/transactions/{txId}/confirm
```

### Giải thích chi tiết:

#### **1. Mục đích:**
- **Owner xác nhận** rằng họ đồng ý với giao dịch đã được submit
- Mỗi owner chỉ có thể confirm **1 lần** cho mỗi transaction
- Cần **đủ số confirmations >= threshold** thì mới có thể execute

#### **2. Điều gì xảy ra trong code:**

```javascript
// File: src/services/multisig.service.js

const confirmExistingTransaction = async (transactionId) => {
    // 1. Tìm transaction trong database
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'  // Lấy thông tin ví (owners, threshold)
    });
    
    // 2. Kiểm tra Service Account đã confirm chưa
    const serviceAddress = account.address; // Service Account address
    if (tx.confirmations.includes(serviceAddress)) {
        throw new Error('Service account đã xác nhận giao dịch này');
    }
    
    // 3. Gọi Smart Contract để confirm trên blockchain
    const txHash = await blockchainService.confirmTransaction(
        tx.wallet.contractAddress,  // Địa chỉ contract
        tx.txIndexOnChain            // Index của transaction trong contract
    );
    
    // 4. Cập nhật database
    tx.confirmations = [...tx.confirmations, serviceAddress]; // Thêm Service Account vào confirmations
    tx.status = 'confirmed';
    tx.txHash = txHash;
    await tx.save();
    
    return tx;
};
```

#### **3. Điều gì xảy ra trên Smart Contract:**

```solidity
// File: src/contracts/MultiSigWallet.sol

function confirmTransaction(uint _txIndex) public onlyOwner {
    Transaction storage tx = transactions[_txIndex];
    
    // 1. Đánh dấu owner này đã confirm
    tx.isConfirmed[msg.sender] = true;
    
    // 2. Tăng số lượng confirmations
    tx.numConfirmations++;
    
    // 3. Emit event
    emit TransactionConfirmed(_txIndex, msg.sender);
}
```

#### **4. Ví dụ cụ thể:**

**Tình huống:**
- Ví có 3 owners: `["0xABC", "0xDEF", "0x123"]`
- Threshold = 2
- Transaction đã được submit

**Sau khi Confirm lần 1:**
```
✅ Owner 0xABC confirm → numConfirmations = 1
⏳ Chờ thêm confirmations (cần 2, hiện có 1)
```

**Sau khi Confirm lần 2:**
```
✅ Owner 0xABC confirm → numConfirmations = 1
✅ Owner 0xDEF confirm → numConfirmations = 2
✅ Đủ threshold (2) → Có thể execute!
```

#### **5. Response từ API:**

```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "status": "confirmed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"  // Service Account
  ],
  "txHash": "0x..."
}
```

**⚠️ Lưu ý quan trọng:**
- Trong code hiện tại, **chỉ Service Account có thể confirm** (vì chỉ có Service Account có private key)
- Nếu threshold = 2, cần **confirm 2 lần từ Service Account** hoặc từ các owners khác
- **Mỗi owner chỉ confirm được 1 lần** (không thể confirm 2 lần từ cùng 1 address)

---

## ⚡ Bước 6: Execute Transaction (Thực thi giao dịch)

### API:
```
POST /api/v1/multisig/transactions/{txId}/execute
```

### Giải thích chi tiết:

#### **1. Mục đích:**
- **Thực thi** giao dịch đã được submit và đã có đủ confirmations
- Chuyển ETH từ ví multisig đến địa chỉ `destination`
- Chỉ thực thi được khi `confirmations.length >= threshold`

#### **2. Điều gì xảy ra trong code:**

```javascript
// File: src/services/multisig.service.js

const executeExistingTransaction = async (transactionId) => {
    // 1. Tìm transaction trong database
    const tx = await MultisigTransaction.findOne({
        where: { id: transactionId },
        include: 'wallet'  // Lấy threshold
    });
    
    // 2. Kiểm tra đã execute chưa
    if (tx.status === 'executed') {
        throw new Error('Giao dịch đã được thực thi');
    }
    
    // 3. ⚠️ KIỂM TRA QUAN TRỌNG: Đủ confirmations chưa?
    if (tx.confirmations.length < tx.wallet.threshold) {
        throw new Error(`Chưa đủ số lượng xác nhận. Cần ${tx.wallet.threshold}, mới có ${tx.confirmations.length}`);
    }
    
    // 4. Gọi Smart Contract để execute trên blockchain
    const txHash = await blockchainService.executeTransaction(
        tx.wallet.contractAddress,
        tx.txIndexOnChain
    );
    
    // 5. Cập nhật database
    tx.status = 'executed';
    tx.txHash = txHash;
    await tx.save();
    
    return tx;
};
```

#### **3. Điều gì xảy ra trên Smart Contract:**

```solidity
// File: src/contracts/MultiSigWallet.sol

function executeTransaction(uint _txIndex) public onlyOwner {
    Transaction storage tx = transactions[_txIndex];
    
    // 1. ⚠️ KIỂM TRA: Đủ confirmations chưa?
    require(
        tx.numConfirmations >= requiredConfirmations, 
        "Not enough confirmations"
    );
    
    // 2. Đánh dấu transaction đã được execute
    tx.executed = true;
    
    // 3. THỰC THI: Gửi ETH đến destination
    (bool success, ) = tx.to.call{value: tx.value}(tx.data);
    require(success, "Transaction execution failed");
    
    // 4. Emit event
    emit TransactionExecuted(_txIndex, msg.sender);
}
```

#### **4. Ví dụ cụ thể:**

**Trước khi Execute:**
```
Ví multisig có: 0.1 ETH
Transaction: gửi 0.01 ETH đến 0xXYZ...
Confirmations: 2/2 ✅ (đủ threshold = 2)
Status: "confirmed" ⏳
```

**Sau khi Execute:**
```
Ví multisig còn: 0.09 ETH (0.1 - 0.01)
Transaction đã gửi: 0.01 ETH đến 0xXYZ... ✅
Status: "executed" ✅
```

#### **5. Response từ API:**

**Khi thành công:**
```json
{
  "id": "708645c2-bf9d-48ba-bd8f-2e6fdac231c0",
  "status": "executed",
  "confirmations": [
    "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
    "0x86927d46c63029ae5865c994a0f2dfbe03ac6268"
  ],
  "txHash": "0x..."
}
```

**Khi chưa đủ confirmations (Lỗi 400):**
```json
{
  "error": "Lỗi nghiệp vụ hoặc Blockchain",
  "message": "Chưa đủ số lượng xác nhận. Cần 2, mới có 1"
}
```

---

## 🔄 Luồng hoạt động hoàn chỉnh

### Scenario: Ví có 3 owners, threshold = 2

```
┌─────────────────────────────────────────────────────────┐
│ 1. CREATE WALLET                                        │
│    Owners: [0xABC, 0xDEF, 0x123]                       │
│    Threshold: 2                                        │
│    → Deploy contract, lưu DB                           │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 2. SUBMIT TRANSACTION                                   │
│    Gửi 0.01 ETH đến 0xXYZ                              │
│    → Contract tạo transaction (index = 0)              │
│    → DB: status = "submitted", confirmations = []      │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 3. CONFIRM (Lần 1) - Owner 0xABC                      │
│    → Contract: numConfirmations = 1                    │
│    → DB: confirmations = [0xABC], status = "confirmed" │
│    ⏳ Chờ thêm confirmation (cần 2, có 1)             │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 4. CONFIRM (Lần 2) - Owner 0xDEF                       │
│    → Contract: numConfirmations = 2                    │
│    → DB: confirmations = [0xABC, 0xDEF]                │
│    ✅ Đủ threshold (2 confirmations)                  │
└─────────────────────────────────────────────────────────┘
                          ▼
┌─────────────────────────────────────────────────────────┐
│ 5. EXECUTE TRANSACTION                                  │
│    → Contract kiểm tra: 2 >= 2 ✅                      │
│    → Contract gửi 0.01 ETH đến 0xXYZ                   │
│    → DB: status = "executed"                            │
│    ✅ Giao dịch hoàn tất!                              │
└─────────────────────────────────────────────────────────┘
```

---

## ❓ Câu hỏi thường gặp

### Q1: Tại sao cần threshold?
**A:** Để đảm bảo an toàn. Không phải 1 người có thể tự ý thực thi giao dịch. Cần sự đồng thuận từ nhiều owners.

### Q2: Confirm và Execute khác nhau như thế nào?
**A:**
- **Confirm:** Chỉ là "đồng ý" với giao dịch, chưa chuyển ETH
- **Execute:** Thực sự **chuyển ETH** đến destination (chỉ khi đủ confirmations)

### Q3: Nếu threshold = 2 nhưng chỉ có 1 confirmation, có thể execute không?
**A:** ❌ **KHÔNG**. Phải đủ `confirmations >= threshold` mới execute được.

### Q4: Tại sao có 2 nơi lưu (Database và Blockchain)?
**A:**
- **Database:** Lưu metadata, dễ query, tốc độ nhanh
- **Blockchain:** Đảm bảo tính minh bạch, không thể gian lận, logic được thực thi đúng

### Q5: Một owner có thể confirm 2 lần không?
**A:** ❌ **KHÔNG**. Mỗi owner chỉ confirm được **1 lần** cho mỗi transaction.

---

## 📝 Tóm tắt

### Confirm Transaction (Bước 5):
1. ✅ Owner xác nhận đồng ý với giao dịch
2. ✅ Tăng số lượng confirmations lên
3. ✅ Lưu vào database và blockchain
4. ⚠️ Chưa chuyển ETH (chỉ là "đồng ý")

### Execute Transaction (Bước 6):
1. ✅ Kiểm tra đủ confirmations >= threshold
2. ✅ Smart Contract **thực sự chuyển ETH**
3. ✅ Đánh dấu transaction đã executed
4. ✅ Không thể execute lại (transaction đã hoàn tất)

---

## 🎯 Kết luận

Multisig Wallet đảm bảo **an toàn** bằng cách yêu cầu **nhiều chữ ký** trước khi thực thi giao dịch. Đây là cách hoạt động:

1. **Submit** → Tạo giao dịch mới (chưa execute)
2. **Confirm** → Owners đồng ý (tăng confirmations)
3. **Execute** → Thực thi giao dịch khi đủ confirmations

Mỗi bước đều được lưu trên cả **Database** và **Blockchain** để đảm bảo tính toàn vẹn!


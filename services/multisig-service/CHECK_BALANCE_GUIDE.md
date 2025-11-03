# 💰 Hướng dẫn: Kiểm tra và Lấy ETH từ Ganache

## 📋 Tổng quan

Hướng dẫn chi tiết cách kiểm tra balance ETH của các accounts trong Ganache và cách chuyển ETH vào Service Account.

---

## 🔍 Cách 1: Kiểm tra Balance (Script tự động)

### Sử dụng script `check-balance.ps1`:

```powershell
cd services/multisig-service
.\scripts\check-balance.ps1
```

**Script này sẽ:**
1. ✅ Lấy danh sách tất cả accounts từ Ganache
2. ✅ Hiển thị balance của từng account
3. ✅ Tính tổng balance
4. ✅ Kiểm tra riêng Service Account
5. ✅ Cảnh báo nếu Service Account thiếu ETH

**Output mẫu:**
```
💰 Kiểm tra Balance ETH từ Ganache
RPC URL: http://localhost:7545

============================================================

📋 Đang lấy danh sách accounts...
✅ Tìm thấy 10 accounts

📊 Balance của các accounts:
============================================================

Account #1: 0x86927d46c63029ae5865c994a0f2dfbe03ac6268
  Balance: 99.89405548 ETH

Account #2: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
  Balance: 0.1059145 ETH

...

============================================================
Total Balance: 999.5 ETH

🔍 Kiểm tra Service Account:
Service Account: 0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1
Balance: 0.1059145 ETH
✅ Service Account có đủ ETH!
```

---

## 💰 Cách 2: Lấy ETH từ Ganache (Script tự động)

### Sử dụng script `get-eth-from-ganache.ps1`:

```powershell
cd services/multisig-service

# Chuyển 100 ETH từ account đầu tiên (index 0)
.\scripts\get-eth-from-ganache.ps1

# Chuyển 50 ETH từ account thứ 2 (index 1)
.\scripts\get-eth-from-ganache.ps1 -FromAccountIndex 1 -AmountInEth 50

# Chuyển 200 ETH từ account thứ 3 (index 2)
.\scripts\get-eth-from-ganache.ps1 -FromAccountIndex 2 -AmountInEth 200
```

**Parameters:**
- `-FromAccountIndex`: Index của account trong Ganache (mặc định: 0)
- `-AmountInEth`: Số lượng ETH muốn chuyển (mặc định: 100)

**Script này sẽ:**
1. ✅ Kiểm tra balance của fromAccount
2. ✅ Xác nhận có đủ ETH
3. ✅ Chuyển ETH vào Service Account
4. ✅ Kiểm tra balance mới của Service Account

---

## 🔧 Cách 3: Kiểm tra Balance thủ công (PowerShell)

### 1. Kiểm tra một account cụ thể:

```powershell
$rpcUrl = "http://localhost:7545"
$accountAddress = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"

# Lấy balance
$body = @{
    jsonrpc = "2.0"
    method = "eth_getBalance"
    params = @($accountAddress, "latest")
    id = 1
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri $rpcUrl `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$balanceWei = [Convert]::ToInt64($resp.result, 16)
$balanceEth = $balanceWei / 1000000000000000000

Write-Host "Balance: $balanceEth ETH"
```

### 2. Lấy danh sách accounts:

```powershell
$rpcUrl = "http://localhost:7545"

$body = @{
    jsonrpc = "2.0"
    method = "eth_accounts"
    params = @()
    id = 1
} | ConvertTo-Json

$resp = Invoke-RestMethod -Uri $rpcUrl `
    -Method POST `
    -ContentType "application/json" `
    -Body $body

$accounts = $resp.result
foreach ($account in $accounts) {
    Write-Host $account
}
```

### 3. Kiểm tra balance của tất cả accounts:

```powershell
$rpcUrl = "http://localhost:7545"

# Lấy accounts
$accountsBody = @{
    jsonrpc = "2.0"
    method = "eth_accounts"
    params = @()
    id = 1
} | ConvertTo-Json

$accountsResp = Invoke-RestMethod -Uri $rpcUrl `
    -Method POST `
    -ContentType "application/json" `
    -Body $accountsBody

$accounts = $accountsResp.result

# Kiểm tra balance của từng account
foreach ($account in $accounts) {
    $balanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($account, "latest")
        id = 1
    } | ConvertTo-Json

    $balanceResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody

    $balanceWei = [Convert]::ToInt64($balanceResp.result, 16)
    $balanceEth = $balanceWei / 1000000000000000000

    Write-Host "$account : $balanceEth ETH"
}
```

---

## 🖥️ Cách 4: Dùng Ganache GUI

### Kiểm tra Balance:

1. Mở **Ganache GUI**
2. Xem danh sách accounts ở bên trái
3. Balance của mỗi account hiển thị bên cạnh address
4. Click vào account để xem chi tiết

### Chuyển ETH:

1. Click vào account **nguồn** (account có nhiều ETH)
2. Click tab **"Send Transaction"** hoặc click icon **gửi**
3. Chọn **Service Account** (`0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1`) làm **đích**
4. Nhập số lượng ETH muốn chuyển (ví dụ: 100)
5. Click **"Send Transaction"**
6. Xác nhận và chờ transaction hoàn tất

---

## 🌐 Cách 5: Dùng cURL

### Kiểm tra Balance:

```bash
# Kiểm tra một account
curl -X POST http://localhost:7545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_getBalance",
    "params":["0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1", "latest"],
    "id":1
  }'
```

### Lấy danh sách Accounts:

```bash
curl -X POST http://localhost:7545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_accounts",
    "params":[],
    "id":1
  }'
```

### Chuyển ETH:

```bash
# Chuyển 100 ETH từ account 0 sang Service Account
curl -X POST http://localhost:7545 \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc":"2.0",
    "method":"eth_sendTransaction",
    "params":[{
      "from":"0x86927d46c63029ae5865c994a0f2dfbe03ac6268",
      "to":"0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1",
      "value":"0x16345785D8A0000"
    }],
    "id":2
  }'
```

**Lưu ý:** 
- `value` phải là hex (0x...)
- `0x16345785D8A0000` = 100 ETH trong hex

---

## 🎯 Chuyển đổi ETH ↔ Wei ↔ Hex

### ETH → Wei:
```
1 ETH = 1,000,000,000,000,000,000 wei (10^18)
```

**PowerShell:**
```powershell
$eth = 100
$wei = $eth * 1000000000000000000
Write-Host "$wei wei"
```

### Wei → Hex (cho RPC calls):
```powershell
$wei = 100000000000000000000  # 100 ETH
$hex = "0x" + $wei.ToString("X")
Write-Host $hex  # 0x16345785D8A0000
```

### Wei → ETH:
```powershell
$wei = [Convert]::ToInt64("0x16345785D8A0000", 16)
$eth = $wei / 1000000000000000000
Write-Host "$eth ETH"
```

---

## ⚡ Quick Commands

### Kiểm tra nhanh Service Account:
```powershell
cd services/multisig-service
.\scripts\check-balance.ps1 | Select-String "Service Account" -Context 0,3
```

### Chuyển nhanh 100 ETH:
```powershell
cd services/multisig-service
.\scripts\get-eth-from-ganache.ps1
```

### Kiểm tra và tự động chuyển nếu thiếu:
```powershell
cd services/multisig-service
.\scripts\check-and-fund.ps1
```

---

## 📊 Format Response từ Ganache

### Balance (Wei trong hex):
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": "0x16345785d8a0000"  // 100 ETH = 100000000000000000000 wei
}
```

**Chuyển đổi:**
```powershell
$hex = "0x16345785d8a0000"
$wei = [Convert]::ToInt64($hex, 16)
$eth = $wei / 1000000000000000000
# Kết quả: 100 ETH
```

---

## 🚨 Troubleshooting

### Lỗi: "Connection refused"
**Nguyên nhân:** Ganache không chạy hoặc RPC URL sai

**Giải pháp:**
```powershell
# Kiểm tra Ganache đang chạy
docker ps | Select-String "ganache"

# Hoặc kiểm tra port
Test-NetConnection -ComputerName localhost -Port 7545
```

### Lỗi: "insufficient funds"
**Nguyên nhân:** Account nguồn không đủ ETH

**Giải pháp:**
```powershell
# Kiểm tra balance trước
.\scripts\check-balance.ps1

# Chọn account khác có nhiều ETH hơn
.\scripts\get-eth-from-ganache.ps1 -FromAccountIndex 0
```

### Lỗi: "Account index không tồn tại"
**Nguyên nhân:** Index vượt quá số lượng accounts

**Giải pháp:**
```powershell
# Kiểm tra số lượng accounts
$body = @{jsonrpc='2.0'; method='eth_accounts'; params=@(); id=1} | ConvertTo-Json
$resp = Invoke-RestMethod -Uri 'http://localhost:7545' -Method POST -ContentType 'application/json' -Body $body
Write-Host "Có $($resp.result.Count) accounts (index 0..$($resp.result.Count - 1))"
```

---

## 📝 Tóm tắt

### Kiểm tra Balance:
- ✅ Script: `check-balance.ps1` (tự động, hiển thị tất cả)
- ✅ Ganache GUI (trực quan)
- ✅ PowerShell (thủ công, linh hoạt)
- ✅ cURL (command line)

### Lấy ETH:
- ✅ Script: `get-eth-from-ganache.ps1` (tự động, dễ dàng)
- ✅ Ganache GUI (trực quan)
- ✅ PowerShell (thủ công)
- ✅ cURL (command line)

**File scripts:**
- `scripts/check-balance.ps1` - Kiểm tra balance tất cả accounts
- `scripts/get-eth-from-ganache.ps1` - Chuyển ETH vào Service Account
- `scripts/check-and-fund.ps1` - Tự động kiểm tra và chuyển nếu thiếu


# Script test API cho Multisig Service
# Usage: .\scripts\test-api.ps1

$baseUrl = "http://localhost:3001"
$rpcUrl = "http://localhost:7545"

Write-Host "🧪 Testing Multisig Service API" -ForegroundColor Cyan
Write-Host "Base URL: $baseUrl" -ForegroundColor Yellow
Write-Host ""

# ============================================
# Test 1: Health Check
# ============================================
Write-Host "1️⃣  Testing Health Check..." -ForegroundColor Cyan
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($response -eq "UP") {
        Write-Host "   ✅ Health Check: UP" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Unexpected response: $response" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Health Check Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# Lấy Service Account từ Ganache
# ============================================
Write-Host "📋 Lấy Service Account từ Ganache..." -ForegroundColor Cyan
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 1
    } | ConvertTo-Json

    $ganacheResponse = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $serviceAccount = $ganacheResponse.result[0]
    $account1 = $ganacheResponse.result[1]
    $account2 = $ganacheResponse.result[2]
    
    Write-Host "   ✅ Service Account: $serviceAccount" -ForegroundColor Green
    Write-Host "   ✅ Account #1: $account1" -ForegroundColor Cyan
    Write-Host "   ✅ Account #2: $account2" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Không thể lấy accounts từ Ganache" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================
# Test 2: Tạo Ví Mới
# ============================================
Write-Host "2️⃣  Testing Create Wallet..." -ForegroundColor Cyan
$walletBody = @{
    name = "Test Wallet"
    description = "Ví test từ script"
    owners = @($serviceAccount, $account1, $account2)
    threshold = 2
} | ConvertTo-Json

try {
    $walletResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig" `
        -Method POST `
        -ContentType "application/json" `
        -Body $walletBody
    
    $walletId = $walletResponse.id
    $contractAddress = $walletResponse.contractAddress
    
    Write-Host "   ✅ Wallet tạo thành công!" -ForegroundColor Green
    Write-Host "   📝 Wallet ID: $walletId" -ForegroundColor Cyan
    Write-Host "   📝 Contract Address: $contractAddress" -ForegroundColor Cyan
    Write-Host "   📝 Threshold: $($walletResponse.threshold)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Tạo Wallet Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
        Write-Host "   Message: $($errorJson.message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# ============================================
# Test 3: Lấy Thông Tin Ví
# ============================================
Write-Host "3️⃣  Testing Get Wallet..." -ForegroundColor Cyan
try {
    $getWalletResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/$walletId" `
        -Method GET
    
    Write-Host "   ✅ Lấy thông tin ví thành công!" -ForegroundColor Green
    Write-Host "   📝 Name: $($getWalletResponse.name)" -ForegroundColor Cyan
    Write-Host "   📝 Balance: $($getWalletResponse.onChainBalance) ETH" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Lấy thông tin ví Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# ============================================
# Test 4: Submit Transaction
# ============================================
Write-Host "4️⃣  Testing Submit Transaction..." -ForegroundColor Cyan
$txBody = @{
    destination = $account1
    value = "0.01"
    data = "0x"
} | ConvertTo-Json

try {
    $txResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/$walletId/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body $txBody
    
    $txId = $txResponse.id
    
    Write-Host "   ✅ Submit Transaction thành công!" -ForegroundColor Green
    Write-Host "   📝 Transaction ID: $txId" -ForegroundColor Cyan
    Write-Host "   📝 Status: $($txResponse.status)" -ForegroundColor Cyan
    Write-Host "   📝 Tx Hash: $($txResponse.txHash)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Submit Transaction Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
        Write-Host "   Message: $($errorJson.message)" -ForegroundColor Red
    }
    exit 1
}

Write-Host ""

# ============================================
# Test 5: Confirm Transaction
# ============================================
Write-Host "5️⃣  Testing Confirm Transaction..." -ForegroundColor Cyan
try {
    $confirmResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/transactions/$txId/confirm" `
        -Method POST
    
    Write-Host "   ✅ Confirm Transaction thành công!" -ForegroundColor Green
    Write-Host "   📝 Status: $($confirmResponse.status)" -ForegroundColor Cyan
    Write-Host "   📝 Confirmations: $($confirmResponse.confirmations.Count)" -ForegroundColor Cyan
    
    # Nếu threshold = 2, cần confirm thêm lần nữa
    if ($confirmResponse.confirmations.Count -lt $walletResponse.threshold) {
        Write-Host "   ⚠️  Cần thêm confirmations để đạt threshold ($($walletResponse.threshold))" -ForegroundColor Yellow
        Write-Host "   💡 Đang confirm thêm lần nữa..." -ForegroundColor Yellow
        
        Start-Sleep -Seconds 2
        $confirmResponse2 = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/transactions/$txId/confirm" `
            -Method POST
        
        Write-Host "   ✅ Confirm lần 2 thành công!" -ForegroundColor Green
        Write-Host "   📝 Total Confirmations: $($confirmResponse2.confirmations.Count)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Confirm Transaction Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
        Write-Host "   Message: $($errorJson.message)" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# Test 6: Execute Transaction (nếu đủ confirmations)
# ============================================
Write-Host "6️⃣  Testing Execute Transaction..." -ForegroundColor Cyan
try {
    $executeResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/transactions/$txId/execute" `
        -Method POST
    
    Write-Host "   ✅ Execute Transaction thành công!" -ForegroundColor Green
    Write-Host "   📝 Status: $($executeResponse.status)" -ForegroundColor Cyan
    Write-Host "   📝 Tx Hash: $($executeResponse.txHash)" -ForegroundColor Cyan
} catch {
    Write-Host "   ❌ Execute Transaction Failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "   Error: $($errorJson.error)" -ForegroundColor Red
        Write-Host "   Message: $($errorJson.message)" -ForegroundColor Red
    }
}

Write-Host ""

# ============================================
# Test 7: Lấy Danh Sách Transactions
# ============================================
Write-Host "7️⃣  Testing Get Transactions..." -ForegroundColor Cyan
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$baseUrl/api/v1/multisig/$walletId/transactions" `
        -Method GET
    
    Write-Host "   ✅ Lấy danh sách transactions thành công!" -ForegroundColor Green
    Write-Host "   📝 Số lượng transactions: $($transactionsResponse.Count)" -ForegroundColor Cyan
    
    foreach ($tx in $transactionsResponse) {
        Write-Host "   - Transaction $($tx.id): $($tx.status)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Get Transactions Failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Test hoàn tất!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Tóm tắt:" -ForegroundColor Cyan
Write-Host "   - Wallet ID: $walletId" -ForegroundColor White
Write-Host "   - Transaction ID: $txId" -ForegroundColor White

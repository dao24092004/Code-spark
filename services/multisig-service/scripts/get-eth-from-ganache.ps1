# Script lấy ETH từ một account và chuyển vào Service Account
# Usage: .\scripts\get-eth-from-ganache.ps1 [fromAccountIndex] [amountInEth]

param(
    [int]$FromAccountIndex = 0,  # Account index trong Ganache (mặc định: 0)
    [decimal]$AmountInEth = 100   # Số lượng ETH muốn chuyển (mặc định: 100)
)

$rpcUrl = "http://localhost:7545"
$serviceAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"

Write-Host "💰 Chuyển ETH từ Ganache vào Service Account" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Lấy danh sách accounts
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

    if ($FromAccountIndex -ge $accounts.Count) {
        Write-Host "❌ Lỗi: Account index $FromAccountIndex không tồn tại!" -ForegroundColor Red
        Write-Host "   Ganache có $($accounts.Count) accounts (0..$($accounts.Count - 1))" -ForegroundColor Yellow
        exit 1
    }

    $fromAccount = $accounts[$FromAccountIndex]

    Write-Host "📋 Từ Account #$FromAccountIndex:" -ForegroundColor Cyan
    Write-Host "   $fromAccount" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Đến Service Account:" -ForegroundColor Cyan
    Write-Host "   $serviceAccount" -ForegroundColor White
    Write-Host ""
    Write-Host "💰 Số lượng: $AmountInEth ETH" -ForegroundColor Yellow
    Write-Host ""

    # 2. Kiểm tra balance của fromAccount
    $checkBalanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($fromAccount, "latest")
        id = 1
    } | ConvertTo-Json

    $checkBalanceResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $checkBalanceBody

    $fromBalanceWei = [Convert]::ToInt64($checkBalanceResp.result, 16)
    $fromBalanceEth = $fromBalanceWei / 1000000000000000000

    Write-Host "Balance của fromAccount: $fromBalanceEth ETH" -ForegroundColor Cyan

    if ($fromBalanceEth -lt $AmountInEth) {
        Write-Host ""
        Write-Host "⚠️  CẢNH BÁO: Account không đủ ETH!" -ForegroundColor Red
        Write-Host "   Có: $fromBalanceEth ETH" -ForegroundColor Yellow
        Write-Host "   Cần: $AmountInEth ETH" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "💡 Chọn account khác hoặc giảm số lượng ETH" -ForegroundColor White
        exit 1
    }

    Write-Host ""

    # 3. Chuyển đổi ETH sang Wei và hex
    $amountWei = [Math]::Floor($AmountInEth * 1000000000000000000)
    $amountHex = "0x" + $amountWei.ToString("X")

    # 4. Gửi transaction
    Write-Host "📤 Đang gửi transaction..." -ForegroundColor Yellow
    
    $txBody = @{
        jsonrpc = "2.0"
        method = "eth_sendTransaction"
        params = @(
            @{
                from = $fromAccount
                to = $serviceAccount
                value = $amountHex
            }
        )
        id = 2
    } | ConvertTo-Json

    $txResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $txBody

    $txHash = $txResp.result
    Write-Host "✅ Transaction Hash: $txHash" -ForegroundColor Green
    Write-Host ""

    # 5. Đợi transaction được xử lý
    Write-Host "⏳ Đợi transaction được xử lý..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3

    # 6. Kiểm tra balance mới của Service Account
    $serviceBalanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($serviceAccount, "latest")
        id = 1
    } | ConvertTo-Json

    $serviceBalanceResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $serviceBalanceBody

    $serviceBalanceWei = [Convert]::ToInt64($serviceBalanceResp.result, 16)
    $serviceBalanceEth = $serviceBalanceWei / 1000000000000000000

    Write-Host "✅ Balance mới của Service Account: $serviceBalanceEth ETH" -ForegroundColor Green
    Write-Host ""

    if ($serviceBalanceEth -ge 0.05) {
        Write-Host "✅ Đủ ETH để deploy contract!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Vẫn thiếu ETH, cần chuyển thêm!" -ForegroundColor Yellow
    }

} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Kiểm tra:" -ForegroundColor Yellow
    Write-Host "   1. Ganache đang chạy tại http://localhost:7545" -ForegroundColor White
    Write-Host "   2. Account index đúng (0..$($accounts.Count - 1))" -ForegroundColor White
    Write-Host "   3. Account có đủ ETH" -ForegroundColor White
}


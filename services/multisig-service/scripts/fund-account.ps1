# Script để chuyển ETH vào Service Account
# Usage: .\scripts\fund-account.ps1

$rpcUrl = "http://localhost:7545"
$serviceAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"

Write-Host "💰 Đang chuyển ETH vào Service Account..." -ForegroundColor Cyan
Write-Host "Service Account: $serviceAccount" -ForegroundColor Yellow
Write-Host ""

# Lấy accounts từ Ganache
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 1
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $fromAccount = $response.result[0]  # Account đầu tiên có ETH
    
    Write-Host "📋 Từ account: $fromAccount" -ForegroundColor Cyan
    Write-Host "📋 Đến account: $serviceAccount" -ForegroundColor Cyan
    
    # Chuyển 100 ETH (100000000000000000000 wei)
    $amount = "0x16345785D8A0000"  # 100 ETH in hex
    
    $txBody = @{
        jsonrpc = "2.0"
        method = "eth_sendTransaction"
        params = @(
            @{
                from = $fromAccount
                to = $serviceAccount
                value = $amount
            }
        )
        id = 2
    } | ConvertTo-Json

    Write-Host "💰 Đang chuyển 100 ETH..." -ForegroundColor Yellow
    $txResponse = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $txBody

    Write-Host "✅ Transaction Hash: $($txResponse.result)" -ForegroundColor Green
    
    # Kiểm tra balance sau khi chuyển
    Start-Sleep -Seconds 2
    
    $balanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($serviceAccount, "latest")
        id = 3
    } | ConvertTo-Json

    $balanceResponse = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody

    $balanceWei = [Convert]::ToInt64($balanceResponse.result, 16)
    $balanceEth = $balanceWei / 1000000000000000000
    
    Write-Host "✅ Balance của Service Account: $balanceEth ETH" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}


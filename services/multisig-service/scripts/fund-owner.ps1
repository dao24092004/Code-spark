# Script chuyển ETH vào một owner account để confirm transaction
# Usage: .\scripts\fund-owner.ps1 -OwnerAddress "0x..." [-AmountInEth 0.1] [-RpcUrl "http://localhost:8545"]

param(
    [Parameter(Mandatory=$true)]
    [string]$OwnerAddress,
    
    [decimal]$AmountInEth = 0.1,
    
    [string]$RpcUrl = "http://localhost:8545"  # Mặc định port 8545 (Ganache CLI)
)

Write-Host "💰 Chuyển ETH vào Owner Account" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Owner Address: $OwnerAddress" -ForegroundColor Yellow
Write-Host "Amount: $AmountInEth ETH" -ForegroundColor Yellow
Write-Host "RPC URL: $RpcUrl" -ForegroundColor Yellow
Write-Host ""

try {
    # 1. Lấy accounts từ Ganache
    $accountsBody = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 1
    } | ConvertTo-Json
    
    $accountsResp = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $accountsBody
    
    $fromAccount = $accountsResp.result[0]  # Account đầu tiên có ETH
    
    Write-Host "📋 Từ: $fromAccount" -ForegroundColor Cyan
    Write-Host "📋 Đến: $OwnerAddress" -ForegroundColor Cyan
    Write-Host ""
    
    # 2. Chuyển ETH
    $amountWei = [BigInt][Math]::Floor($AmountInEth * 1000000000000000000)
    $amountHex = "0x" + $amountWei.ToString("X")
    
    Write-Host "💰 Đang chuyển $AmountInEth ETH..." -ForegroundColor Yellow
    
    $txBody = @{
        jsonrpc = "2.0"
        method = "eth_sendTransaction"
        params = @(
            @{
                from = $fromAccount
                to = $OwnerAddress
                value = $amountHex
            }
        )
        id = 2
    } | ConvertTo-Json
    
    $txResp = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $txBody
    
    Write-Host "✅ Transaction Hash: $($txResp.result)" -ForegroundColor Green
    
    # 3. Đợi transaction được xử lý
    Write-Host "⏳ Đợi transaction được xử lý..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # 4. Kiểm tra balance mới
    $balanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($OwnerAddress, "latest")
        id = 1
    } | ConvertTo-Json
    
    $balanceResp = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody
    
    $balanceWei = [BigInt]::Parse($balanceResp.result.Replace("0x", ""), [System.Globalization.NumberStyles]::HexNumber)
    $balanceEth = [decimal]$balanceWei / 1000000000000000000
    
    Write-Host ""
    Write-Host "✅ New Balance: $balanceEth ETH" -ForegroundColor Green
    
    if ($balanceEth -ge 0.05) {
        Write-Host "✅ Owner có đủ ETH để confirm transaction!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Vẫn thiếu ETH, cần chuyển thêm!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kiểm tra:" -ForegroundColor Yellow
    Write-Host "   1. Ganache đang chạy tại $RpcUrl" -ForegroundColor White
    Write-Host "   2. Owner address đúng format (0x...)" -ForegroundColor White
}


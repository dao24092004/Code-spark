# Script chuyển ETH vào Contract Wallet (Multisig Wallet)
# Usage: .\scripts\fund-contract-wallet.ps1 -ContractAddress "0x..." [-AmountInEth 1] [-RpcUrl "http://localhost:8545"]

param(
    [Parameter(Mandatory=$true)]
    [string]$ContractAddress,
    
    [decimal]$AmountInEth = 1,
    
    [string]$RpcUrl = "http://localhost:8545"  # Mặc định port 8545 (Ganache CLI)
)

Write-Host "💰 Chuyển ETH vào Contract Wallet" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""
Write-Host "Contract Address: $ContractAddress" -ForegroundColor Yellow
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
    Write-Host "📋 Đến: $ContractAddress" -ForegroundColor Cyan
    Write-Host ""
    
    # 2. Kiểm tra balance hiện tại của contract
    $balanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($ContractAddress, "latest")
        id = 2
    } | ConvertTo-Json
    
    $balanceResp = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody
    
    $balanceHex = $balanceResp.result
    try {
        if ($balanceHex -eq "0x0" -or $balanceHex -eq "0x" -or $balanceHex -eq $null) {
            $balanceEth = 0
        } else {
            $balanceWei = [System.Numerics.BigInteger]::Parse($balanceHex.Replace("0x", ""), [System.Globalization.NumberStyles]::HexNumber)
            $balanceEth = [decimal]$balanceWei / 1000000000000000000
        }
        Write-Host "📊 Balance hiện tại: $balanceEth ETH" -ForegroundColor Cyan
    } catch {
        Write-Host "📊 Balance hiện tại: 0 ETH (không thể parse)" -ForegroundColor Cyan
        $balanceEth = 0
    }
    Write-Host ""
    
    # 3. Chuyển ETH
    $amountWei = [BigInt][Math]::Floor($AmountInEth * 1000000000000000000)
    $amountHex = "0x" + $amountWei.ToString("X")
    
    Write-Host "💰 Đang chuyển $AmountInEth ETH..." -ForegroundColor Yellow
    
    $txBody = @{
        jsonrpc = "2.0"
        method = "eth_sendTransaction"
        params = @(
            @{
                from = $fromAccount
                to = $ContractAddress
                value = $amountHex
            }
        )
        id = 3
    } | ConvertTo-Json
    
    $txResp = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $txBody
    
    Write-Host "✅ Transaction Hash: $($txResp.result)" -ForegroundColor Green
    
    # 4. Đợi transaction được xử lý
    Write-Host "⏳ Đợi transaction được xử lý..." -ForegroundColor Yellow
    Start-Sleep -Seconds 3
    
    # 5. Kiểm tra balance mới
    $balanceResp2 = Invoke-RestMethod -Uri $RpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody
    
    $balanceHex2 = $balanceResp2.result
    try {
        if ($balanceHex2 -eq "0x0" -or $balanceHex2 -eq "0x" -or $balanceHex2 -eq $null) {
            $balanceEth2 = 0
        } else {
            $balanceWei2 = [System.Numerics.BigInteger]::Parse($balanceHex2.Replace("0x", ""), [System.Globalization.NumberStyles]::HexNumber)
            $balanceEth2 = [decimal]$balanceWei2 / 1000000000000000000
        }
        Write-Host ""
        Write-Host "✅ New Balance: $balanceEth2 ETH" -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "✅ Transaction đã được gửi (không thể parse balance)" -ForegroundColor Green
        $balanceEth2 = $AmountInEth
    }
    
    if ($balanceEth2 -ge $AmountInEth) {
        Write-Host "✅ Contract wallet đã có đủ ETH để execute transaction!" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Vẫn thiếu ETH, cần chuyển thêm!" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kiểm tra:" -ForegroundColor Yellow
    Write-Host "   1. Ganache đang chạy tại $RpcUrl" -ForegroundColor White
    Write-Host "   2. Contract address đúng format (0x...)" -ForegroundColor White
    Write-Host "   3. Contract đã được deploy" -ForegroundColor White
}


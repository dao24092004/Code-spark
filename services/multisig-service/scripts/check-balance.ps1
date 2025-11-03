# Script kiểm tra balance ETH của các accounts trong Ganache
# Usage: .\scripts\check-balance.ps1

$rpcUrl = "http://localhost:7545"

Write-Host "💰 Kiem tra Balance ETH tu Ganache" -ForegroundColor Cyan
Write-Host "RPC URL: $rpcUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host ("=" * 60) -ForegroundColor Cyan
Write-Host ""

try {
    # 1. Lấy danh sách accounts từ Ganache
    $accountsBody = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 1
    } | ConvertTo-Json

    Write-Host "📋 Đang lấy danh sách accounts..." -ForegroundColor Yellow
    $accountsResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $accountsBody

    $accounts = $accountsResp.result
    Write-Host "✅ Tìm thấy $($accounts.Count) accounts" -ForegroundColor Green
    Write-Host ""

    # 2. Kiểm tra balance của từng account
    Write-Host "📊 Balance của các accounts:" -ForegroundColor Cyan
    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host ""

    $totalBalance = 0
    for ($i = 0; $i -lt $accounts.Count; $i++) {
        $accountAddress = $accounts[$i]
        
        # Lấy balance
        $balanceBody = @{
            jsonrpc = "2.0"
            method = "eth_getBalance"
            params = @($accountAddress, "latest")
            id = 1
        } | ConvertTo-Json

        $balanceResp = Invoke-RestMethod -Uri $rpcUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $balanceBody

        $balanceWei = [Convert]::ToInt64($balanceResp.result, 16)
        $balanceEth = $balanceWei / 1000000000000000000
        
        $totalBalance += $balanceEth

        # Hiển thị với màu sắc
        $color = if ($balanceEth -ge 10) { "Green" } 
                 elseif ($balanceEth -ge 1) { "Cyan" } 
                 else { "Yellow" }
        
        Write-Host "Account #$($i + 1):" -ForegroundColor White -NoNewline
        Write-Host " $accountAddress" -ForegroundColor $color
        Write-Host "  Balance: $balanceEth ETH" -ForegroundColor $color
        Write-Host ""
    }

    Write-Host ("=" * 60) -ForegroundColor Cyan
    Write-Host "Total Balance: $totalBalance ETH" -ForegroundColor Green
    Write-Host ""

    # 3. Kiểm tra Service Account cụ thể
    $serviceAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
    Write-Host "🔍 Kiểm tra Service Account:" -ForegroundColor Cyan
    Write-Host "Service Account: $serviceAccount" -ForegroundColor Yellow
    
    if ($accounts -contains $serviceAccount) {
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

        $serviceColor = if ($serviceBalanceEth -ge 0.05) { "Green" } else { "Red" }
        Write-Host "Balance: $serviceBalanceEth ETH" -ForegroundColor $serviceColor
        
        if ($serviceBalanceEth -lt 0.05) {
            Write-Host ""
            Write-Host "⚠️  CẢNH BÁO: Service Account có ít ETH!" -ForegroundColor Red
            Write-Host "   Cần ít nhất 0.05 ETH để deploy contract" -ForegroundColor Yellow
            Write-Host "   Chạy: .\scripts\check-and-fund.ps1 để tự động chuyển ETH" -ForegroundColor Yellow
        } else {
            Write-Host ""
            Write-Host "✅ Service Account có đủ ETH!" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️  Service Account không tìm thấy trong danh sách!" -ForegroundColor Yellow
    }

} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Check:" -ForegroundColor Yellow
    Write-Host '   1. Ganache is running at http://localhost:7545' -ForegroundColor White
    Write-Host '   2. RPC URL is correct' -ForegroundColor White
}


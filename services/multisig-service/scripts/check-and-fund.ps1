# Script kiểm tra và tự động chuyển ETH vào Service Account nếu thiếu
# Usage: .\scripts\check-and-fund.ps1

$rpcUrl = "http://localhost:7545"
$serviceAccount = "0x90F8bf6A479f320ead074411a4B0e7944Ea8c9C1"
$minBalanceEth = 0.05  # Tối thiểu 0.05 ETH

Write-Host "💰 Kiểm tra balance của Service Account..." -ForegroundColor Cyan
Write-Host "Service Account: $serviceAccount" -ForegroundColor Yellow
Write-Host ""

try {
    # Kiểm tra balance hiện tại
    $balanceBody = @{
        jsonrpc = "2.0"
        method = "eth_getBalance"
        params = @($serviceAccount, "latest")
        id = 1
    } | ConvertTo-Json

    $balanceResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $balanceBody

    $balanceWei = [Convert]::ToInt64($balanceResp.result, 16)
    $balanceEth = $balanceWei / 1000000000000000000

    Write-Host "Current Balance: $balanceEth ETH" -ForegroundColor Cyan

    if ($balanceEth -lt $minBalanceEth) {
        Write-Host "⚠️  Balance thấp! Cần ít nhất $minBalanceEth ETH" -ForegroundColor Yellow
        Write-Host "Đang chuyển 100 ETH vào Service Account..." -ForegroundColor Yellow
        Write-Host ""
        
        # Lấy accounts từ Ganache
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
        
        $fromAccount = $accountsResp.result[0]  # Account đầu tiên
        
        Write-Host "📋 Từ: $fromAccount" -ForegroundColor Cyan
        Write-Host "📋 Đến: $serviceAccount" -ForegroundColor Cyan
        
        # Chuyển 100 ETH (100000000000000000000 wei)
        $txBody = @{
            jsonrpc = "2.0"
            method = "eth_sendTransaction"
            params = @(
                @{
                    from = $fromAccount
                    to = $serviceAccount
                    value = "0x16345785D8A0000"  # 100 ETH in hex
                }
            )
            id = 2
        } | ConvertTo-Json
        
        $txResp = Invoke-RestMethod -Uri $rpcUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $txBody
        
        Write-Host "✅ Transaction Hash: $($txResp.result)" -ForegroundColor Green
        
        # Đợi transaction được xử lý
        Write-Host "Đợi transaction được xử lý..." -ForegroundColor Yellow
        Start-Sleep -Seconds 3
        
        # Kiểm tra balance mới
        $balanceResp2 = Invoke-RestMethod -Uri $rpcUrl `
            -Method POST `
            -ContentType "application/json" `
            -Body $balanceBody
        
        $balanceWei2 = [Convert]::ToInt64($balanceResp2.result, 16)
        $balanceEth2 = $balanceWei2 / 1000000000000000000
        
        Write-Host ""
        Write-Host "✅ New Balance: $balanceEth2 ETH" -ForegroundColor Green
        
        if ($balanceEth2 -ge $minBalanceEth) {
            Write-Host "✅ Đủ ETH để deploy contract!" -ForegroundColor Green
        } else {
            Write-Host "⚠️  Vẫn thiếu ETH, cần chuyển thêm!" -ForegroundColor Yellow
        }
    } else {
        Write-Host "✅ Balance đủ! ($balanceEth ETH >= $minBalanceEth ETH)" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}


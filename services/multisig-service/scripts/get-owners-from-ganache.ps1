# Script lấy danh sách owners từ Ganache để dùng trong tạo ví
# Usage: .\scripts\get-owners-from-ganache.ps1 [count]

param(
    [int]$Count = 3  # Số lượng owners muốn lấy (mặc định: 3)
)

$rpcUrl = "http://localhost:7545"

Write-Host "📋 Lấy danh sách Owners từ Ganache" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Cyan
Write-Host ""

try {
    # Lấy danh sách accounts
    $accountsBody = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 1
    } | ConvertTo-Json

    Write-Host "Đang lấy accounts từ Ganache..." -ForegroundColor Yellow
    $accountsResp = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $accountsBody

    $accounts = $accountsResp.result
    
    if ($Count -gt $accounts.Count) {
        Write-Host "⚠️  Chỉ có $($accounts.Count) accounts, nhưng yêu cầu $Count" -ForegroundColor Yellow
        $Count = $accounts.Count
    }

    Write-Host ""
    Write-Host "✅ Tìm thấy $($accounts.Count) accounts" -ForegroundColor Green
    Write-Host "Chọn $Count owners đầu tiên:" -ForegroundColor Cyan
    Write-Host ""

    # Tạo JSON array cho owners
    $ownersArray = @()
    $ownersInfo = @()

    for ($i = 0; $i -lt $Count; $i++) {
        $accountAddress = $accounts[$i]
        $ownersArray += $accountAddress
        
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

        $balanceWei = [BigInt]::Parse($balanceResp.result.Replace("0x", ""), [System.Globalization.NumberStyles]::HexNumber)
        $balanceEth = [decimal]$balanceWei / 1000000000000000000

        $ownersInfo += [PSCustomObject]@{
            Index = $i
            Address = $accountAddress
            Balance = "$([math]::Round($balanceEth, 2)) ETH"
        }

        Write-Host "Owner #$($i + 1):" -ForegroundColor White
        Write-Host "  Address: $accountAddress" -ForegroundColor Cyan
        Write-Host "  Balance: $([math]::Round($balanceEth, 2)) ETH" -ForegroundColor $(if ($balanceEth -ge 0.1) { "Green" } else { "Yellow" })
        Write-Host ""
    }

    # Tạo JSON cho Postman
    $jsonBody = @{
        owners = $ownersArray
    } | ConvertTo-Json -Depth 10

    Write-Host "=" * 60 -ForegroundColor Cyan
    Write-Host "📋 JSON để dùng trong Postman (tạo ví):" -ForegroundColor Yellow
    Write-Host ""
    Write-Host $jsonBody -ForegroundColor Green
    Write-Host ""

    # Lưu vào file
    $outputFile = "ganache-owners.json"
    $jsonBody | Out-File -FilePath $outputFile -Encoding UTF8
    
    Write-Host "✅ Đã lưu vào file: $outputFile" -ForegroundColor Green
    Write-Host ""
    Write-Host "💡 Hướng dẫn:" -ForegroundColor Yellow
    Write-Host "   1. Copy JSON trên vào Postman body khi tạo ví" -ForegroundColor White
    Write-Host "   2. Nhớ thêm Service Account vào danh sách owners!" -ForegroundColor White
    Write-Host "   3. Đặt threshold (ví dụ: 2)" -ForegroundColor White

} catch {
    Write-Host "❌ Lỗi: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Kiểm tra:" -ForegroundColor Yellow
    Write-Host "   1. Ganache đang chạy tại http://localhost:7545" -ForegroundColor White
    Write-Host "   2. RPC URL đúng trong .env file" -ForegroundColor White
}


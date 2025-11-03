# Script kiểm tra Ganache Network ID và Chain ID
# Usage: .\scripts\check-ganache.ps1

$rpcUrl = "http://localhost:7545"

Write-Host "🔍 Đang kiểm tra Ganache Network ID..." -ForegroundColor Cyan
Write-Host "RPC URL: $rpcUrl" -ForegroundColor Yellow
Write-Host ""

# Kiểm tra Network ID từ docker-compose.yml
Write-Host "📋 Network ID từ docker-compose.yml: 5777" -ForegroundColor Cyan

# Test kết nối và lấy Network ID
try {
    $body = @{
        jsonrpc = "2.0"
        method = "net_version"
        params = @()
        id = 1
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $networkId = $response.result
    Write-Host "✅ Network ID từ Ganache: $networkId" -ForegroundColor Green
    
    if ($networkId -eq "5777") {
        Write-Host "✅ Network ID khớp với docker-compose.yml (5777)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Network ID KHÔNG khớp!" -ForegroundColor Yellow
        Write-Host "   Ganache: $networkId" -ForegroundColor Yellow
        Write-Host "   Config: 5777" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ Không thể kết nối đến Ganache tại $rpcUrl" -ForegroundColor Red
    Write-Host "   Lỗi: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""

# Kiểm tra Chain ID
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_chainId"
        params = @()
        id = 2
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $chainIdHex = $response.result
    $chainId = [Convert]::ToInt64($chainIdHex, 16)
    Write-Host "✅ Chain ID từ Ganache: $chainId (0x$chainIdHex)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Không thể lấy Chain ID" -ForegroundColor Yellow
}

Write-Host ""

# Test lấy accounts
try {
    $body = @{
        jsonrpc = "2.0"
        method = "eth_accounts"
        params = @()
        id = 3
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri $rpcUrl `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    $accounts = $response.result
    Write-Host "✅ Số lượng accounts: $($accounts.Count)" -ForegroundColor Green
    if ($accounts.Count -gt 0) {
        Write-Host "   Account đầu tiên: $($accounts[0])" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Không thể lấy accounts" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Thông tin từ docker-compose.yml:" -ForegroundColor Cyan
Write-Host "   --networkId 5777" -ForegroundColor White
Write-Host ""
Write-Host "💡 Đảm bảo Network ID khớp nhau!" -ForegroundColor Yellow


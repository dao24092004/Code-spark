# Script để tạo database và setup ban đầu
# Usage: .\scripts\setup-database.ps1

$containerName = "postgres-db"
$dbName = "multisig_db"
$user = "postgres"

Write-Host "🔧 Đang thiết lập database cho multisig-service..." -ForegroundColor Cyan

# Kiểm tra container có chạy không
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerStatus) {
    Write-Host "⚠️  Container $containerName chưa chạy. Đang khởi động..." -ForegroundColor Yellow
    docker start $containerName
    Start-Sleep -Seconds 5
    Write-Host "✅ Container đã khởi động" -ForegroundColor Green
}

# Kiểm tra database đã tồn tại chưa
$dbExists = docker exec $containerName psql -U $user -tc "SELECT 1 FROM pg_database WHERE datname = '$dbName'"
if ($dbExists -match '\s*1\s*') {
    Write-Host "✅ Database '$dbName' đã tồn tại" -ForegroundColor Green
} else {
    Write-Host "📝 Đang tạo database '$dbName'..." -ForegroundColor Yellow
    docker exec $containerName psql -U $user -c "CREATE DATABASE $dbName;"
    Write-Host "✅ Database '$dbName' đã được tạo thành công!" -ForegroundColor Green
}

Write-Host ""
Write-Host "📊 Thông tin kết nối:" -ForegroundColor Cyan
Write-Host "  Host: localhost" -ForegroundColor White
Write-Host "  Port: 5432" -ForegroundColor White
Write-Host "  Database: $dbName" -ForegroundColor White
Write-Host "  User: $user" -ForegroundColor White
Write-Host ""
Write-Host "💡 Để truy cập psql, chạy: .\scripts\psql.ps1" -ForegroundColor Yellow


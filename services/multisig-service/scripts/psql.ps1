# Script helper để truy cập PostgreSQL qua Docker
# Usage: .\scripts\psql.ps1 [command]
# Examples:
#   .\scripts\psql.ps1                          # Vào psql shell
#   .\scripts\psql.ps1 "SELECT version();"     # Chạy query
#   .\scripts\psql.ps1 "-c \l"                   # Liệt kê databases

param(
    [string]$Command = ""
)

$containerName = "postgres-db"
$dbName = "multisig_db"
$user = "postgres"

# Kiểm tra container có chạy không
$containerStatus = docker ps --filter "name=$containerName" --format "{{.Names}}"
if (-not $containerStatus) {
    Write-Host "❌ Container $containerName chưa chạy. Đang khởi động..." -ForegroundColor Red
    docker start $containerName
    Start-Sleep -Seconds 3
}

if ($Command) {
    # Chạy command trực tiếp
    docker exec $containerName psql -U $user -d $dbName -c $Command
} else {
    # Vào psql shell
    Write-Host "✅ Đang kết nối đến PostgreSQL trong container $containerName..." -ForegroundColor Green
    Write-Host "Database: $dbName" -ForegroundColor Cyan
    Write-Host "User: $user" -ForegroundColor Cyan
    Write-Host "Gõ \q để thoát" -ForegroundColor Yellow
    docker exec -it $containerName psql -U $user -d $dbName
}


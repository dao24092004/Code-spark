# Script để tạo file .env từ template
# Usage: .\setup-env.ps1

Write-Host "🔧 Đang tạo file .env từ template..." -ForegroundColor Cyan

$templateFile = "env.template"
$envFile = ".env"

# Kiểm tra template file có tồn tại không
if (-not (Test-Path $templateFile)) {
    Write-Host "❌ Không tìm thấy file $templateFile" -ForegroundColor Red
    exit 1
}

# Kiểm tra .env đã tồn tại chưa
if (Test-Path $envFile) {
    Write-Host "⚠️  File .env đã tồn tại!" -ForegroundColor Yellow
    $overwrite = Read-Host "Bạn có muốn ghi đè không? (y/n)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "❌ Đã hủy. Giữ nguyên file .env hiện tại." -ForegroundColor Yellow
        exit 0
    }
}

# Copy template thành .env
Copy-Item -Path $templateFile -Destination $envFile -Force

Write-Host "✅ Đã tạo file .env thành công!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Các bước tiếp theo:" -ForegroundColor Cyan
Write-Host "1. Kiểm tra password PostgreSQL trong docker-compose.yml" -ForegroundColor White
Write-Host "2. Khởi động Ganache: docker-compose up -d ganache" -ForegroundColor White
Write-Host "3. Lấy private keys từ Ganache (nếu dùng Ganache khác)" -ForegroundColor White
Write-Host "4. Cập nhật .env với các giá trị đúng" -ForegroundColor White
Write-Host ""
Write-Host "💡 Password PostgreSQL từ docker: password" -ForegroundColor Yellow
Write-Host "💡 Private keys mặc định trong template là từ Ganache deterministic" -ForegroundColor Yellow


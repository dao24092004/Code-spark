# 📝 Hướng dẫn sử dụng PostgreSQL qua Docker

## ✅ Giải pháp: Dùng Docker (Khuyến nghị)

Vì bạn không có `psql` cài đặt trên Windows, cách tốt nhất là dùng Docker container `postgres-db` đã có sẵn trong dự án.

## 🚀 Các bước nhanh

### 1. Khởi động PostgreSQL container

```powershell
# Từ thư mục gốc dự án
docker-compose up -d postgres-db
```

### 2. Tạo database (nếu chưa có)

```powershell
docker exec postgres-db psql -U postgres -c "CREATE DATABASE multisig_db;"
```

### 3. Truy cập PostgreSQL

#### Cách 1: Vào psql shell (tương tác)
```powershell
docker exec -it postgres-db psql -U postgres -d multisig_db
```

Sau đó bạn có thể chạy các lệnh SQL:
```sql
\l              -- Liệt kê databases
\dt             -- Liệt kê tables
\q              -- Thoát
```

#### Cách 2: Chạy query trực tiếp
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "SELECT version();"
```

#### Cách 3: Dùng script helper (nếu có)

**PowerShell:**
```powershell
cd services/multisig-service
.\scripts\psql.ps1                    # Vào psql shell
.\scripts\psql.ps1 "SELECT version();" # Chạy query
.\scripts\setup-database.ps1           # Setup database
```

**Bash/Linux/Mac:**
```bash
cd services/multisig-service
./scripts/psql.sh                      # Vào psql shell
./scripts/psql.sh "SELECT version();"  # Chạy query
```

## 📊 Các lệnh PostgreSQL thường dùng

### Liệt kê databases:
```powershell
docker exec postgres-db psql -U postgres -c "\l"
```

### Liệt kê tables trong database:
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "\dt"
```

### Xem cấu trúc table:
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "\d MultisigWallets"
```

### Xem dữ liệu:
```powershell
docker exec postgres-db psql -U postgres -d multisig_db -c "SELECT * FROM \"MultisigWallets\";"
```

### Xóa database (cẩn thận!):
```powershell
docker exec postgres-db psql -U postgres -c "DROP DATABASE multisig_db;"
```

## 🔧 Cấu hình .env

Khi dùng Docker, cấu hình trong `.env` của multisig-service:

```env
DB_HOST=localhost          # Localhost vì container expose port 5432
DB_PORT=5432              # Port mặc định PostgreSQL
DB_NAME=multisig_db       # Database đã tạo
DB_USER=postgres          # User mặc định
DB_PASS=your_password     # Password từ docker-compose.yml hoặc POSTGRES_PASSWORD
```

## ⚠️ Lưu ý

1. **Password**: Kiểm tra `POSTGRES_PASSWORD` trong file `.env` ở thư mục gốc hoặc `docker-compose.yml`

2. **Container name**: Đảm bảo container tên là `postgres-db` (theo docker-compose.yml)

3. **Port**: PostgreSQL expose port 5432 ra host, nên có thể dùng `localhost:5432`

4. **Kiểm tra container đang chạy**:
```powershell
docker ps --filter "name=postgres"
```

5. **Khởi động lại container nếu cần**:
```powershell
docker restart postgres-db
```

## 🆘 Troubleshooting

### Container không chạy:
```powershell
docker start postgres-db
```

### Kiểm tra logs:
```powershell
docker logs postgres-db
```

### Kiểm tra port đã được expose:
```powershell
docker port postgres-db
```

### Xem thông tin container:
```powershell
docker inspect postgres-db
```

## 📝 Script Helper (Tùy chọn)

Tôi đã tạo các script helper trong `services/multisig-service/scripts/`:

- `psql.ps1` - PowerShell script để truy cập psql
- `psql.sh` - Bash script cho Linux/Mac  
- `setup-database.ps1` - Setup database tự động

Nếu muốn dùng, chỉ cần chạy:
```powershell
cd services/multisig-service
.\scripts\psql.ps1
```


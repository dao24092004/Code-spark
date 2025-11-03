# 🗄️ Database Setup - Multisig Service

## Cách 1: Sử dụng Docker (Khuyến nghị)

Nếu bạn đang dùng Docker Compose, PostgreSQL đã được setup sẵn:

### Tạo database bằng Docker:

```powershell
# Kiểm tra PostgreSQL container có đang chạy không
docker ps | Select-String postgres

# Nếu chưa chạy, start PostgreSQL từ docker-compose
docker-compose up -d postgres-db

# Tạo database
docker exec -it postgres-db psql -U postgres -c "CREATE DATABASE multisig_db;"

# Kiểm tra database đã tạo
docker exec -it postgres-db psql -U postgres -l | Select-String multisig
```

### Hoặc dùng docker-compose exec:

```powershell
docker-compose exec postgres-db psql -U postgres -c "CREATE DATABASE multisig_db;"
```

## Cách 2: Tự động tạo database khi service start

Service có thể tự động tạo database khi start (nếu Sequelize được config đúng):

1. Đảm bảo PostgreSQL đang chạy
2. Service sẽ tự động sync schema khi start (với `sequelize.sync()`)

## Cách 3: Sử dụng pgAdmin hoặc GUI tool

1. Mở pgAdmin hoặc DBeaver
2. Kết nối tới PostgreSQL:
   - Host: `localhost`
   - Port: `5432` (hoặc port trong docker-compose)
   - User: `postgres`
   - Password: (từ .env hoặc docker-compose)
3. Tạo database `multisig_db` thủ công

## Cách 4: Cài đặt PostgreSQL locally

Nếu muốn cài PostgreSQL trên Windows:

1. Tải PostgreSQL: https://www.postgresql.org/download/windows/
2. Cài đặt và đảm bảo thêm vào PATH
3. Sau đó dùng:
   ```powershell
   createdb multisig_db
   # Hoặc
   psql -U postgres -c "CREATE DATABASE multisig_db;"
   ```

## Kiểm tra Database sau khi tạo:

```powershell
# Với Docker
docker exec -it postgres-db psql -U postgres -c "\l" | Select-String multisig

# Hoặc connect vào psql
docker exec -it postgres-db psql -U postgres
# Sau đó trong psql:
\l  # List all databases
\c multisig_db  # Connect to database
```

## Troubleshooting:

### Lỗi: "docker: command not found"
- Đảm bảo Docker Desktop đang chạy
- Kiểm tra Docker trong PATH

### Lỗi: "container postgres-db not found"
- Start PostgreSQL container trước:
  ```powershell
  docker-compose up -d postgres-db
  ```

### Lỗi: "database already exists"
- Database đã được tạo rồi, có thể bỏ qua bước này
- Hoặc drop và tạo lại:
  ```powershell
  docker exec -it postgres-db psql -U postgres -c "DROP DATABASE IF EXISTS multisig_db;"
  docker exec -it postgres-db psql -U postgres -c "CREATE DATABASE multisig_db;"
  ```

## ✅ Sau khi tạo database:

1. Kiểm tra `.env` có đúng thông tin database
2. Start service: `npm run dev`
3. Service sẽ tự động sync schema (tạo tables)


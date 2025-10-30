# Token Reward Service - Quick Start

## 🚀 Khởi động nhanh trong 5 phút

### Bước 1: Chuẩn bị Database (1 phút)

**Option A: Dùng DBeaver (Recommended)**
```
1. Mở DBeaver
2. Kết nối: localhost:5432, user: postgres
3. Click phải → Execute SQL Script
4. Chọn file: database-schema.sql
5. Chạy ▶️
```

**Option B: Dùng Command Line**
```bash
psql -U postgres -c "CREATE DATABASE token_reward_db;"
psql -U postgres -d token_reward_db -f database-schema.sql
```

**Option C: Dùng Docker**
```bash
docker exec postgres-db psql -U postgres -c "CREATE DATABASE token_reward_db;"
docker exec -i postgres-db psql -U postgres -d token_reward_db < database-schema.sql
```

---

### Bước 2: Cấu hình Service (1 phút)

```bash
cd Code-spark/services/token-reward-service

# Copy file cấu hình
copy .env.example .env

# Sửa thông tin database trong .env (nếu cần)
notepad .env
```

Đảm bảo `.env` có:
```env
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=token_reward_db
```

---

### Bước 3: Cài đặt và Chạy (2 phút)

```bash
# Cài đặt dependencies
npm install

# Chạy service
npm run dev
```

Thấy message này = thành công ✅:
```
✅ Connection to the database has been established successfully.
✅ Server is running on port 3000.
```

---

### Bước 4: Test API (1 phút)

```bash
# Test 1: Get balance của user 2
curl http://localhost:3000/api/tokens/balance/2

# Expected: {"tokenBalance":50}

# Test 2: Get history
curl "http://localhost:3000/api/tokens/history/2?page=1&limit=5"

# Expected: JSON với rewards array

# Test 3: Grant tokens
curl -X POST http://localhost:3000/api/tokens/grant ^
  -H "Content-Type: application/json" ^
  -d "{\"studentId\": 2, \"amount\": 100, \"reasonCode\": \"TEST\"}"

# Test 4: Verify balance tăng
curl http://localhost:3000/api/tokens/balance/2

# Expected: {"tokenBalance":150}
```

---

## ✅ Checklist

- [ ] PostgreSQL đã chạy
- [ ] Database `token_reward_db` đã tạo
- [ ] Tables đã được tạo (chạy `database-schema.sql`)
- [ ] File `.env` đã cấu hình đúng
- [ ] `npm install` thành công
- [ ] Service chạy được (`npm run dev`)
- [ ] API trả về data đúng

---

## 🐛 Lỗi thường gặp

### "ECONNREFUSED"
→ PostgreSQL chưa chạy
```bash
docker start postgres-db
```

### "database does not exist"
→ Chạy lại bước 1

### "User not found" 
→ Chưa có data, chạy:
```bash
node scripts/populate-db.js
```

### "Port 3000 already in use"
→ Đổi port trong `.env`:
```env
PORT=3001
```

---

## 🎯 URLs

| Service | URL |
|---------|-----|
| **Development** | http://localhost:3000 |
| **Docker** | http://localhost:9009 |
| **Via Gateway** | http://localhost:8080/token-reward |

---

## 📞 Integration với Frontend

Frontend đã được cấu hình để gọi:
```typescript
// web-frontend/src/services/api/tokenRewardApi.ts
const API_BASE_URL = 'http://localhost:9009/api/tokens';
```

Sau khi service chạy, refresh trang `/user/rewards` sẽ thấy dữ liệu thật!

---

**Xong! Service đã sẵn sàng. Chúc bạn code vui vẻ! 🎉**

Nếu cần chi tiết hơn, xem file `HUONG_DAN_CHAY_SERVICE.md`


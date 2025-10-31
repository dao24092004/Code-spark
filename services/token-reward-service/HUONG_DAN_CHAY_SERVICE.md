# Hướng dẫn chạy Token Reward Service

## 📋 Mục lục
- [Prerequisites](#prerequisites)
- [Cấu hình môi trường](#cấu-hình-môi-trường)
- [Setup Database](#setup-database)
- [Cài đặt Dependencies](#cài-đặt-dependencies)
- [Chạy Service](#chạy-service)
- [Test API](#test-api)
- [Deploy với Docker](#deploy-với-docker)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Yêu cầu hệ thống:
- **Node.js**: v16 hoặc cao hơn
- **PostgreSQL**: v13 hoặc cao hơn
- **npm**: v7 hoặc cao hơn
- **Docker & Docker Compose** (tùy chọn, cho deployment)
- **Ganache** (tùy chọn, cho blockchain features)

### Kiểm tra phiên bản:
```bash
node --version   # v18.x.x trở lên
npm --version    # v9.x.x trở lên
psql --version   # PostgreSQL 13+
docker --version # Docker version 20+
```

---

## Cấu hình môi trường

### 1. Tạo file `.env`

Di chuyển đến thư mục service:
```bash
cd Code-spark/services/token-reward-service
```

Tạo file `.env` với nội dung:
```env
# Server Configuration
NODE_ENV=development
PORT=3000

# Database Configuration
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
DB_NAME=token_reward_db

# Blockchain Configuration (Optional)
WEB3_PROVIDER_URL=http://localhost:7545
ACCOUNT_PRIVATE_KEY=your_private_key_here
CONTRACT_ADDRESS=

# Service Discovery (Optional)
EUREKA_HOST=localhost
EUREKA_PORT=9999
SERVICE_DISCOVERY_ENABLED=false

# API Gateway
API_GATEWAY_BASE_URL=http://localhost:8080
```

### 2. Cấu hình cho môi trường khác nhau

**Development (local):**
```env
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
```

**Production (Docker):**
```env
NODE_ENV=production
DB_HOST=postgres-db
DB_PORT=5432
```

---

## Setup Database

### Option 1: Sử dụng DBeaver (Recommended)

1. **Kết nối database trong DBeaver:**
   - Host: `localhost`
   - Port: `5432` (hoặc `5433` nếu đang dùng Docker)
   - Database: `postgres` (kết nối vào postgres trước)
   - Username: `postgres`
   - Password: (password của bạn)

2. **Tạo database:**
   ```sql
   CREATE DATABASE token_reward_db;
   ```

3. **Chạy schema script:**
   - Click phải vào `token_reward_db` → **SQL Editor** → **Open SQL Script**
   - Mở file: `Code-spark/services/token-reward-service/database-schema.sql`
   - Click **Execute SQL Script** (▶️)
   - Chờ script chạy xong

4. **Refresh và verify:**
   - Click phải vào **Tables** → **Refresh**
   - Sẽ thấy 10 tables đã được tạo

### Option 2: Sử dụng psql command line

```bash
# 1. Tạo database
psql -U postgres -c "CREATE DATABASE token_reward_db;"

# 2. Chạy schema script
psql -U postgres -d token_reward_db -f database-schema.sql

# 3. Verify
psql -U postgres -d token_reward_db -c "\dt"
```

### Option 3: Sử dụng Docker (nếu database trong Docker)

```bash
# 1. Tạo database
docker exec postgres-db psql -U postgres -c "CREATE DATABASE token_reward_db;"

# 2. Chạy schema script
docker exec -i postgres-db psql -U postgres -d token_reward_db < database-schema.sql

# 3. Verify
docker exec postgres-db psql -U postgres -d token_reward_db -c "SELECT tablename FROM pg_tables WHERE schemaname='public';"
```

### Option 4: Sử dụng Sequelize Auto-sync (Not Recommended for Production)

Script `populate-db.js` sẽ tự động tạo tables:
```bash
node scripts/populate-db.js
```

**⚠️ Warning:** Script này sẽ DROP toàn bộ tables (`force: true`) nên chỉ dùng cho development!

---

## Cài đặt Dependencies

### 1. Install packages

```bash
cd Code-spark/services/token-reward-service
npm install
```

Sẽ cài đặt:
- `express` - Web framework
- `sequelize` - ORM cho PostgreSQL
- `pg`, `pg-hstore` - PostgreSQL drivers
- `ethers` - Blockchain integration
- `dotenv` - Environment variables
- `nodemon` - Development auto-reload

### 2. Install Hardhat dependencies (nếu cần blockchain)

```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox @openzeppelin/contracts
```

---

## Chạy Service

### Development Mode (với auto-reload)

```bash
npm run dev
```

Output mong đợi:
```
[dotenv] Loading environment variables...
⚠️  CONTRACT_ADDRESS not set. Blockchain features will be disabled.
✅ Connection to the database has been established successfully.
✅ Server is running on port 3000.
```

### Production Mode

```bash
npm start
```

### Test kết nối database

```bash
node -e "const db = require('./src/models'); db.sequelize.authenticate().then(() => console.log('✅ Connected')).catch(err => console.error('❌', err));"
```

---

## Test API

### 1. Kiểm tra service đang chạy

```bash
curl http://localhost:3000/health
```

### 2. Test các endpoint chính

**Get Balance:**
```bash
curl http://localhost:3000/api/tokens/balance/2
```

Response:
```json
{
  "tokenBalance": 50
}
```

**Get History:**
```bash
curl "http://localhost:3000/api/tokens/history/2?page=1&limit=10"
```

Response:
```json
{
  "totalItems": 2,
  "totalPages": 1,
  "currentPage": 1,
  "rewards": [
    {
      "id": 3,
      "studentId": 2,
      "tokensAwarded": 20,
      "reasonCode": "COMPLETE_CHALLENGE",
      "transaction_type": "EARN",
      "awardedAt": "2025-10-29T04:16:17.612Z"
    }
  ]
}
```

**Grant Tokens (POST):**
```bash
curl -X POST http://localhost:3000/api/tokens/grant \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 2,
    "amount": 100,
    "reasonCode": "ADMIN_BONUS",
    "relatedId": "test-123"
  }'
```

**Spend Tokens (POST):**
```bash
curl -X POST http://localhost:3000/api/tokens/spend \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 2,
    "amount": 10,
    "reasonCode": "PURCHASE",
    "relatedId": "gift-123"
  }'
```

**Withdraw Tokens (POST):**
```bash
curl -X POST http://localhost:3000/api/tokens/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 2,
    "amount": 20,
    "toAddress": "0x1234567890123456789012345678901234567890"
  }'
```

### 3. Test với Postman

Import collection với các endpoint:
- `GET  http://localhost:3000/api/tokens/balance/:studentId`
- `GET  http://localhost:3000/api/tokens/history/:studentId`
- `POST http://localhost:3000/api/tokens/grant`
- `POST http://localhost:3000/api/tokens/spend`
- `POST http://localhost:3000/api/tokens/withdraw`

---

## Deploy với Docker

### 1. Build Docker Image

```bash
cd Code-spark/services/token-reward-service
docker build -t token-reward-service .
```

### 2. Chạy với Docker Compose

```bash
cd Code-spark
docker-compose up -d postgres-db ganache token-reward-service
```

### 3. Kiểm tra logs

```bash
docker logs token-reward-service --tail 50 -f
```

### 4. Truy cập service

Service sẽ expose ở:
- **Direct**: http://localhost:9009 (mapped từ container port 3000)
- **Via Gateway**: http://localhost:8080/token-reward

### 5. Seed database trong Docker

```bash
docker exec token-reward-service node scripts/populate-db.js
```

---

## Cấu trúc Service

```
token-reward-service/
├── app.js                    # Express app configuration
├── server.js                 # Server entry point
├── package.json              # Dependencies
├── .env                      # Environment variables (create this)
├── database-schema.sql       # Database schema (NEW)
├── Dockerfile               # Docker build
├── hardhat.config.js        # Blockchain config
├── contracts/
│   └── Token.sol            # Smart contract
├── scripts/
│   ├── deploy-contracts.js  # Deploy blockchain contract
│   └── populate-db.js       # Seed database
├── src/
│   ├── config/
│   │   └── db.js            # Database config
│   ├── models/
│   │   ├── index.js         # Sequelize init
│   │   ├── user.model.js    # User model
│   │   └── reward.model.js  # Reward model
│   ├── controllers/
│   │   └── tokenController.js  # Request handlers
│   ├── services/
│   │   ├── tokenService.js     # Business logic
│   │   └── blockchainService.js # Web3 integration
│   └── routes/
│       └── tokenRoutes.js      # API routes
└── artifacts/                # Compiled contracts
```

---

## Workflow đầy đủ

### 1. Setup lần đầu

```bash
# 1. Clone và di chuyển vào thư mục
cd Code-spark/services/token-reward-service

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env (copy từ ví dụ trên)
notepad .env

# 4. Tạo database
psql -U postgres -c "CREATE DATABASE token_reward_db;"

# 5. Chạy schema SQL
psql -U postgres -d token_reward_db -f database-schema.sql

# 6. Verify tables
psql -U postgres -d token_reward_db -c "\dt"

# 7. Khởi động service
npm run dev
```

### 2. Development workflow

```bash
# Terminal 1: Chạy PostgreSQL (nếu chưa chạy)
docker run -d -p 5432:5432 --name postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:latest

# Terminal 2: Chạy Ganache (optional, cho blockchain)
docker run -d -p 7545:7545 \
  trufflesuite/ganache-cli:latest

# Terminal 3: Chạy token-reward-service
cd Code-spark/services/token-reward-service
npm run dev
```

### 3. Test workflow

```bash
# Test get balance
curl http://localhost:3000/api/tokens/balance/2

# Grant tokens to user
curl -X POST http://localhost:3000/api/tokens/grant \
  -H "Content-Type: application/json" \
  -d '{"studentId": 2, "amount": 100, "reasonCode": "TEST"}'

# Verify balance increased
curl http://localhost:3000/api/tokens/balance/2
# Should show: {"tokenBalance": 150}
```

---

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Môi trường chạy | `development` hoặc `production` |
| `PORT` | Port service lắng nghe | `3000` |
| `DB_USER` | PostgreSQL username | `postgres` |
| `DB_PASSWORD` | PostgreSQL password | `your_password` |
| `DB_HOST` | PostgreSQL host | `localhost` hoặc `postgres-db` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `token_reward_db` |
| `WEB3_PROVIDER_URL` | Ganache/Ethereum RPC | `http://localhost:7545` |
| `ACCOUNT_PRIVATE_KEY` | Private key cho deploy contract | `0x...` |
| `CONTRACT_ADDRESS` | Địa chỉ deployed contract | `0x...` |

---

## API Endpoints

### Token Operations

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `POST` | `/api/tokens/grant` | Cấp token cho user | No |
| `POST` | `/api/tokens/spend` | Tiêu token | No |
| `POST` | `/api/tokens/withdraw` | Rút token về blockchain | No |

### Balance & History

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| `GET` | `/api/tokens/balance/:studentId` | Xem số dư token | No |
| `GET` | `/api/tokens/history/:studentId?page=1&limit=10` | Lịch sử giao dịch | No |

---

## Troubleshooting

### Lỗi: "database does not exist"

**Nguyên nhân:** Database `token_reward_db` chưa được tạo

**Giải pháp:**
```bash
# Tạo database
psql -U postgres -c "CREATE DATABASE token_reward_db;"

# Hoặc trong Docker
docker exec postgres-db psql -U postgres -c "CREATE DATABASE token_reward_db;"
```

### Lỗi: "Unable to connect to the database"

**Nguyên nhân:** PostgreSQL chưa chạy hoặc thông tin kết nối sai

**Giải pháp:**
```bash
# Kiểm tra PostgreSQL đang chạy
psql -U postgres -c "SELECT version();"

# Kiểm tra port
netstat -ano | findstr :5432

# Kiểm tra file .env có đúng thông tin
cat .env
```

### Lỗi: "Cannot find module 'express'"

**Nguyên nhân:** Dependencies chưa được cài

**Giải pháp:**
```bash
npm install
```

### Lỗi: "User not found" khi call API

**Nguyên nhân:** User chưa tồn tại trong table `cm_users`

**Giải pháp:**
```sql
-- Insert user vào database
INSERT INTO cm_users (id, token_balance, "createdAt", "updatedAt") 
VALUES (2, 0, NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
```

Hoặc chạy seed script:
```bash
node scripts/populate-db.js
```

### Lỗi: "CONTRACT_ADDRESS not set"

**Nguyên nhân:** Blockchain contract chưa được deploy

**Giải pháp:**
```bash
# Deploy contract (nếu cần blockchain features)
npx hardhat run scripts/deploy-contracts.js --network ganache

# Hoặc bỏ qua warning này nếu không dùng blockchain
# Service vẫn chạy bình thường với off-chain balance
```

### Service không accessible qua API Gateway

**Nguyên nhân:** API Gateway chưa cấu hình route

**Giải pháp:**
Đảm bảo `api-gateway/src/main/resources/application.yml` có:
```yaml
- id: token-reward-service
  uri: http://token-reward-service:3000
  predicates:
    - Path=/token-reward/**
  filters:
    - StripPrefix=1
```

### Port 3000 đã được sử dụng

**Giải pháp:**
```bash
# Tìm process đang dùng port 3000
netstat -ano | findstr :3000

# Kill process (Windows)
taskkill /PID <PID> /F

# Hoặc đổi port trong .env
PORT=3001
```

---

## Database Schema Overview

### Tables Created:

1. **cm_users** - User token balances (3 users)
2. **cm_courses** - Course information (2 courses)
3. **cm_materials** - Learning materials (3 materials)
4. **cm_quizzes** - Quizzes (1 quiz)
5. **cm_questions** - Quiz questions (2 questions)
6. **cm_question_options** - Answer options (6 options)
7. **cm_quiz_submissions** - Student submissions (1 submission)
8. **cm_answers** - Detailed answers (2 answers)
9. **cm_progress** - Student progress (2 records)
10. **cm_rewards** - Token transaction history (6 transactions)

### Sample Data Inserted:

**Users:**
- User ID 1: 100 tokens
- User ID 2: 50 tokens
- User ID 3: 200 tokens

**Rewards:**
- User 1: +10 COMPLETE_LESSON, +50 EXAM_PASS
- User 2: +20 COMPLETE_CHALLENGE, +30 ADMIN_BONUS
- User 3: +100 COURSE_COMPLETION, -50 PURCHASE

---

## Quick Start (TL;DR)

```bash
# 1. Setup
cd Code-spark/services/token-reward-service
npm install
cp .env.example .env  # Edit với thông tin database của bạn

# 2. Database
psql -U postgres -c "CREATE DATABASE token_reward_db;"
psql -U postgres -d token_reward_db -f database-schema.sql

# 3. Run
npm run dev

# 4. Test
curl http://localhost:3000/api/tokens/balance/2
# Expected: {"tokenBalance": 50}
```

---

## Docker Quick Start

```bash
# 1. Start services
cd Code-spark
docker-compose up -d postgres-db token-reward-service

# 2. Seed database
docker exec token-reward-service node scripts/populate-db.js

# 3. Test
curl http://localhost:9009/api/tokens/balance/2

# 4. View logs
docker logs token-reward-service -f
```

---

## Health Check

Service có sẵn health check endpoint (nếu có):
```bash
curl http://localhost:3000/health
```

Hoặc check bằng database connection:
```bash
curl http://localhost:3000/api/tokens/balance/1
# Nếu trả về data = service đang chạy OK
```

---

## Service URLs

### Development (Local)
- Service: http://localhost:3000
- Database: localhost:5432

### Production (Docker)
- Service: http://localhost:9009 (exposed port)
- Via Gateway: http://localhost:8080/token-reward
- Database: postgres-db:5432 (internal)

---

## Logs & Debugging

### View real-time logs

**Local:**
```bash
# Service tự động log ra console khi chạy npm run dev
```

**Docker:**
```bash
docker logs token-reward-service -f
```

### Enable debug mode

Thêm vào `.env`:
```env
DEBUG=*
LOG_LEVEL=debug
```

### Database query logs

Edit `src/models/index.js`:
```javascript
const sequelize = new Sequelize(config.database, config.username, config.password, {
  ...config,
  logging: console.log  // Bật logging
});
```

---

## Next Steps

1. ✅ Chạy service local
2. ✅ Test API endpoints
3. ✅ Tích hợp với frontend
4. 🔲 Deploy smart contract (optional)
5. 🔲 Configure API Gateway routing
6. 🔲 Add authentication/authorization
7. 🔲 Setup monitoring & logging
8. 🔲 Add unit tests

---

## Support

Nếu gặp vấn đề:
1. Check logs: `docker logs token-reward-service`
2. Verify database: `psql -U postgres -d token_reward_db -c "SELECT * FROM cm_users;"`
3. Test API: `curl http://localhost:3000/api/tokens/balance/2`
4. Xem file `TROUBLESHOOTING.md` (nếu có)

---

**Service đã sẵn sàng sử dụng! 🚀**


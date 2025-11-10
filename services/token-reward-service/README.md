# Token Reward Service

Microservice quản lý hệ thống thưởng token (ERC-20) cho học sinh trong platform EduPlatform.

## 🎯 Chức năng chính

- ✅ Cấp token cho học sinh (grant tokens)
- ✅ Tiêu token (spend tokens) 
- ✅ Rút token về blockchain wallet (withdraw)
- ✅ Xem số dư token (get balance)
- ✅ Lịch sử giao dịch có phân trang (transaction history)
- ✅ Off-chain balance management (nhanh)
- ✅ On-chain withdrawal (khi cần)

## 🛠️ Technologies

- **Backend**: Node.js + Express.js
- **ORM**: Sequelize
- **Database**: PostgreSQL
- **Blockchain**: Hardhat + Ethers.js
- **Network**: Ganache (local testnet)

## 📚 Documentation

| File | Nội dung |
|------|----------|
| [QUICK_START.md](./QUICK_START.md) | ⚡ Khởi động nhanh 5 phút |
| [HUONG_DAN_CHAY_SERVICE.md](./HUONG_DAN_CHAY_SERVICE.md) | 📖 Hướng dẫn đầy đủ chi tiết |
| [DBEAVER_SETUP.md](./DBEAVER_SETUP.md) | 🗄️ Setup database với DBeaver |
| [database-schema.sql](./database-schema.sql) | 📝 SQL script tạo tables |
| [env.template](./env.template) | ⚙️ Template cấu hình .env |

## ⚡ Quick Start

```bash
# 1. Cài đặt
npm install

# 2. Cấu hình
copy env.template .env

# 3. Tạo database
psql -U postgres -c "CREATE DATABASE course_db;"
psql -U postgres -d course_db -f database-schema.sql

# 4. Chạy
npm run dev

# 5. Test
curl http://localhost:3000/api/tokens/balance/2
```

Xem chi tiết: [QUICK_START.md](./QUICK_START.md)

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tokens/balance/:studentId` | Xem số dư token |
| `GET` | `/api/tokens/history/:studentId` | Lịch sử giao dịch |
| `POST` | `/api/tokens/grant` | Cấp token (admin) |
| `POST` | `/api/tokens/spend` | Tiêu token |
| `POST` | `/api/tokens/withdraw` | Rút token về blockchain |

## 🗄️ Database Schema

10 tables được tạo:
- `cm_users` - User balances
- `cm_rewards` - Transaction history
- `cm_courses` - Course info
- `cm_materials` - Learning materials
- `cm_quizzes` - Quizzes
- `cm_questions` - Questions
- `cm_question_options` - Answer options
- `cm_quiz_submissions` - Student submissions
- `cm_answers` - Detailed answers
- `cm_progress` - Learning progress

## 🐳 Docker

```bash
# Chạy với Docker Compose
cd Code-spark
docker-compose up -d postgres-db token-reward-service

# Seed data
docker exec token-reward-service node scripts/populate-db.js

# Check logs
docker logs token-reward-service -f
```

## 🔗 Service URLs

| Environment | URL |
|-------------|-----|
| Development | http://localhost:3000 |
| Docker | http://localhost:9009 |
| Via Gateway | http://localhost:8080/token-reward |

## 🧪 Testing

```bash
# Get balance
curl http://localhost:3000/api/tokens/balance/2

# Grant 100 tokens
curl -X POST http://localhost:3000/api/tokens/grant \
  -H "Content-Type: application/json" \
  -d '{"studentId": 2, "amount": 100, "reasonCode": "ADMIN_BONUS"}'

# Check new balance
curl http://localhost:3000/api/tokens/balance/2
```

## 📦 Project Structure

```
token-reward-service/
├── app.js                    # Express app
├── server.js                 # Entry point
├── package.json             
├── .env                      # Config (create from env.template)
├── database-schema.sql       # Database setup
├── src/
│   ├── controllers/          # Request handlers
│   ├── services/             # Business logic
│   ├── models/               # Sequelize models
│   ├── routes/               # API routes
│   └── config/               # Configuration
├── scripts/
│   ├── deploy-contracts.js   # Deploy blockchain
│   └── populate-db.js        # Seed database
└── contracts/
    └── Token.sol             # ERC-20 smart contract
```

## 🔧 Development Scripts

```bash
npm start        # Production mode
npm run dev      # Development mode (with nodemon)
npm test         # Run tests (not implemented yet)
```

## API Endpoints

*   `POST /api/tokens/reward`: Award tokens to a user.
*   `GET /api/users/:id/balance`: Get the token balance of a user.

## Authorization

Các routes sau đây được bảo vệ và yêu cầu quyền cụ thể:

| Method | Route                   | Permission Required   |
|--------|-------------------------|-----------------------|
| POST   | `/grant`                | `token:grant`         |
| POST   | `/spend`                | `token:spend`         |
| GET    | `/balance/:studentId`   | `token:read:self`     |
| GET    | `/history/:studentId`   | `token:read:self`     |
| POST   | `/withdraw`             | `token:withdraw`      |

# Token Reward Service

## Tổng quan

Token Reward Service là một microservice quản lý token rewards, deposit và withdrawal cho hệ thống học tập. Service này tích hợp với blockchain Ethereum để xử lý token transactions và database PostgreSQL để lưu trữ dữ liệu.

## Kiến trúc

- **Node.js** + **Express.js** - Web framework
- **Sequelize** + **PostgreSQL** - Database ORM và DBMS
- **Ethers.js** - Blockchain interaction
- **WebSocket** - Real-time blockchain event listening

## Cấu trúc thư mục

```
token-reward-service/
├── src/
│   ├── controllers/     # API controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic services
│   └── config/        # Configuration files
├── scripts/           # Utility scripts
├── contracts/         # Smart contract files
├── artifacts/         # Contract deployment artifacts
└── server.js          # Main server entry point
```

## Cài đặt và Cấu hình

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình environment variables

Copy file template và cấu hình:

```bash
cp env.template .env
```

Cấu hình các biến trong `.env`:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5433
DB_NAME=course
DB_USER=postgres
DB_PASSWORD=password

# Blockchain Configuration
WEB3_PROVIDER_URL=https://your-rpc-url
CONTRACT_ADDRESS=0x...
PRIVATE_KEY=your_private_key

# Server Configuration
PORT=3001
NODE_ENV=development

# Reward Configuration
REWARD_DEPOSIT_ADDRESS=0x...
```

### 3. Khởi tạo database

```bash
npm run init-db
```

## Các cách chạy service

### 1. Chạy với database (Production)

```bash
npm start
# hoặc
node server.js
```

### 2. Chạy development mode với auto-restart

```bash
npm run dev
```

### 3. Chạy với database safe mode

```bash
npm run start-safe
# hoặc
node server-safe.js
```

### 4. Chạy với database initialization

```bash
npm run start-with-init
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Đăng nhập

### Wallet Management
- `GET /api/wallet` - Lấy wallet thông tin
- `POST /api/wallet/link` - Link wallet với user
- `DELETE /api/wallet/unlink` - Unlink wallet

### Token Operations
- `GET /api/tokens/balance/:studentId` - Xem balance
- `POST /api/tokens/withdraw` - Rút tokens
- `GET /api/tokens/history/:studentId` - Lịch sử transactions

### Rewards
- `GET /api/rewards/history/:studentId` - Lịch sử rewards
- `POST /api/rewards/award` - Tạo reward mới

### Blockchain
- `GET /api/blockchain/contract-info` - Thông tin contract
- `POST /api/blockchain/check-tx` - Kiểm tra transaction

## Testing

### 1. Test Database Connection

```bash
node scripts/init-database.js
```

### 2. Test Blockchain Connection

```bash
node scripts/checkTx.js <transaction_hash>
```

### 3. Test User Creation

```bash
node scripts/add-test-user.js <student_id> <initial_balance>
```

### 4. Test Token Operations

#### Test Withdrawal
```bash
curl -X POST http://localhost:3001/api/tokens/withdraw \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": 12345,
    "amount": 100,
    "toAddress": "0x742d35Cc6634C0532925a3b8D4C9db96C4b4Db45"
  }'
```

#### Test Balance Check
```bash
curl http://localhost:3001/api/tokens/balance/12345
```

#### Test Transaction History
```bash
curl http://localhost:3001/api/tokens/history/12345
```

## Scripts hữu ích

### Database Scripts
- `npm run init-db` - Khởi tạo database
- `npm run init-db-safe` - Khởi tạo database với safe mode

### Utility Scripts
- `scripts/populate-db.js` - Populate database với test data
- `scripts/add-test-user.js` - Thêm test user
- `scripts/checkTx.js` - Kiểm tra transaction status
- `scripts/deploy-contracts.js` - Deploy smart contracts
- `scripts/prime-escrow.js` - Prime escrow contracts

## Flow hoạt động

### 1. Deposit Flow
1. User gửi tokens đến `REWARD_DEPOSIT_ADDRESS`
2. `depositListener` lắng nghe blockchain events
3. System ghi nhận deposit vào database
4. Tokens được credit vào user balance

### 2. Withdrawal Flow
1. User request withdrawal với `toAddress`
2. System kiểm tra user có linked wallet không
3. Tạo withdrawal record với `walletAddress` = linked wallet
4. Gửi tokens đến `toAddress` qua blockchain
5. Cập nhật withdrawal status

### 3. Reward Flow
1. Admin/Teacher tạo reward cho student
2. Tokens được credit vào user balance
3. Reward record được tạo với reason code

## Các lỗi thường gặp và cách fix

### 1. Connection Manager Error
```
ConnectionManager.getConnection was called after the connection manager was closed!
```
**Fix**: Service đã được sửa để giữ connection open sau khi init database.

### 2. Foreign Key Constraint Error
```
insert or update on table "cm_token_withdrawals" violates foreign key constraint
```
**Fix**: Service đã được sửa để sử dụng linked wallet address thay vì toAddress.

### 3. Database Connection Error
**Fix**: Kiểm tra `.env` configuration và đảm bảo PostgreSQL đang chạy.

## File không sử dụng (có thể xóa)

Dựa trên phân tích code, các file sau không được sử dụng và có thể xóa:

### Scripts không sử dụng:
- `scripts/prime-escrow.js` - Không được require ở đâu
- `scripts/checkTx.js` - Không được require ở đâu 
- `scripts/deploy-contracts.js` - Không được require ở đâu
- `scripts/add-test-user.js` - Không được require ở đâu

### Server files không sử dụng:
- `server-no-db.js` - Không được require ở đâu
- `server-safe.js` - Chỉ được require bởi chính nó

### Config không sử dụng:
- `src/config/websocket.js` - Không được require ở đâu
- `src/index.js` - Không được require ở đâu

### Models không sử dụng:
- `src/models/gift.model.js` - Chỉ được require bởi server files không sử dụng

**Lưu ý**: Trước khi xóa, hãy đảm bảo các file này không được sử dụng trong deployment scripts hoặc CI/CD pipeline.

## Monitoring và Logs

Service sử dụng console.log cho logging. Các log quan trọng:

- `🔧 Đang kiểm tra và khởi tạo database...` - Database initialization
- `✅ Database sẵn sàng!` - Database ready
- `📡 API: http://localhost:9009/api/tokens` - API endpoint
- `depositListener: Live subscription started` - Blockchain listener started
- `✅ On-chain withdrawal completed` - Withdrawal successful

## Security Notes

- Private key được lưu trong environment variable
- Database connection sử dụng environment variables
- API endpoints cần authentication token
- Smart contract interactions được validated

## Development Notes

- Sử dụng `nodemon` cho development auto-restart
- Database models sử dụng Sequelize ORM
- Blockchain interactions sử dụng Ethers.js
- Real-time events qua WebSocket subscriptions

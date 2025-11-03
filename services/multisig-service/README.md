# Multisig Wallet Service

Backend service cho ví đa chữ ký (Multisig Wallet) - Chỉ giao dịch khi đủ số chữ ký xác nhận.

## 📋 Mô tả

Service này quản lý các ví đa chữ ký trên blockchain Ethereum. Một giao dịch chỉ được thực thi khi đủ số lượng chữ ký xác nhận theo ngưỡng (threshold) được thiết lập.

## 🏗️ Kiến trúc

- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Sequelize ORM)
- **Blockchain**: Ethereum với Truffle Framework
- **Smart Contract**: MultiSigWallet.sol
- **Deployment**: Docker + Docker Compose

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 18+ (cho development local)
- Metamask (để kết nối với blockchain)
- PostgreSQL

### 1. Cấu hình Environment Variables

Tạo file `.env` trong thư mục `services/multisig-service/`:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASSWORD=your_password

# Blockchain (Truffle/Ganache)
WEB3_PROVIDER_URL=http://localhost:7545
NETWORK_ID=5777

# JWT (optional - nếu cần auth)
JWT_SECRET=your_jwt_secret_key
```

### 2. Chạy với Docker Compose

```bash
# Từ root của project
docker-compose up -d multisig-service postgres-db ganache
```

### 3. Deploy Smart Contracts

```bash
cd services/multisig-service

# Deploy contracts với Truffle
truffle migrate --network development

# Hoặc nếu chạy trong Docker
docker exec -it multisig-service npm run migrate
```

### 4. Chạy Service

```bash
# Local development
npm install
npm run dev

# Production
npm start
```

## 📚 API Endpoints

### Health Check
- `GET /health` - Health check endpoint

### Wallet Management
- `POST /api/v1/wallets` - Tạo ví mới
- `GET /api/v1/wallets` - Lấy danh sách ví
- `GET /api/v1/wallets/:walletId` - Lấy thông tin ví
- `POST /api/v1/wallets/:walletId/link` - Liên kết ví đã có

### Transaction Operations
- `POST /api/v1/wallets/:walletId/transactions` - Submit giao dịch mới
- `GET /api/v1/wallets/:walletId/transactions` - Lấy danh sách giao dịch
- `GET /api/v1/transactions/:txId` - Lấy thông tin giao dịch
- `POST /api/v1/transactions/:txId/confirm` - Xác nhận giao dịch
- `POST /api/v1/transactions/:txId/execute` - Thực thi giao dịch (khi đủ chữ ký)

## 📝 API Documentation

### POST /api/v1/wallets

Tạo ví multisig mới.

**Request Body:**
```json
{
  "name": "My Multisig Wallet",
  "description": "Ví cho team",
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bD432803012645Hac136c22C39e7",
    "0x3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b"
  ],
  "threshold": 2
}
```

**Response:**
```json
{
  "id": "uuid-here",
  "name": "My Multisig Wallet",
  "contractAddress": "0x...",
  "owners": [...],
  "threshold": 2,
  "balance": "0.0",
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/v1/wallets/:walletId/transactions

Submit một giao dịch mới.

**Request Body:**
```json
{
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "1.5",
  "data": "0x",
  "from": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "privateKey": "0x..." // Private key của owner (không bắt buộc nếu dùng Metamask)
}
```

**Response:**
```json
{
  "id": "tx-uuid",
  "walletId": "wallet-uuid",
  "txIndexOnChain": 0,
  "txHash": "0x...",
  "destination": "0x...",
  "value": "1500000000000000000",
  "status": "submitted",
  "confirmations": [],
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### POST /api/v1/transactions/:txId/confirm

Xác nhận một giao dịch (cần signature từ owner).

**Request Body:**
```json
{
  "from": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "privateKey": "0x..." // Optional - có thể dùng Metamask thay thế
}
```

### POST /api/v1/transactions/:txId/execute

Thực thi giao dịch khi đủ số confirmations.

**Request Body:**
```json
{
  "from": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "privateKey": "0x..."
}
```

## 🧪 Testing với Postman

### Collection Import

1. Import file `multisig-service.postman_collection.json` vào Postman
2. Cấu hình environment variables:
   - `baseUrl`: `http://localhost:3001`
   - `walletId`: ID của ví (sau khi tạo)

### Test Flow

1. **Tạo ví**: POST `/api/v1/wallets`
2. **Submit transaction**: POST `/api/v1/wallets/:walletId/transactions`
3. **Confirm transaction**: POST `/api/v1/transactions/:txId/confirm` (lặp lại cho mỗi owner)
4. **Execute transaction**: POST `/api/v1/transactions/:txId/execute` (khi đủ threshold)

## 🔧 Development

### Project Structure

```
services/multisig-service/
├── contracts/              # Smart contracts
│   └── MultiSigWallet.sol
├── migrations/             # Truffle migrations
│   └── 1_initial_migration.js
│   └── 2_deploy_multisig.js
├── src/
│   ├── config/            # Configuration
│   │   ├── db.js         # Database config
│   │   ├── web3.js       # Blockchain config
│   │   └── index.js      # General config
│   ├── controllers/      # Route handlers
│   │   └── multisig.controller.js
│   ├── models/           # Database models
│   │   ├── multisigWallet.model.js
│   │   ├── multisigTransaction.model.js
│   │   └── index.js
│   ├── routes/           # API routes
│   │   └── multisig.routes.js
│   ├── services/         # Business logic
│   │   ├── multisig.service.js
│   │   └── blockchain.service.js
│   ├── middleware/       # Express middleware
│   │   └── error.js
│   ├── app.js            # Express app
│   └── server.js         # Server entry point
├── truffle-config.js     # Truffle configuration
├── Dockerfile
├── package.json
└── .env.example
```

### Database Schema

**multisig_wallets**
- id (UUID, PK)
- name (STRING)
- description (TEXT)
- contractAddress (STRING, UNIQUE)
- owners (ARRAY/JSON)
- threshold (INTEGER)
- createdAt, updatedAt

**multisig_transactions**
- id (UUID, PK)
- walletId (UUID, FK)
- txIndexOnChain (INTEGER)
- txHash (STRING)
- destination (STRING)
- value (STRING/BIGINT)
- data (STRING)
- status (ENUM: submitted, confirmed, executed, failed)
- confirmations (ARRAY/JSON)
- createdAt, updatedAt

## 🔐 Security Notes

- **Private Keys**: Không lưu private keys trong database. Chỉ nhận từ request (temporary).
- **Metamask Integration**: Ưu tiên sử dụng Metamask cho signing thay vì private keys.
- **Input Validation**: Validate tất cả inputs trước khi gửi lên blockchain.

## 🐛 Troubleshooting

### Contract không deploy được
```bash
# Kiểm tra Truffle config
truffle compile

# Kiểm tra network
truffle networks

# Deploy lại
truffle migrate --reset --network development
```

### Database connection error
```bash
# Kiểm tra PostgreSQL đang chạy
docker ps | grep postgres

# Kiểm tra logs
docker logs postgres-db
```

### Transaction failed
- Kiểm tra số dư account
- Kiểm tra gas limit
- Kiểm tra network ID

## 📄 License

MIT License


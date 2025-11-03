# 📘 Hướng Dẫn Đầy Đủ: Multisig Wallet Service

## 🎯 Mục tiêu
Xây dựng backend service cho ví đa chữ ký (Multisig Wallet) - **Chỉ giao dịch khi đủ số chữ ký xác nhận**.

## 🛠️ Công nghệ sử dụng
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Sequelize ORM)
- **Blockchain**: Ethereum với Truffle Framework
- **Testing**: Postman
- **Deployment**: Docker + Docker Compose
- **Wallet**: Metamask (cho signing)

## 📋 Bước 1: Setup Môi Trường

### 1.1 Cài đặt Dependencies

```bash
cd services/multisig-service
npm install
```

### 1.2 Cấu hình Environment Variables

Tạo file `.env` từ template:

**Trên Windows PowerShell:**
```powershell
Copy-Item env.example .env
```

**Trên Linux/Mac:**
```bash
cp env.example .env
```

Sau đó chỉnh sửa file `.env` với thông tin của bạn:

```bash
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASSWORD=your_password  # ⚠️ Đổi thành password của bạn

# Blockchain (Ganache cho local development)
WEB3_PROVIDER_URL=http://localhost:7545
NETWORK_ID=5777

# Deployer (Lấy từ Ganache UI)
DEPLOYER_ADDRESS=0x...  # Copy từ Ganache
DEPLOYER_PRIVATE_KEY=0x...  # Copy từ Ganache (⚠️ KHÔNG share key này)
```

### 1.3 Setup Database

```bash
# Tạo database
createdb multisig_db

# Hoặc dùng PostgreSQL client
psql -U postgres
CREATE DATABASE multisig_db;
```

## 📋 Bước 2: Setup Blockchain với Truffle

### 2.1 Cài đặt Ganache (Local Blockchain)

1. Tải Ganache: https://trufflesuite.com/ganache/
2. Khởi động Ganache trên port 7545
3. Lấy danh sách accounts và private keys

### 2.2 Compile Smart Contracts

```bash
# Compile contracts
truffle compile

# Kết quả: build/contracts/MultiSigWallet.json
```

### 2.3 Deploy Contracts (Optional - deploy qua API)

Contract sẽ được deploy tự động qua API endpoint `POST /api/v1/wallets`.

Hoặc deploy thủ công:
```bash
truffle migrate --network development
```

## 📋 Bước 3: Chạy Service

### 3.1 Local Development

```bash
# Khởi động PostgreSQL và Ganache trước
npm run dev
```

### 3.2 Với Docker

```bash
# Từ root của project
docker-compose up -d postgres-db ganache multisig-service
```

## 📋 Bước 4: Test API với Postman

### 4.1 Import Postman Collection

Tạo collection trong Postman với các endpoints sau:

### 4.2 Test Flow

#### **1. Tạo Ví Multisig**

**Request:**
```
POST http://localhost:3001/api/v1/wallets
Content-Type: application/json
```

**Body:**
```json
{
  "name": "Team Wallet",
  "description": "Ví cho team development",
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bD432803012645Hac136c22C39e7",
    "0x3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b"
  ],
  "threshold": 2,
  "deployerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "deployerPrivateKey": "0x..." // Private key của deployer từ Ganache
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "name": "Team Wallet",
    "contractAddress": "0x...",
    "owners": [...],
    "threshold": 2,
    "balance": "0.0"
  },
  "message": "Wallet created successfully"
}
```

**Lưu ý:** Lưu `walletId` và `contractAddress` để dùng cho các bước sau.

#### **2. Submit Transaction**

**Request:**
```
POST http://localhost:3001/api/v1/wallets/{walletId}/transactions
Content-Type: application/json
```

**Body:**
```json
{
  "destination": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "value": "1.5",
  "data": "0x",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..." // Private key của owner (from address)
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "walletId": "wallet-uuid",
    "txIndexOnChain": 0,
    "txHash": "0x...",
    "destination": "0x...",
    "value": "1500000000000000000",
    "status": "submitted",
    "confirmations": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Transaction submitted successfully"
}
```

**Lưu ý:** Lưu `txId` (transaction ID) để confirm sau.

#### **3. Confirm Transaction (Owner 1)**

**Request:**
```
POST http://localhost:3001/api/v1/transactions/{txId}/confirm
Content-Type: application/json
```

**Body:**
```json
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..." // Private key của owner 1
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "status": "submitted", // hoặc "confirmed" nếu đủ threshold
    "confirmations": ["0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"]
  },
  "message": "Transaction confirmed successfully"
}
```

#### **4. Confirm Transaction (Owner 2)**

Lặp lại bước 3 với owner thứ 2:

**Body:**
```json
{
  "from": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "privateKey": "0x..." // Private key của owner 2
}
```

**Response:** Status sẽ là `"confirmed"` vì đã đủ 2 confirmations (threshold = 2).

#### **5. Execute Transaction**

**Request:**
```
POST http://localhost:3001/api/v1/transactions/{txId}/execute
Content-Type: application/json
```

**Body:**
```json
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..." // Private key của bất kỳ owner nào
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "tx-uuid",
    "status": "executed",
    "txHash": "0x..."
  },
  "message": "Transaction executed successfully"
}
```

### 4.3 Các API Endpoints Khác

#### **Lấy Danh Sách Ví**
```
GET http://localhost:3001/api/v1/wallets
```

#### **Lấy Thông Tin Ví**
```
GET http://localhost:3001/api/v1/wallets/{walletId}
```

#### **Lấy Danh Sách Transactions của Ví**
```
GET http://localhost:3001/api/v1/wallets/{walletId}/transactions
```

#### **Lấy Thông Tin Transaction**
```
GET http://localhost:3001/api/v1/transactions/{txId}
```

#### **Health Check**
```
GET http://localhost:3001/health
```

## 📋 Bước 5: Tích hợp Metamask (Optional)

### 5.1 Setup Metamask

1. Cài đặt Metamask extension
2. Thêm Ganache network:
   - Network Name: Ganache Local
   - RPC URL: http://localhost:7545
   - Chain ID: 5777
   - Currency Symbol: ETH

3. Import accounts từ Ganache vào Metamask

### 5.2 Sử dụng Metamask với API

Thay vì gửi `privateKey` trong request body, bạn có thể:
- Sign transaction từ frontend với Metamask
- Gửi signed transaction lên backend
- Backend chỉ verify và relay transaction lên blockchain

## 📋 Bước 6: Docker Deployment

### 6.1 Docker Compose Configuration

Đảm bảo `docker-compose.yml` ở root có:

```yaml
multisig-service:
  build: ./services/multisig-service
  container_name: multisig-service
  ports:
    - "3001:3001"
  environment:
    - PORT=3001
    - DB_HOST=postgres-db
    - DB_PORT=5432
    - DB_NAME=multisig_db
    - DB_USER=${POSTGRES_USER}
    - DB_PASSWORD=${POSTGRES_PASSWORD}
    - WEB3_PROVIDER_URL=http://ganache:8545
    - NETWORK_ID=5777
  depends_on:
    - postgres-db
    - ganache
```

### 6.2 Build và Run

```bash
docker-compose build multisig-service
docker-compose up -d multisig-service
```

## 🐛 Troubleshooting

### Lỗi: Contract not found
```bash
# Giải pháp: Compile contracts
truffle compile
```

### Lỗi: Database connection failed
```bash
# Kiểm tra PostgreSQL đang chạy
docker ps | grep postgres
docker logs postgres-db
```

### Lỗi: Transaction failed
- Kiểm tra account có đủ ETH để trả gas
- Kiểm tra owners addresses có đúng không
- Kiểm tra threshold có hợp lệ không

### Lỗi: Not enough confirmations
- Đảm bảo đã confirm đủ số lượng owners (threshold)
- Kiểm tra status của transaction trước khi execute

## 📝 Checklist Hoàn Thành

- [ ] Setup database PostgreSQL
- [ ] Setup Ganache blockchain
- [ ] Compile smart contracts với Truffle
- [ ] Chạy service thành công
- [ ] Test tạo ví thành công
- [ ] Test submit transaction thành công
- [ ] Test confirm transaction (đủ owners)
- [ ] Test execute transaction thành công
- [ ] Setup Postman collection
- [ ] Test toàn bộ flow hoàn chỉnh

## 🎓 Kết Luận

Service đã hỗ trợ đầy đủ các chức năng:
1. ✅ Tạo và quản lý ví multisig
2. ✅ Submit transactions
3. ✅ Confirm transactions (đa chữ ký)
4. ✅ Execute transactions khi đủ chữ ký
5. ✅ Track transaction status
6. ✅ Integration với Truffle và PostgreSQL

**Lưu ý:** Với production, cần:
- Bảo mật private keys (không lưu trong DB)
- Sử dụng HD Wallet hoặc Hardware Wallet
- Implement rate limiting và authentication
- Monitor blockchain events
- Error handling và retry logic


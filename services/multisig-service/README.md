# 🔐 Multisig Wallet Service

Dịch vụ backend Node.js cho **Ví đa chữ ký (Multisig Wallet)** - Chỉ giao dịch khi đủ số chữ ký xác nhận.

## 📋 Mô tả đề tài

**Ví đa chữ ký (Multisig Wallet)** - Chỉ giao dịch khi đủ số chữ ký xác nhận

Hệ thống này cho phép:
- Tạo ví đa chữ ký với nhiều owners và threshold (số lượng chữ ký tối thiểu)
- Submit giao dịch cần nhiều chữ ký để thực thi
- Chỉ thực thi giao dịch khi đủ số lượng xác nhận (threshold)
- Tích hợp blockchain Ethereum để đảm bảo tính minh bạch và bất biến

## 🛠️ Công nghệ sử dụng

### Backend:
- **Node.js** 18+
- **Express.js** - Web framework
- **PostgreSQL** + **Sequelize ORM** - Database
- **Web3.js** - Tương tác với blockchain
- **Solidity** - Smart contract
- **Eureka** - Service Discovery (tùy chọn)

### Blockchain:
- **Ganache** - Local Ethereum blockchain
- **OpenZeppelin** - Smart contract libraries

## 📁 Cấu trúc dự án

```
multisig-service/
├── src/
│   ├── config/
│   │   ├── index.js          # Cấu hình tổng hợp
│   │   ├── database.js       # Sequelize connection
│   │   └── web3.js           # Web3 & Solidity compilation
│   ├── contracts/
│   │   └── MultiSigWallet.sol  # Smart contract
│   ├── controllers/
│   │   └── multisig.controller.js  # HTTP handlers
│   ├── services/
│   │   ├── multisig.service.js    # Business logic
│   │   └── blockchain.service.js  # Blockchain interactions
│   ├── models/
│   │   ├── index.js
│   │   ├── multisigWallet.model.js
│   │   └── multisigTransaction.model.js
│   ├── routes/
│   │   └── multisig.routes.js
│   ├── discovery/
│   │   └── client.js        # Eureka client
│   ├── utils/
│   │   └── asyncHandler.js
│   └── server.js            # Entry point
├── .env.example
├── Dockerfile
├── package.json
└── README.md
```

## 🚀 Hướng dẫn cài đặt và chạy

### Yêu cầu hệ thống

1. **Node.js** 18+ 
2. **PostgreSQL** 12+
3. **Ganache** (hoặc Ethereum node)
4. **npm** hoặc **yarn**

### Bước 1: Clone và cài đặt dependencies

```bash
cd services/multisig-service
npm install
```

### Bước 2: Cấu hình môi trường

Tạo file `.env` từ `.env.example`:

```bash
cp .env.example .env
```

Cập nhật các biến môi trường trong `.env`:

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASS=your_password

# Blockchain (Ganache)
RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=your_deployer_private_key
SERVICE_ACCOUNT_PRIVATE_KEY=your_service_account_private_key

# Service Discovery (Optional)
EUREKA_ENABLED=false
EUREKA_HOST=localhost
EUREKA_PORT=9999

# JWT
JWT_SECRET=your-secret-key
```

### Bước 3: Chuẩn bị Database

#### Option 1: Dùng Docker (Khuyến nghị)

Dự án đã có cấu hình PostgreSQL trong `docker-compose.yml`. Chỉ cần:

```bash
# Từ thư mục gốc dự án
docker-compose up -d postgres-db

# Tạo database (nếu chưa có)
docker exec postgres-db psql -U postgres -c "CREATE DATABASE multisig_db;"

# Hoặc dùng script helper
cd services/multisig-service
.\scripts\setup-database.ps1
```

**Truy cập PostgreSQL qua Docker:**

**Windows PowerShell:**
```powershell
# Vào psql shell
.\scripts\psql.ps1

# Hoặc chạy query trực tiếp
.\scripts\psql.ps1 "SELECT version();"
```

**Linux/Mac:**
```bash
# Vào psql shell
./scripts/psql.sh

# Hoặc chạy query trực tiếp
./scripts/psql.sh "SELECT version();"
```

**Hoặc dùng Docker trực tiếp:**
```bash
# Vào psql shell
docker exec -it postgres-db psql -U postgres -d multisig_db

# Chạy query
docker exec postgres-db psql -U postgres -d multisig_db -c "SELECT version();"
```

#### Option 2: Cài PostgreSQL Local (Windows)

Nếu muốn cài PostgreSQL trên Windows:

1. Tải từ: https://www.postgresql.org/download/windows/
2. Cài đặt và nhớ password cho user `postgres`
3. Thêm PostgreSQL vào PATH:
   - Mở System Properties → Environment Variables
   - Thêm `C:\Program Files\PostgreSQL\<version>\bin` vào PATH
4. Tạo database:
```bash
psql -U postgres
CREATE DATABASE multisig_db;
```

### Bước 4: Khởi động Ganache (Local Blockchain)

**Cách 1: Docker Compose** (khuyến nghị)

```bash
# Từ thư mục gốc dự án
docker-compose up -d ganache
```

**Cách 2: Ganache CLI**

```bash
ganache-cli --host 0.0.0.0 --port 8545
```

**Lấy Private Key từ Ganache:**
- Mở Ganache UI hoặc xem logs
- Copy một private key từ danh sách accounts
- Dùng làm `SERVICE_ACCOUNT_PRIVATE_KEY` trong `.env`

### Bước 5: Chạy ứng dụng

```bash
npm start
```

Hoặc development mode (với nodemon):

```bash
npm run dev
```

Server sẽ chạy tại: `http://localhost:3001`

## 📡 API Endpoints

### 1. Health Check
```
GET /health
```

### 2. Quản lý Ví (Wallet)

#### Tạo ví mới
```
POST /api/v1/multisig
Content-Type: application/json

{
  "name": "Team Wallet",
  "description": "Ví của team",
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bD432803012645Hac136c22C4e2",
    "0x1234567890123456789012345678901234567890"
  ],
  "threshold": 2
}
```

**Lưu ý:** `owners` phải bao gồm `SERVICE_ACCOUNT_PRIVATE_KEY` để service có thể ký giao dịch.

#### Liên kết ví đã có
```
POST /api/v1/multisig/link
Content-Type: application/json

{
  "name": "Existing Wallet",
  "description": "Link existing wallet",
  "contractAddress": "0x..."
}
```

#### Lấy thông tin ví
```
GET /api/v1/multisig/:walletId
```

### 3. Quản lý Giao dịch (Transaction)

#### Lấy danh sách giao dịch
```
GET /api/v1/multisig/:walletId/transactions
```

#### Submit giao dịch mới
```
POST /api/v1/multisig/:walletId/transactions
Content-Type: application/json

{
  "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "0.1",  // Ether
  "data": "0x"     // Optional
}
```

#### Xác nhận giao dịch
```
POST /api/v1/multisig/transactions/:txId/confirm
```

**Lưu ý:** Hiện tại service tự động ký bằng service account. Trong tương lai sẽ hỗ trợ nhiều owners ký.

#### Thực thi giao dịch
```
POST /api/v1/multisig/transactions/:txId/execute
```

**Lưu ý:** Chỉ thực thi khi đủ số lượng confirmations (>= threshold).

## 🔧 Cách hoạt động

### 1. Luồng tạo ví mới:
```
User Request → Service → Deploy Smart Contract → Save to DB → Return Wallet
```

### 2. Luồng submit transaction:
```
User Request → Service → Submit to Blockchain → Save to DB → Return Transaction
```

### 3. Luồng confirm transaction:
```
User Request → Service → Confirm on Blockchain → Update DB → Return Transaction
```

### 4. Luồng execute transaction:
```
User Request → Service → Check Threshold → Execute on Blockchain → Update DB → Return Transaction
```

### Quy tắc Multisig:

- **Threshold**: Số lượng chữ ký tối thiểu cần để thực thi giao dịch
- **Owners**: Danh sách các địa chỉ có quyền ký giao dịch
- **Service Account**: Phải là một owner để service có thể tự động ký

**Ví dụ:**
- 3 owners, threshold = 2
- Cần ít nhất 2 owners ký để thực thi giao dịch

## 🐳 Chạy với Docker

### Build image:
```bash
docker build -t multisig-service .
```

### Run container:
```bash
docker run -d \
  -p 3001:3001 \
  --env-file .env \
  --name multisig-service \
  multisig-service
```

### Hoặc dùng Docker Compose (từ thư mục gốc):
```bash
docker-compose up -d multisig-service
```

## 📊 Database Schema

### MultisigWallet:
- `id` (UUID) - Primary Key
- `contractAddress` (String) - Địa chỉ smart contract
- `name` (String)
- `description` (Text)
- `creatorId` (UUID) - Người tạo
- `owners` (Array<String>) - Danh sách owners
- `threshold` (Integer) - Số chữ ký tối thiểu

### MultisigTransaction:
- `id` (UUID) - Primary Key
- `walletId` (UUID) - Foreign Key → MultisigWallet
- `txIndexOnChain` (Integer) - Index trên blockchain
- `txHash` (String) - Transaction hash
- `destination` (String) - Địa chỉ nhận
- `value` (String) - Giá trị (Wei)
- `data` (Text) - Data
- `status` (ENUM) - submitted/confirmed/executed/failed
- `confirmations` (Array<String>) - Danh sách địa chỉ đã ký

## 🧪 Testing với Postman/cURL

### Tạo ví mới:
```bash
curl -X POST http://localhost:3001/api/v1/multisig \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Wallet",
    "owners": [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "0x8ba1f109551bD432803012645Hac136c22C4e2"
    ],
    "threshold": 2
  }'
```

### Submit transaction:
```bash
curl -X POST http://localhost:3001/api/v1/multisig/WALLET_ID/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "value": "0.01"
  }'
```

## ⚠️ Lưu ý quan trọng

1. **Service Account phải là Owner**: Khi tạo ví, đảm bảo service account nằm trong danh sách owners.

2. **Private Key bảo mật**: Không commit private key lên git. Dùng `.env` và `.gitignore`.

3. **Threshold hợp lý**: 
   - Threshold <= số lượng owners
   - Threshold >= 1

4. **Gas Limit**: Đảm bảo account có đủ ETH để trả gas fee.

5. **Nonce Management**: Service tự động quản lý nonce để tránh conflict.

## 🔒 Bảo mật

- Private keys được lưu trong environment variables
- JWT authentication (sẽ triển khai)
- Input validation và sanitization
- Rate limiting (có thể thêm)

## 🚧 Tính năng sắp tới

- [ ] JWT Authentication middleware
- [ ] Hỗ trợ nhiều owners ký giao dịch (không chỉ service account)
- [ ] WebSocket cho real-time updates
- [ ] Rate limiting
- [ ] Transaction history pagination
- [ ] Export/Import wallets

## 📝 Troubleshooting

### Lỗi: "Cannot connect to database"
- Kiểm tra PostgreSQL đang chạy
- Kiểm tra credentials trong `.env`
- Đảm bảo database `multisig_db` đã được tạo

### Lỗi: "Cannot connect to blockchain"
- Kiểm tra Ganache đang chạy trên port 8545
- Kiểm tra `RPC_URL` trong `.env`

### Lỗi: "Service Account phải nằm trong danh sách owners"
- Khi tạo ví, phải bao gồm địa chỉ của `SERVICE_ACCOUNT_PRIVATE_KEY` trong mảng `owners`

### Lỗi: "Not enough confirmations"
- Cần đủ số lượng confirmations bằng threshold để thực thi
- Kiểm tra `confirmations.length >= threshold`

## 📚 Tài liệu tham khảo

- [Web3.js Documentation](https://web3js.readthedocs.io/)
- [Solidity Documentation](https://docs.soliditylang.org/)
- [Sequelize Documentation](https://sequelize.org/)
- [Express.js Documentation](https://expressjs.com/)

## 👥 Đóng góp

1. Fork repository
2. Tạo feature branch
3. Commit changes
4. Push và tạo Pull Request

## 📄 License

MIT License


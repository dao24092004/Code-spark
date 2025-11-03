# 📚 HƯỚNG DẪN CHI TIẾT - Multisig Wallet Service

## 🎯 Đề tài: Ví đa chữ ký (Multisig Wallet)

**Yêu cầu:** Chỉ giao dịch khi đủ số chữ ký xác nhận

## 📖 Tổng quan

Hệ thống cho phép tạo ví blockchain yêu cầu nhiều chữ ký (multisig) để thực thi giao dịch. Một giao dịch chỉ được thực thi khi có đủ số lượng chữ ký xác nhận theo ngưỡng (threshold) đã định.

## 🛠️ Công cụ và công nghệ sử dụng

### 1. **Backend Framework:**
- **Node.js** (v18+)
- **Express.js** - Web framework
- **Sequelize ORM** - Quản lý database

### 2. **Database:**
- **PostgreSQL** - Lưu trữ thông tin ví và giao dịch

### 3. **Blockchain:**
- **Ethereum** (Ganache local)
- **Web3.js** - Thư viện tương tác blockchain
- **Solidity** - Ngôn ngữ smart contract
- **OpenZeppelin** - Thư viện smart contract chuẩn

### 4. **Development Tools:**
- **nodemon** - Auto-reload khi development
- **dotenv** - Quản lý environment variables
- **Docker** - Containerization (tùy chọn)

### 5. **Service Discovery (Tùy chọn):**
- **Eureka** - Netflix Service Discovery

## 📋 Các bước triển khai

### **BƯỚC 1: Cài đặt môi trường**

#### 1.1. Cài đặt Node.js
```bash
# Kiểm tra phiên bản
node --version  # Phải >= 18

# Nếu chưa có, tải từ: https://nodejs.org/
```

#### 1.2. Cài đặt PostgreSQL
```bash
# Windows: Tải từ https://www.postgresql.org/download/windows/
# Hoặc dùng Chocolatey:
choco install postgresql

# MacOS:
brew install postgresql

# Linux (Ubuntu):
sudo apt-get install postgresql
```

#### 1.3. Khởi động PostgreSQL
```bash
# Windows (Services)
# Tìm "PostgreSQL" trong Services và Start

# MacOS/Linux:
sudo service postgresql start
# hoặc
pg_ctl -D /usr/local/var/postgres start
```

#### 1.4. Tạo Database
```bash
# Vào PostgreSQL CLI
psql -U postgres

# Tạo database
CREATE DATABASE multisig_db;

# Tạo user (tùy chọn)
CREATE USER multisig_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE multisig_db TO multisig_user;

# Thoát
\q
```

### **BƯỚC 2: Cài đặt Ganache (Local Blockchain)**

#### 2.1. Option 1: Dùng Docker (Khuyến nghị)
```bash
# Từ thư mục gốc dự án
docker-compose up -d ganache
```

#### 2.2. Option 2: Ganache CLI
```bash
# Cài đặt globally
npm install -g ganache-cli

# Chạy
ganache-cli --host 0.0.0.0 --port 8545 --deterministic
```

#### 2.3. Option 3: Ganache GUI
- Tải từ: https://trufflesuite.com/ganache/
- Cài đặt và chạy
- Port: 8545
- Network ID: 5777

#### 2.4. Lấy Private Key từ Ganache
- Mở Ganache UI → Accounts
- Copy một private key (không có "0x" prefix)
- Dùng làm `SERVICE_ACCOUNT_PRIVATE_KEY` trong `.env`

### **BƯỚC 3: Cấu hình dự án**

#### 3.1. Cài đặt dependencies
```bash
cd services/multisig-service
npm install
```

#### 3.2. Tạo file `.env`
```bash
# Tạo file .env
touch .env
# hoặc copy từ template
```

#### 3.3. Cấu hình `.env`
```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multisig_db
DB_USER=postgres
DB_PASS=your_password_here

# Blockchain Configuration (Ganache)
RPC_URL=http://localhost:8545
DEPLOYER_PRIVATE_KEY=your_ganache_private_key_1
SERVICE_ACCOUNT_PRIVATE_KEY=your_ganache_private_key_2

# Service Discovery (Optional - Tắt nếu không dùng)
EUREKA_ENABLED=false
EUREKA_HOST=localhost
EUREKA_PORT=9999

# JWT Secret (for future use)
JWT_SECRET=your-secret-jwt-key-here
```

**Lưu ý quan trọng:**
- `SERVICE_ACCOUNT_PRIVATE_KEY`: Phải là một trong các private keys từ Ganache
- Địa chỉ tương ứng với private key này PHẢI là một owner khi tạo ví
- Account này phải có đủ ETH để trả gas fee

### **BƯỚC 4: Chạy ứng dụng**

#### 4.1. Development Mode (với auto-reload)
```bash
npm run dev
```

#### 4.2. Production Mode
```bash
npm start
```

#### 4.3. Kiểm tra server
- Server chạy tại: `http://localhost:3001`
- Health check: `http://localhost:3001/health`
- Response: `UP`

### **BƯỚC 5: Test API**

#### 5.1. Tạo ví mới

**Request:**
```bash
curl -X POST http://localhost:3001/api/v1/multisig \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Team Wallet",
    "description": "Ví của team development",
    "owners": [
      "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
      "0x8ba1f109551bD432803012645Hac136c22C4e2",
      "YOUR_SERVICE_ACCOUNT_ADDRESS"
    ],
    "threshold": 2
  }'
```

**Lưu ý:**
- `owners` phải bao gồm địa chỉ của `SERVICE_ACCOUNT_PRIVATE_KEY`
- `threshold` <= số lượng owners
- `threshold` >= 1

**Response:**
```json
{
  "id": "uuid-here",
  "contractAddress": "0x...",
  "name": "Team Wallet",
  "owners": [...],
  "threshold": 2,
  "createdAt": "...",
  "updatedAt": "..."
}
```

#### 5.2. Submit giao dịch

**Request:**
```bash
curl -X POST http://localhost:3001/api/v1/multisig/WALLET_ID/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "destination": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "value": "0.01"
  }'
```

**Response:**
```json
{
  "id": "tx-uuid",
  "txIndexOnChain": 0,
  "txHash": "0x...",
  "destination": "0x...",
  "value": "10000000000000000",
  "status": "submitted",
  "confirmations": []
}
```

#### 5.3. Confirm giao dịch

**Request:**
```bash
curl -X POST http://localhost:3001/api/v1/multisig/transactions/TX_ID/confirm
```

**Response:**
```json
{
  "id": "tx-uuid",
  "status": "confirmed",
  "confirmations": ["0x..."],
  ...
}
```

#### 5.4. Execute giao dịch

**Lưu ý:** Chỉ execute khi `confirmations.length >= threshold`

**Request:**
```bash
curl -X POST http://localhost:3001/api/v1/multisig/transactions/TX_ID/execute
```

**Response:**
```json
{
  "id": "tx-uuid",
  "status": "executed",
  "txHash": "0x...",
  ...
}
```

## 🔍 Kiểm tra và Debug

### 1. Kiểm tra Database
```bash
psql -U postgres -d multisig_db

# Xem bảng
\dt

# Xem dữ liệu
SELECT * FROM "MultisigWallets";
SELECT * FROM "MultisigTransactions";
```

### 2. Kiểm tra Ganache
- Mở Ganache UI
- Xem Transactions tab để thấy các giao dịch
- Xem Logs để debug

### 3. Kiểm tra Logs
```bash
# Xem logs console
# Server sẽ in ra:
# ✅ Web3 đã khởi tạo.
# ✅ Service Account: 0x...
# ✅ Database đã đồng bộ.
# 🚀 Multisig Service đang chạy trên cổng 3001
```

### 4. Kiểm tra Smart Contract trên Ganache
- Vào Ganache → Contracts tab
- Xem contract đã deploy
- Copy contract address để verify

## ⚠️ Troubleshooting

### Lỗi: "Cannot connect to database"
**Nguyên nhân:** PostgreSQL không chạy hoặc sai credentials

**Giải pháp:**
1. Kiểm tra PostgreSQL đang chạy:
   ```bash
   # Windows
   services.msc → Tìm PostgreSQL → Start
   
   # Linux/Mac
   sudo service postgresql status
   ```

2. Kiểm tra credentials trong `.env`
3. Test connection:
   ```bash
   psql -U postgres -h localhost -d multisig_db
   ```

### Lỗi: "Cannot connect to blockchain"
**Nguyên nhân:** Ganache không chạy hoặc sai RPC_URL

**Giải pháp:**
1. Kiểm tra Ganache đang chạy trên port 8545
2. Kiểm tra `RPC_URL` trong `.env`: `http://localhost:8545`
3. Test connection:
   ```bash
   curl http://localhost:8545
   ```

### Lỗi: "Service Account phải nằm trong danh sách owners"
**Nguyên nhân:** Khi tạo ví, không bao gồm service account address

**Giải pháp:**
1. Lấy địa chỉ từ private key:
   ```javascript
   // Trong Node.js console
   const { Web3 } = require('web3');
   const web3 = new Web3();
   const account = web3.eth.accounts.privateKeyToAccount('0x' + YOUR_PRIVATE_KEY);
   console.log(account.address);
   ```
2. Thêm address này vào mảng `owners` khi tạo ví

### Lỗi: "Not enough confirmations"
**Nguyên nhân:** Chưa đủ số lượng confirmations để thực thi

**Giải pháp:**
- Cần đủ `confirmations.length >= threshold`
- Confirm thêm các giao dịch trước khi execute

### Lỗi: "Insufficient funds for gas"
**Nguyên nhân:** Account không đủ ETH để trả gas fee

**Giải pháp:**
1. Mở Ganache UI
2. Copy ETH từ account khác sang service account
3. Hoặc chọn account có nhiều ETH hơn làm service account

### Lỗi: "Invalid private key"
**Nguyên nhân:** Private key sai format

**Giải pháp:**
- Private key không có "0x" prefix trong `.env`
- Ví dụ: `abc123...` không phải `0xabc123...`

## 📊 Luồng hoạt động chi tiết

### 1. **Tạo Ví (Create Wallet):**
```
User → POST /api/v1/multisig
  → Service nhận owners và threshold
  → Deploy Smart Contract lên blockchain
  → Lưu thông tin vào PostgreSQL
  → Return wallet info
```

### 2. **Submit Transaction:**
```
User → POST /api/v1/multisig/:walletId/transactions
  → Service submit transaction lên blockchain
  → Smart contract tạo transaction mới (chưa executed)
  → Lưu transaction vào DB với status = "submitted"
  → Return transaction info
```

### 3. **Confirm Transaction:**
```
User → POST /api/v1/multisig/transactions/:txId/confirm
  → Service gọi confirmTransaction trên smart contract
  → Smart contract tăng numConfirmations
  → Cập nhật DB: thêm confirmation, status = "confirmed"
  → Return updated transaction
```

### 4. **Execute Transaction:**
```
User → POST /api/v1/multisig/transactions/:txId/execute
  → Service kiểm tra: confirmations.length >= threshold?
  → Nếu đủ: Gọi executeTransaction trên smart contract
  → Smart contract thực thi giao dịch (chuyển ETH)
  → Cập nhật DB: status = "executed"
  → Return executed transaction
```

## 🎓 Kiến thức cần nắm

### 1. **Multisig Wallet là gì?**
- Ví cần nhiều chữ ký để thực thi giao dịch
- Tăng bảo mật bằng cách yêu cầu nhiều người đồng ý

### 2. **Threshold là gì?**
- Số lượng chữ ký tối thiểu cần để thực thi
- Ví dụ: 3 owners, threshold = 2 → Cần 2/3 owners ký

### 3. **Smart Contract Events:**
- `TransactionSubmitted`: Khi submit transaction mới
- `TransactionConfirmed`: Khi có người confirm
- `TransactionExecuted`: Khi thực thi thành công

### 4. **Gas và Nonce:**
- **Gas**: Phí để thực thi transaction
- **Nonce**: Số thứ tự transaction (tránh replay attack)
- Service tự động quản lý nonce với `pending` nonce

## 📚 Tài liệu tham khảo

1. **Web3.js:** https://web3js.readthedocs.io/
2. **Solidity:** https://docs.soliditylang.org/
3. **Sequelize:** https://sequelize.org/
4. **Express.js:** https://expressjs.com/
5. **Ganache:** https://trufflesuite.com/ganache/

## ✅ Checklist hoàn thành

- [ ] Cài đặt Node.js 18+
- [ ] Cài đặt PostgreSQL
- [ ] Cài đặt Ganache
- [ ] Tạo database `multisig_db`
- [ ] Cấu hình `.env` với đầy đủ thông tin
- [ ] Chạy `npm install`
- [ ] Chạy `npm start`
- [ ] Test tạo ví thành công
- [ ] Test submit transaction thành công
- [ ] Test confirm transaction thành công
- [ ] Test execute transaction thành công

## 🎉 Chúc bạn thành công!

Nếu có vấn đề, hãy kiểm tra:
1. Logs console
2. Ganache transactions
3. Database records
4. Network connectivity


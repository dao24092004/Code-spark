# 🚀 Quick Start Guide - Multisig Wallet Service

## ⚡ Bắt đầu nhanh trong 5 phút

### 1. Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL installed hoặc Docker
- [ ] Ganache running (port 7545)
- [ ] Truffle installed globally: `npm install -g truffle`

### 2. Setup nhanh

```bash
# 1. Install dependencies
cd services/multisig-service
npm install

# 2. Tạo database (nếu chưa có)
createdb multisig_db

# 3. Setup .env file
# Trên Windows PowerShell:
Copy-Item env.example .env
# Hoặc trên Linux/Mac:
# cp env.example .env
# Chỉnh sửa .env với thông tin của bạn (đặc biệt là DB_PASSWORD và DEPLOYER_PRIVATE_KEY từ Ganache)

# 4. Compile smart contracts
truffle compile

# 5. Start service
npm run dev
```

### 3. Test với Postman

#### Bước 1: Tạo Ví
```
POST http://localhost:3001/api/v1/wallets
Body:
{
  "name": "Test Wallet",
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bD432803012645Hac136c22C39e7"
  ],
  "threshold": 2,
  "deployerAddress": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "deployerPrivateKey": "0x..." // Lấy từ Ganache
}
```

#### Bước 2: Submit Transaction
```
POST http://localhost:3001/api/v1/wallets/{walletId}/transactions
Body:
{
  "destination": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "value": "1.0",
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..."
}
```

#### Bước 3: Confirm Transaction (Owner 1)
```
POST http://localhost:3001/api/v1/transactions/{txId}/confirm
Body:
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..."
}
```

#### Bước 4: Confirm Transaction (Owner 2)
```
POST http://localhost:3001/api/v1/transactions/{txId}/confirm
Body:
{
  "from": "0x8ba1f109551bD432803012645Hac136c22C39e7",
  "privateKey": "0x..."
}
```

#### Bước 5: Execute Transaction
```
POST http://localhost:3001/api/v1/transactions/{txId}/execute
Body:
{
  "from": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "privateKey": "0x..."
}
```

## 🐳 Với Docker

```bash
# Từ root của project
docker-compose up -d postgres-db ganache multisig-service

# Xem logs
docker logs -f multisig-service

# Test
curl http://localhost:3001/health
```

## 📋 API Endpoints Tóm Tắt

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | `/api/v1/wallets` | Tạo ví mới |
| GET | `/api/v1/wallets` | Danh sách ví |
| GET | `/api/v1/wallets/:id` | Thông tin ví |
| POST | `/api/v1/wallets/:id/transactions` | Submit transaction |
| GET | `/api/v1/wallets/:id/transactions` | Danh sách transactions |
| POST | `/api/v1/transactions/:id/confirm` | Confirm transaction |
| POST | `/api/v1/transactions/:id/execute` | Execute transaction |
| GET | `/health` | Health check |

## ⚠️ Lưu Ý

1. **Private Keys**: Chỉ dùng trong development. Production cần secure key management.
2. **Threshold**: Phải <= số lượng owners
3. **Gas Fees**: Đảm bảo accounts có đủ ETH
4. **Network**: Service mặc định dùng Ganache (network ID 5777)

## 📚 Tài Liệu Chi Tiết

Xem thêm:
- `README.md` - Tài liệu đầy đủ
- `MULTISIG_GUIDE.md` - Hướng dẫn chi tiết từng bước


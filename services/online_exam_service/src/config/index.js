 // file: src/config/index.js
const dotenv = require('dotenv');
const path = require('path');

// Tự động đọc file .env ở thư mục gốc của service (2 cấp lên từ src/config)
const envPath = path.resolve(__dirname, '../../.env');
// override: false để không ghi đè các biến đã có (nếu đã được load trước đó)
const result = dotenv.config({ path: envPath, override: false });

if (result.error) {
  console.warn(`⚠️ Không tìm thấy file .env tại: ${envPath}`);
  console.warn('⚠️ Sử dụng biến môi trường hệ thống hoặc giá trị mặc định');
} else {
  console.log(`✅ Đã tải file .env từ: ${envPath}`);
}

// Debug: Kiểm tra giá trị PORT sau khi load dotenv
const portValue = process.env.PORT;
console.log(`🔍 Debug - process.env.PORT = ${portValue} (type: ${typeof portValue})`);

const config = {
  serverPort: portValue ? parseInt(portValue, 10) : 3000, // Mặc định port 3000 nếu không có trong .env
  security: {
    jwt: {
      secret: process.env.JWT_SECRET,
    },
  },
  db: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres',
  },
  blockchain: {
    providerUrl: process.env.WEB3_PROVIDER_URL,
    contractAddress: process.env.GRADE_LEDGER_CONTRACT_ADDRESS,
    privateKey: process.env.OWNER_ACCOUNT_PRIVATE_KEY,
  },
  proctoringServiceUrl: process.env.PROCTORING_SERVICE_URL,
  proctoringServiceToken: process.env.PROCTORING_SERVICE_TOKEN,
};

module.exports = config;

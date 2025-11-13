 // file: src/config/index.js
const dotenv = require('dotenv');
const fs = require('fs');
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

const readTokenFromFile = (filePath) => {
  if (!filePath) {
    return undefined;
  }

  try {
    const absolutePath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(__dirname, '../../', filePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(`⚠️ PROCTORING_SERVICE_TOKEN_FILE không tồn tại: ${absolutePath}`);
      return undefined;
    }

    const raw = fs.readFileSync(absolutePath, 'utf-8');
    const trimmed = raw.trim();

    if (!trimmed) {
      console.warn(`⚠️ PROCTORING_SERVICE_TOKEN_FILE rỗng: ${absolutePath}`);
      return undefined;
    }

    return trimmed;
  } catch (error) {
    console.error('⚠️ Không thể đọc PROCTORING_SERVICE_TOKEN_FILE:', error?.message);
    return undefined;
  }
};

const decodeBase64Token = (encoded) => {
  if (!encoded) {
    return undefined;
  }

  try {
    const buffer = Buffer.from(encoded, 'base64');
    const decoded = buffer.toString('utf-8').trim();
    return decoded || undefined;
  } catch (error) {
    console.error('⚠️ Không thể decode PROCTORING_SERVICE_TOKEN_B64:', error?.message);
    return undefined;
  }
};

const resolveProctoringServiceToken = () => {
  if (process.env.PROCTORING_SERVICE_TOKEN && process.env.PROCTORING_SERVICE_TOKEN.trim() !== '') {
    return process.env.PROCTORING_SERVICE_TOKEN.trim();
  }

  const fileToken = readTokenFromFile(process.env.PROCTORING_SERVICE_TOKEN_FILE);
  if (fileToken) {
    return fileToken;
  }

  const b64Token = decodeBase64Token(process.env.PROCTORING_SERVICE_TOKEN_B64);
  if (b64Token) {
    return b64Token;
  }

  return undefined;
};

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
  proctoringServiceToken: resolveProctoringServiceToken(),
};

module.exports = config;

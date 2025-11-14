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
  // === MỤC SERVER (Cấu trúc lại từ serverPort) ===
  server: {
    port: portValue ? parseInt(portValue, 10) : 3000, // Lấy từ logic cũ của bạn
    host: process.env.HOST || 'localhost',
    env: process.env.NODE_ENV || 'development',
  },

  // === MỤC DATABASE (Giữ nguyên logic của bạn, thêm fallback) ===
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    username: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'default_db',
    dialect: 'postgres', // Giữ nguyên từ file cũ
  },

  // === MỤC DISCOVERY (MỚI - Thêm từ ví dụ) ===
  discovery: {
    enabled: process.env.SERVICE_DISCOVERY_ENABLED !== 'false', // Mặc định là true
    eureka: {
      host: process.env.EUREKA_HOST || 'localhost',
      port: parseInt(process.env.EUREKA_PORT, 10) || 9999,
      servicePath: process.env.EUREKA_SERVICE_PATH || '/eureka/apps/',
      heartbeatInterval: parseInt(process.env.EUREKA_HEARTBEAT_INTERVAL, 10) || 30000,
      registryFetchInterval: parseInt(process.env.EUREKA_REGISTRY_FETCH_INTERVAL, 10) || 30000,
      preferIpAddress: true, // Thường là lựa chọn tốt với Node.js
      useLocalMetadata: true,
    }
  },

  // === MỤC GATEWAY (MỚI - Thêm từ ví dụ) ===
  gateway: {
    enabled: process.env.API_GATEWAY_ENABLED !== 'false', // Mặc định là true
    baseUrl: process.env.API_GATEWAY_BASE_URL || 'http://localhost:8080',
    timeout: parseInt(process.env.API_GATEWAY_TIMEOUT, 10) || 30000,
    retries: parseInt(process.env.API_GATEWAY_RETRIES, 10) || 3,
  },

  // === MỤC SECURITY (Mở rộng từ file cũ) ===
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'your-fallback-secret-key-change-it', // Giữ biến của bạn
      expiresIn: process.env.JWT_EXPIRES_IN || '24h' // Thêm từ ví dụ
    },
    corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8080'],
    rateLimit: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 900000, // 15 phút
      max: parseInt(process.env.RATE_LIMIT_MAX, 10) || 100 // 100 requests
    }
  },

  // === MỤC WEB3 (Đổi tên từ blockchain, giữ biến của bạn) ===
  web3: {
    providerUrl: process.env.WEB3_PROVIDER_URL, // Giữ biến của bạn
    contractAddress: process.env.GRADE_LEDGER_CONTRACT_ADDRESS, // Giữ biến của bạn
    privateKey: process.env.OWNER_ACCOUNT_PRIVATE_KEY, // Giữ biến của bạn
    chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID, 10) || 1337 // Thêm từ ví dụ
  },

  // === MỤC SERVICES (Tổ chức lại từ file cũ) ===
  services: {
    proctoring: {
      url: process.env.PROCTORING_SERVICE_URL, // Giữ biến của bạn
      token: process.env.PROCTORING_SERVICE_TOKEN, // Giữ biến của bạn
    }
    // Thêm các service khác nếu cần
  }
};

module.exports = config;
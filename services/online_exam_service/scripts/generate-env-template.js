#!/usr/bin/env node

/**
 * Generates a starter .env file for the online exam service.
 *
 * Usage:
 *   node scripts/generate-env-template.js [--output=.env.local]
 *
 * The script will refuse to overwrite an existing file unless --force=true is provided.
 */

const fs = require('fs');
const path = require('path');

const parseArgs = () => {
  const args = process.argv.slice(2);
  const result = {};

  for (const arg of args) {
    const [key, value] = arg.split('=');
    if (key && value) {
      const normalizedKey = key.replace(/^--/, '');
      result[normalizedKey] = value;
    }
  }

  return result;
};

const args = parseArgs();
const output = args.output || '.env';
const force = args.force === 'true' || args.force === '1';
const directToken = args.token;
const tokenFile = args.tokenFile || args.tokenfile;
const tokenB64 = args.tokenB64 || args.tokenb64;
const writeTokenFile = args.writeTokenFile || args.writetokenfile;
const proctoringUrl = args.proctoringUrl || args.proctoringurl;

const ensureDirectory = (filePath) => {
  const directory = path.dirname(filePath);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
  }
};

const emitSecretsFile = () => {
  if (!writeTokenFile) {
    return;
  }

  if (!directToken) {
    console.warn('⚠️ --writeTokenFile được cung cấp nhưng không có --token. Bỏ qua việc ghi file bí mật.');
    return;
  }

  const absoluteTokenFilePath = path.isAbsolute(writeTokenFile)
    ? writeTokenFile
    : path.resolve(process.cwd(), writeTokenFile);

  ensureDirectory(absoluteTokenFilePath);

  fs.writeFileSync(absoluteTokenFilePath, (directToken || '').trim());
  console.log(`✅ Đã ghi token vào ${absoluteTokenFilePath}`);
};

const buildTemplate = () => {
  const tokenLine = directToken
    ? `PROCTORING_SERVICE_TOKEN=${directToken}`
    : 'PROCTORING_SERVICE_TOKEN=Bearer your-proctoring-service-token';

  const tokenFileLine = tokenFile
    ? `PROCTORING_SERVICE_TOKEN_FILE=${tokenFile}`
    : '# PROCTORING_SERVICE_TOKEN_FILE=secrets/proctoring.token';

  const tokenB64Line = tokenB64 ? `PROCTORING_SERVICE_TOKEN_B64=${tokenB64}` : '# PROCTORING_SERVICE_TOKEN_B64=';

  const serviceUrlLine = proctoringUrl || 'http://localhost:3001';

  return `# Server
PORT=${args.port || 3000}
NODE_ENV=${args.nodeEnv || 'development'}

# PostgreSQL Database (shared with exam-service)
DB_HOST=${args.dbHost || 'localhost'}
DB_PORT=${args.dbPort || 5433}
DB_USER=${args.dbUser || 'postgres'}
DB_PASSWORD=${args.dbPassword || 'postgres'}
DB_NAME=${args.dbName || 'exam_db'}

# Blockchain (Ganache)
WEB3_PROVIDER_URL=${args.web3ProviderUrl || 'http://127.0.0.1:7545'}
OWNER_ACCOUNT_PRIVATE_KEY=${args.privateKey || 'your_ganache_account_private_key'}
GRADE_LEDGER_CONTRACT_ADDRESS=${args.contractAddress || ''}

# Services
PROCTORING_SERVICE_URL=${serviceUrlLine}
# Choose ONE of the token options below:
# 1. Direct value (recommended for local dev)
${tokenLine}
# 2. Path to file containing the token (relative to service root or absolute)
${tokenFileLine}
# 3. Base64-encoded token (without "Bearer" prefix)
${tokenB64Line}

# JWT (shared with identity-service)
JWT_SECRET=${args.jwtSecret || 'mySecretKey12345678901234567890123456789012345678901234567890'}
`;
};

const targetPath = path.resolve(process.cwd(), output);

if (fs.existsSync(targetPath) && !force) {
  console.error(`⚠️ ${output} đã tồn tại. Thêm --force=true để ghi đè.`);
  process.exit(1);
} else {
  const template = buildTemplate();
  fs.writeFileSync(targetPath, template);
  console.log(`✅ Đã tạo file cấu hình mẫu tại ${targetPath}`);
}

emitSecretsFile();



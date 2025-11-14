require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    // JWT secret phải giống với identity-service để verify token
    jwtSecret: process.env.JWT_SECRET || 'mySecretKey12345678901234567890123456789012345678901234567890'
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    deployerKey: process.env.DEPLOYER_PRIVATE_KEY,
    serviceAccountKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY,
    ownerKeys: (process.env.OWNER_PRIVATE_KEYS || '')
      .split(/[\n,]/)
      .map((key) => key.trim())
      .filter((key) => key.length > 0)
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME
  },
  identity: {
    baseUrl: process.env.IDENTITY_SERVICE_URL || null,
    serviceName: process.env.IDENTITY_SERVICE_NAME || 'IDENTITY-SERVICE',
    timeout: process.env.IDENTITY_SERVICE_TIMEOUT
      ? parseInt(process.env.IDENTITY_SERVICE_TIMEOUT, 10)
      : 5000,
    serviceToken: process.env.IDENTITY_SERVICE_TOKEN || null
  },
  discovery: {
    enabled: process.env.EUREKA_ENABLED === 'true',
    host: process.env.EUREKA_HOST,
    port: process.env.EUREKA_PORT,
    serviceName: 'multisig-service'
  }
};


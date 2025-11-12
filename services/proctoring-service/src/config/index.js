const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from project root .env if available
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const config = {
  server: {
    port: toNumber(process.env.PORT, 8082),
    host: process.env.HOST || '0.0.0.0',
    env: process.env.NODE_ENV || 'development'
  },
  db: {
    host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
    port: toNumber(process.env.DB_PORT || process.env.PG_PORT, 5432),
    username: process.env.DB_USER || process.env.PG_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || '',
    database: process.env.DB_NAME || process.env.PG_DATABASE || 'proctoring_db',
    dialect: process.env.DB_DIALECT || 'postgres'
  },
  // Keep legacy access pattern for modules still using config.database
  database: {
    host: process.env.DB_HOST || process.env.PG_HOST || 'localhost',
    port: toNumber(process.env.DB_PORT || process.env.PG_PORT, 5432),
    user: process.env.DB_USER || process.env.PG_USER || 'postgres',
    password: process.env.DB_PASSWORD || process.env.PG_PASSWORD || '',
    name: process.env.DB_NAME || process.env.PG_DATABASE || 'proctoring_db'
  },
  ai: {
    url: process.env.AI_SERVICE_URL || 'http://localhost:8000',
    timeout: toNumber(process.env.AI_SERVICE_TIMEOUT, 30000)
  },
  blockchain: {
    providerUrl: process.env.WEB3_PROVIDER_URL || 'http://127.0.0.1:7545',
    privateKey: process.env.ACCOUNT_PRIVATE_KEY || '',
    contractAddress: process.env.CONTRACT_ADDRESS || ''
  },
  security: {
    jwt: {
      secret: process.env.JWT_SECRET || 'change-me-in-production',
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    },
    corsOrigins: process.env.CORS_ALLOWED_ORIGINS
      ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
      : [
          'http://localhost:3000',
          'http://localhost:4173',
          'http://localhost:8080'
        ]
  },
  discovery: {
    enabled: process.env.SERVICE_DISCOVERY_ENABLED !== 'false',
    eureka: {
      appName: process.env.EUREKA_APP_NAME || 'PROCTORING-SERVICE',
      host: process.env.EUREKA_HOST || 'localhost',
      port: toNumber(process.env.EUREKA_PORT, 9999),
      servicePath: process.env.EUREKA_SERVICE_PATH || '/eureka/apps/',
      heartbeatInterval: toNumber(process.env.EUREKA_HEARTBEAT_INTERVAL, 30000),
      registryFetchInterval: toNumber(process.env.EUREKA_REGISTRY_FETCH_INTERVAL, 30000),
      preferIpAddress: true
    }
  },
  gateway: {
    baseUrl: process.env.API_GATEWAY_BASE_URL || 'http://localhost:8080',
    enabled: process.env.API_GATEWAY_ENABLED !== 'false'
  },
  websocket: {
    path: process.env.WS_PATH || '/ws',
    cors: {
      origin: process.env.WS_CORS_ORIGINS
        ? process.env.WS_CORS_ORIGINS.split(',').map(origin => origin.trim())
        : '*',
      methods: ['GET', 'POST']
    }
  }
};

module.exports = config;
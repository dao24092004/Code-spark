 const fs = require('fs');
 const path = require('path');

const config = {
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        env: process.env.NODE_ENV || 'development',
    },
    db: {
        // Support both PG_* and DB_* env names
        host: process.env.PG_HOST || process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.PG_PORT || process.env.DB_PORT, 10) || 5432,
        database: process.env.PG_DATABASE || process.env.DB_NAME || 'copyright_db',
        user: process.env.PG_USER || process.env.DB_USER || 'postgres',
        password: process.env.PG_PASSWORD || process.env.DB_PASSWORD || 'password',
    },
    discovery: {
        enabled: process.env.SERVICE_DISCOVERY_ENABLED !== 'false',
        eureka: {
            host: process.env.EUREKA_HOST || 'localhost',
            port: process.env.EUREKA_PORT || 9999,
            servicePath: process.env.EUREKA_SERVICE_PATH || '/eureka/apps/',
            heartbeatInterval: parseInt(process.env.EUREKA_HEARTBEAT_INTERVAL) || 30000,
            registryFetchInterval: parseInt(process.env.EUREKA_REGISTRY_FETCH_INTERVAL) || 30000,
            preferIpAddress: true,
            useLocalMetadata: true,
        }
    },
    gateway: {
        enabled: process.env.API_GATEWAY_ENABLED !== 'false',
        baseUrl: process.env.API_GATEWAY_BASE_URL || 'http://localhost:8080',
        timeout: parseInt(process.env.API_GATEWAY_TIMEOUT) || 30000,
        retries: parseInt(process.env.API_GATEWAY_RETRIES) || 3,
        javaGateway: {
            healthPath: process.env.GATEWAY_HEALTH_PATH || '/actuator/health',
            contextPath: process.env.GATEWAY_CONTEXT_PATH || '/api/v1'
        }
    },
    services: {
        identity: {
            name: 'identity-service',
            baseUrl: process.env.IDENTITY_SERVICE_URL || 'http://localhost:8081',
            endpoints: {
                // For communication.js compatibility
                authenticate: '/api/auth/verify',
                getUser: '/api/users/{id}',
                updateCopyrightCount: '/api/users/copyright-count'
            }
        },
        analytics: {
            name: 'analytics-service',
            baseUrl: process.env.ANALYTICS_SERVICE_URL || 'http://localhost:8082',
            endpoints: {
                // For communication.js compatibility
                sendEvent: '/api/events'
            }
        },
        notification: {
            name: 'notification-service',
            baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:8083',
            endpoints: {
                // For communication.js compatibility
                sendNotification: '/api/notifications'
            }
        }
    },
    security: {
        jwt: {
            secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
            expiresIn: process.env.JWT_EXPIRES_IN || '24h'
        },
        corsOrigins: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:8080'],
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
            max: parseInt(process.env.RATE_LIMIT_MAX) || 100
        }
    },
    web3: {
        // Support both WEB3_* and BLOCKCHAIN_* env names
        providerUrl: process.env.WEB3_PROVIDER_URL || process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:7545',
        accountPrivateKey: process.env.ACCOUNT_PRIVATE_KEY || process.env.BLOCKCHAIN_PRIVATE_KEY || '0x4f3edf983ac636a65a842ce7c78d9aa706d3b113bce9c46f30d7d21715b23b1d',
        chainId: parseInt(process.env.BLOCKCHAIN_CHAIN_ID || process.env.WEB3_CHAIN_ID, 10) || 1337
    },
    fileUpload: {
        maxSize: parseInt(process.env.UPLOAD_MAX_SIZE) || 10485760,
        allowedTypes: process.env.UPLOAD_ALLOWED_TYPES ? process.env.UPLOAD_ALLOWED_TYPES.split(',') : [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ]
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'combined'
    }
};

module.exports = config;
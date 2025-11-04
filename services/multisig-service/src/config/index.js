require('dotenv').config();

module.exports = {
  server: {
    port: process.env.PORT || 3001,
    env: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET
  },
  blockchain: {
    rpcUrl: process.env.RPC_URL,
    deployerKey: process.env.DEPLOYER_PRIVATE_KEY,
    serviceAccountKey: process.env.SERVICE_ACCOUNT_PRIVATE_KEY
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    pass: process.env.DB_PASS,
    name: process.env.DB_NAME
  },
  discovery: {
    enabled: process.env.EUREKA_ENABLED === 'true',
    host: process.env.EUREKA_HOST,
    port: process.env.EUREKA_PORT,
    serviceName: 'multisig-service'
  }
};


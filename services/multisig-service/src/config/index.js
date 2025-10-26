require('dotenv').config();

module.exports = {
    server: {
        port: process.env.PORT || 3001,
        env: process.env.NODE_ENV || 'development'
    },
    blockchain: {
        rpcUrl: process.env.RPC_URL,
        deployerKey: process.env.DEPLOYER_PRIVATE_KEY
    },
    discovery: {
        enabled: process.env.EUREKA_ENABLED === 'true',
        host: process.env.EUREKA_HOST,
        port: process.env.EUREKA_PORT,
        serviceName: 'multisig-service'
    }
};
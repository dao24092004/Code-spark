require('dotenv').config();
const app = require('./app');
const db = require('./models');
const config = require('./config');
const { checkBlockchainConnection } = require('./config/web3');

const PORT = config.server.port;

/**
 * Khởi động server
 */
async function startServer() {
  try {
    // 1. Kiểm tra kết nối database
    console.log('🔌 Connecting to database...');
    await db.sequelize.authenticate();
    console.log('✅ Database connection established.');

    // 2. Đồng bộ models với database (sync schema)
    console.log('🔄 Syncing database models...');
    await db.sequelize.sync({ force: false }); // force: false = không xóa dữ liệu cũ
    console.log('✅ Database models synced.');

    // 3. Kiểm tra kết nối blockchain
    console.log('🔗 Checking blockchain connection...');
    const isConnected = await checkBlockchainConnection();
    if (!isConnected) {
      console.warn('⚠️  Blockchain connection failed. Please check your Web3 provider.');
    }

    // 4. Khởi động HTTP server
    app.listen(PORT, () => {
      console.log(`🚀 Multisig Service is running on port ${PORT}`);
      console.log(`📋 Environment: ${config.server.env}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📚 API base URL: http://localhost:${PORT}/api/v1`);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down server...');
  
  try {
    await db.sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 SIGTERM received. Shutting down gracefully...');
  
  try {
    await db.sequelize.close();
    console.log('✅ Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
});

// Start server
startServer();


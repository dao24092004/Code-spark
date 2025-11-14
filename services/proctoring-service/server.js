require('dotenv').config();

const http = require('http');

const app = require('./app');
const config = require('./src/config');
const db = require('./src/models');
const serviceDiscovery = require('./src/discovery/client');
const { initializeWebSocket, getIO } = require('./src/config/websocket');

const server = http.createServer(app);
initializeWebSocket(server);

server.listen(config.server.port, config.server.host, () => {
  const hostForLog = config.server.host === '0.0.0.0' ? 'localhost' : config.server.host;
  console.log(`🚀 Proctoring Service HTTP listening at http://${hostForLog}:${config.server.port}`);
  console.log(`🌐 Proctoring Service WebSocket listening at ws://${hostForLog}:${config.server.port}${config.websocket.path}`);
});

db.sequelize
  .authenticate()
  .then(() => {
    console.log('✅ Database connection established');
    return db.sequelize.sync();
  })
  .then(() => {
    console.log('✅ Database models synchronized');
  })
  .catch((error) => {
    console.error('❌ Unable to initialize database:', error.message);
  });

const io = getIO();
io.engine.on('connection_error', (err) => {
  console.error('❌ Socket.IO connection error:', err.message);
});

serviceDiscovery.initialize();

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

const gracefulShutdown = (signal) => {
  console.log(`🛑 Received ${signal}, attempting graceful shutdown...`);
  serviceDiscovery.stop();

  server.close(() => {
    console.log('✅ HTTP server closed');
    db.sequelize.close().finally(() => process.exit(0));
  });

  setTimeout(() => {
    console.error('⏱️ Force exiting after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

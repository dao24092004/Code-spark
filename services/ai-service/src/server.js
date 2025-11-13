const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { errorHandler } = require('./middleware/error');
const logger = require('./utils/logger');

class AIService {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: config.cors.origins,
      credentials: true
    }));

    // Logging
    if (config.env !== 'test') {
      this.app.use(morgan(config.logging.format, {
        stream: {
          write: (message) => logger.info(message.trim())
        }
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Request ID
    this.app.use((req, res, next) => {
      req.id = req.headers['x-request-id'] || `req_${Date.now()}`;
      res.setHeader('X-Request-ID', req.id);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        service: 'ai-service',
        timestamp: new Date().toISOString()
      });
    });

    // API routes
    this.app.use('/api/v1/ai', require('./routes/ai.routes'));

    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Cannot ${req.method} ${req.path}`,
        requestId: req.id
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  start() {
    return new Promise((resolve) => {
      this.server = this.app.listen(config.port, () => {
        logger.info(`AI Service running on port ${config.port} in ${config.env} mode`);
        logger.info(`Health check: http://localhost:${config.port}/health`);
        resolve();
      });
    });
  }

  async stop() {
    if (this.server) {
      await new Promise((resolve) => this.server.close(resolve));
      logger.info('AI Service stopped');
    }
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  const server = new AIService();
  
  const shutdown = async () => {
    logger.info('Shutting down AI Service...');
    await server.stop();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  server.start().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = AIService;

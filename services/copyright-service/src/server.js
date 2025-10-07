const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const serviceDiscovery = require('./discovery/client');
const serviceCommunication = require('./services/communication');
const dataSynchronizer = require('./services/synchronizer');

// Import existing components
const copyrightRoutes = require('./routes/copyright.routes');

class MicroservicesServer {
    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.initializeServices();
    }

    /**
     * Initialize middleware stack
     */
    initializeMiddleware() {
        // Security middleware
        this.app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            },
            crossOriginEmbedderPolicy: false
        }));

        // CORS configuration
        this.app.use(cors({
            origin: config.security.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Service-Name']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.security.rateLimit.windowMs,
            max: config.security.rateLimit.max,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
            },
            standardHeaders: true,
            legacyHeaders: false
        });
        this.app.use('/api/', limiter);

        // Logging middleware
        this.app.use(morgan(config.logging.format, {
            skip: (req, res) => res.statusCode < 400
        }));

        // Request parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Request ID middleware
        this.app.use((req, res, next) => {
            req.requestId = req.headers['x-request-id'] || this.generateRequestId();
            res.setHeader('X-Request-ID', req.requestId);
            next();
        });
    }

    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health and status endpoints
        this.app.get('/health', (req, res) => this.healthCheck(req, res));
        this.app.get('/status', (req, res) => this.detailedStatus(req, res));

        // Microservices management endpoints
        this.app.get('/services', (req, res) => this.getServices(req, res));
        this.app.get('/sync-status', (req, res) => this.getSyncStatus(req, res));
        this.app.post('/sync-retry', (req, res) => this.retrySync(req, res));

        // Java Gateway integration endpoints
        this.app.get('/gateway/health', async (req, res) => this.javaGatewayHealth(req, res));
        this.app.get('/gateway/services', async (req, res) => this.javaGatewayServices(req, res));

        // Mount copyright routes with backward compatibility for /api/copyrights (no v1 prefix for API Gateway compatibility)
        this.app.use('/api/copyrights', copyrightRoutes);

        // Mount copyright routes
        this.app.use('/api/v1/copyrights', copyrightRoutes);

        // Legacy route support (for backward compatibility)
        this.app.use('/copyrights', copyrightRoutes);

        // API documentation
        this.app.get('/api-docs', (req, res) => {
            res.json({
                title: 'Copyright Service API',
                version: '1.0.0',
                description: 'Microservices-based copyright registration system',
                endpoints: {
                    copyrights: '/api/copyrights',
                    copyrightsV1: '/api/v1/copyrights',
                    similarityCheck: '/api/v1/copyrights/check-similarity',
                    health: '/health',
                    status: '/status'
                }
            });
        });
    }

    /**
     * Setup global error handling
     */
    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res, next) => {
            res.status(404).json({
                error: 'Endpoint not found',
                path: req.originalUrl,
                method: req.method,
                timestamp: new Date().toISOString()
            });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error('Global error handler:', error);

            const statusCode = error.statusCode || 500;
            const message = config.server.env === 'development' ? error.message : 'Internal server error';

            res.status(statusCode).json({
                error: message,
                requestId: req.requestId,
                timestamp: new Date().toISOString(),
                ...(config.server.env === 'development' && {
                    stack: error.stack,
                    details: error.details
                })
            });
        });
    }

    /**
     * Initialize microservices components
     */
    async initializeServices() {
        try {
            console.log('🚀 Initializing microservices components...');

            // Initialize service discovery
            serviceDiscovery.initialize();

            // Start periodic synchronization
            dataSynchronizer.startPeriodicSync(5); // Every 5 minutes

            // Setup graceful shutdown
            this.setupGracefulShutdown();

            console.log('✅ Microservices components initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize microservices:', error);
            process.exit(1);
        }
    }

    /**
     * Health check endpoint
     */
    async healthCheck(req, res) {
        const healthStatus = {
            status: 'UP',
            timestamp: new Date().toISOString(),
            service: 'copyright-service',
            version: require('../package.json').version,
            uptime: process.uptime()
        };

        try {
            // Check service discovery
            healthStatus.discovery = serviceDiscovery.getHealthStatus();

            // Check dependent services
            const servicesHealth = await serviceCommunication.healthCheck();
            healthStatus.dependencies = servicesHealth;

            // Overall status determination
            const hasUnhealthyDeps = Object.values(servicesHealth).some(service => service.status === 'DOWN');
            if (hasUnhealthyDeps) {
                healthStatus.status = 'DEGRADED';
            }
        } catch (error) {
            healthStatus.status = 'DEGRADED';
            healthStatus.error = error.message;
        }

        const statusCode = healthStatus.status === 'UP' ? 200 : 503;
        res.status(statusCode).json(healthStatus);
    }

    /**
     * Detailed status endpoint
     */
    async detailedStatus(req, res) {
        try {
            const status = {
                ...serviceDiscovery.getHealthStatus(),
                dependencies: await serviceCommunication.healthCheck(),
                circuitBreakers: serviceCommunication.getCircuitBreakerStatus(),
                syncStatus: dataSynchronizer.getSyncStatus(),
                config: {
                    environment: config.server.env,
                    discoveryEnabled: config.discovery.enabled,
                    gatewayEnabled: config.gateway.enabled
                },
                memory: {
                    used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                    total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                    external: Math.round(process.memoryUsage().external / 1024 / 1024)
                }
            };

            res.json(status);
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get detailed status',
                details: error.message
            });
        }
    }

    /**
     * Java Gateway health check
     */
    async javaGatewayHealth(req, res) {
        try {
            const axios = require('axios');
            const config = require('./config');

            const response = await axios.get(`${config.gateway.baseUrl}${config.gateway.javaGateway.healthPath}`, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            res.json({
                status: 'UP',
                timestamp: new Date().toISOString(),
                javaGateway: {
                    status: response.data.status || 'UP',
                    details: response.data,
                    url: config.gateway.baseUrl
                }
            });
        } catch (error) {
            res.status(503).json({
                status: 'DOWN',
                timestamp: new Date().toISOString(),
                javaGateway: {
                    status: 'DOWN',
                    error: error.message,
                    url: config.gateway.baseUrl
                }
            });
        }
    }

    /**
     * Java Gateway services
     */
    async javaGatewayServices(req, res) {
        try {
            const services = serviceDiscovery.getRegisteredServices();
            res.json({
                services: services.map(service => ({
                    name: service.app,
                    status: service.status,
                    host: service.ipAddr,
                    port: service.port.$,
                    metadata: service.metadata,
                    javaCompatible: service.metadata?.['service.type'] === 'java' || false
                }))
            });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to get Java Gateway services',
                details: error.message
            });
        }
    }

    /**
     * Get synchronization status
     */
    getSyncStatus(req, res) {
        const syncStatus = dataSynchronizer.getSyncStatus();
        res.json(syncStatus);
    }

    /**
     * Retry failed synchronizations
     */
    async retrySync(req, res) {
        try {
            await dataSynchronizer.retryFailedSyncs();
            res.json({ message: 'Synchronization retry initiated' });
        } catch (error) {
            res.status(500).json({
                error: 'Failed to retry synchronization',
                details: error.message
            });
        }
    }

    /**
     * Setup graceful shutdown
     */
    setupGracefulShutdown() {
        const shutdown = async (signal) => {
            console.log(`🛑 Received ${signal}. Starting graceful shutdown...`);

            // Stop accepting new connections
            this.app.close(async () => {
                console.log('✅ HTTP server closed');

                // Stop service discovery
                serviceDiscovery.stop();

                // Process remaining sync queue
                console.log('🔄 Processing remaining synchronization tasks...');
                await dataSynchronizer.processSyncQueue();

                console.log('✅ Graceful shutdown completed');
                process.exit(0);
            });

            // Force close after 30 seconds
            setTimeout(() => {
                console.error('❌ Could not close connections in time, forcefully shutting down');
                process.exit(1);
            }, 30000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
    }

    /**
     * Generate request ID for tracing
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start the microservices server
     */
    start() {
        const port = config.server.port;
        this.app.listen(port, () => {
            console.log(`🚀 Copyright Microservices Server started on port ${port}`);
            console.log(`📊 Environment: ${config.server.env}`);
            console.log(`🔍 Service Discovery: ${config.discovery.enabled ? 'ENABLED' : 'DISABLED'}`);
            console.log(`🌐 API Gateway: ${config.gateway.enabled ? 'ENABLED' : 'DISABLED'}`);
            console.log(`📋 Health Check: http://localhost:${port}/health`);
            console.log(`📊 Detailed Status: http://localhost:${port}/status`);
            console.log(`🔗 API Documentation: http://localhost:${port}/api-docs`);
        });
    }

    /**
     * Start API Gateway mode
     */
    startGateway() {
        console.log('🌐 Starting in API Gateway mode...');
        this.gateway.start();
    }
}

module.exports = MicroservicesServer;

const server = new MicroservicesServer();
server.start();

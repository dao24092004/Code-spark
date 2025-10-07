const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const config = require('../config');
const serviceDiscovery = require('../discovery/client');
const serviceCommunication = require('../services/communication');

class APIGateway {
    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.setupRoutes();
        this.setupHealthChecks();
    }

    /**
     * Initialize middleware
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
            }
        }));

        // CORS configuration
        this.app.use(cors({
            origin: config.security.corsOrigins,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: config.security.rateLimit.windowMs,
            max: config.security.rateLimit.max,
            message: {
                error: 'Too many requests from this IP, please try again later.',
                retryAfter: Math.ceil(config.security.rateLimit.windowMs / 1000)
            }
        });
        this.app.use('/api/', limiter);

        // Logging
        this.app.use(morgan(config.logging.format));

        // Body parsing
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    }

    /**
     * Setup API routes with Java API Gateway integration
     */
    setupRoutes() {
        // API versioning with Java Gateway routing
        this.app.use('/api/v1', this.createAPIRouter());

        // Legacy route support (for backward compatibility)
        this.app.use('/copyrights', this.createProxyMiddleware('/copyrights'));

        // Java API Gateway integration endpoints
        this.app.get('/gateway/services', async (req, res) => {
            try {
                const services = serviceDiscovery.getRegisteredServices();
                res.json({
                    services: services.map(service => ({
                        name: service.app,
                        status: service.status,
                        host: service.ipAddr,
                        port: service.port.$,
                        metadata: service.metadata
                    }))
                });
            } catch (error) {
                res.status(500).json({ error: 'Failed to get services from Java Gateway' });
            }
        });

        // Circuit breaker status
        this.app.get('/gateway/circuit-breakers', (req, res) => {
            const status = serviceCommunication.getCircuitBreakerStatus();
            res.json({ circuitBreakers: status });
        });

        // Gateway health check
        this.app.get('/gateway/health', async (req, res) => {
            const healthStatus = {
                status: 'UP',
                timestamp: new Date().toISOString(),
                gateway: 'nodejs-copyright-service',
                version: require('../../package.json').version
            };

            try {
                // Check Java API Gateway health
                const javaGatewayHealth = await this.checkJavaGatewayHealth();
                healthStatus.javaGateway = javaGatewayHealth;
            } catch (error) {
                healthStatus.javaGateway = { status: 'DOWN', error: error.message };
            }

            res.json(healthStatus);
        });
    }

    /**
     * Create main API router with Java Gateway integration
     */
    createAPIRouter() {
        const router = express.Router();

        // Copyright endpoints - route to Java Gateway
        router.use('/copyrights', this.createJavaGatewayProxy('/api/v1/copyrights'));

        // Proxy to other services through Java Gateway
        router.use('/identity', this.createJavaGatewayProxy('/api/v1/identity'));
        router.use('/analytics', this.createJavaGatewayProxy('/api/v1/analytics'));
        router.use('/notifications', this.createJavaGatewayProxy('/api/v1/notifications'));

        return router;
    }

    /**
     * Create proxy middleware for Java API Gateway
     */
    createJavaGatewayProxy(path) {
        return createProxyMiddleware({
            target: config.gateway.baseUrl,
            changeOrigin: true,
            pathRewrite: {
                [`^/api/v1${path}`]: `${config.gateway.javaGateway.contextPath}${path}`
            },
            onError: (err, req, res) => {
                console.error('Java Gateway proxy error:', err.message);
                res.status(503).json({
                    error: 'Java API Gateway temporarily unavailable',
                    path: req.path,
                    timestamp: new Date().toISOString(),
                    gateway: config.gateway.baseUrl
                });
            },
            onProxyReq: (proxyReq, req, res) => {
                // Add headers for Java Gateway
                proxyReq.setHeader('X-Service-Name', 'copyright-service');
                proxyReq.setHeader('X-Request-ID', req.headers['x-request-id'] || this.generateRequestId());
                proxyReq.setHeader('X-Source-Service', 'nodejs-copyright-service');
                proxyReq.setHeader('Content-Type', 'application/json');
            },
            onProxyRes: (proxyRes, req, res) => {
                console.log(`📡 Java Gateway Response: ${req.method} ${req.path} -> ${proxyRes.statusCode}`);
            }
        });
    }

    /**
     * Check Java API Gateway health
     */
    async checkJavaGatewayHealth() {
        try {
            const response = await axios.get(`${config.gateway.baseUrl}${config.gateway.javaGateway.healthPath}`, {
                timeout: 5000,
                headers: {
                    'Accept': 'application/json'
                }
            });

            return {
                status: response.data.status || 'UP',
                details: response.data
            };
        } catch (error) {
            throw new Error(`Java Gateway health check failed: ${error.message}`);
        }
    }

    /**
     * Setup health check endpoints
     */
    setupHealthChecks() {
        // Basic health check
        this.app.get('/health', async (req, res) => {
            const healthStatus = {
                status: 'UP',
                timestamp: new Date().toISOString(),
                service: 'copyright-service',
                version: require('../../package.json').version,
                uptime: process.uptime()
            };

            // Check dependent services
            try {
                const servicesHealth = await serviceCommunication.healthCheck();
                healthStatus.dependencies = servicesHealth;

                // Overall status
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
        });

        // Detailed status
        this.app.get('/status', async (req, res) => {
            const status = {
                ...serviceDiscovery.getHealthStatus(),
                dependencies: await serviceCommunication.healthCheck(),
                circuitBreakers: serviceCommunication.getCircuitBreakerStatus(),
                config: {
                    environment: config.server.env,
                    discoveryEnabled: config.discovery.enabled,
                    gatewayEnabled: config.gateway.enabled
                }
            };

            res.json(status);
        });
    }

    /**
     * Generate request ID for tracing
     */
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Start the API Gateway
     */
    start() {
        const port = config.server.port;
        this.app.listen(port, () => {
            console.log(`🚀 API Gateway started on port ${port}`);
            console.log(`📊 Health check: http://localhost:${port}/health`);
            console.log(`📋 Status: http://localhost:${port}/status`);
            console.log(`🔍 Services: http://localhost:${port}/services`);
        });
    }

    /**
     * Graceful shutdown
     */
    async stop() {
        console.log('🛑 Shutting down API Gateway...');
        serviceDiscovery.stop();
        process.exit(0);
    }
}

module.exports = APIGateway;

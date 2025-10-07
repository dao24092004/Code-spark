const axios = require('axios');
const serviceDiscovery = require('../discovery/client');
const config = require('../config');

class ServiceCommunication {
    constructor() {
        this.serviceClients = new Map();
        this.circuitBreakers = new Map();
    }

    /**
     * Get service client with circuit breaker
     */
    async getServiceClient(serviceName) {
        if (this.serviceClients.has(serviceName)) {
            return this.serviceClients.get(serviceName);
        }

        const serviceConfig = config.services[serviceName];
        if (!serviceConfig) {
            throw new Error(`Service ${serviceName} not configured`);
        }

        // Try to discover service from Eureka first
        if (config.discovery.enabled) {
            try {
                const instance = await serviceDiscovery.discoverService(serviceConfig.name);
                serviceConfig.baseUrl = instance.url;
            } catch (error) {
                console.warn(`Could not discover ${serviceName} from Eureka, using configured URL: ${error.message}`);
            }
        }

        const client = axios.create({
            baseURL: serviceConfig.baseUrl,
            timeout: serviceConfig.timeout,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'copyright-service/1.0.0'
            }
        });

        // Add response interceptor for circuit breaker
        client.interceptors.response.use(
            response => response,
            error => {
                this.handleServiceError(serviceName, error);
                return Promise.reject(error);
            }
        );

        this.serviceClients.set(serviceName, client);
        return client;
    }

    /**
     * Handle service errors for circuit breaker pattern
     */
    handleServiceError(serviceName, error) {
        const circuitBreaker = this.circuitBreakers.get(serviceName) || { failures: 0, lastFailure: null };

        if (error.response?.status >= 500 || error.code === 'ECONNREFUSED') {
            circuitBreaker.failures++;
            circuitBreaker.lastFailure = Date.now();

            if (circuitBreaker.failures >= 5) {
                console.warn(`🔴 Circuit breaker OPEN for ${serviceName} - Too many failures`);
            }
        }

        this.circuitBreakers.set(serviceName, circuitBreaker);
    }

    /**
     * Call identity service for user authentication (Java service)
     */
    async authenticateUser(token) {
        try {
            const identityClient = await this.getServiceClient('identity');
            const response = await identityClient.post(config.services.identity.endpoints.authenticate, { token });
            return response.data;
        } catch (error) {
            console.error('Java Identity service authentication failed:', error.message);
            throw new Error('Authentication service unavailable');
        }
    }

    /**
     * Get user profile from Java identity service
     */
    async getUserProfile(userId) {
        try {
            const identityClient = await this.getServiceClient('identity');
            const endpoint = config.services.identity.endpoints.getUser.replace('{id}', userId);
            const response = await identityClient.get(endpoint);
            return response.data;
        } catch (error) {
            console.error('Failed to get user profile from Java service:', error.message);
            return null;
        }
    }

    /**
     * Update user copyright count in Java identity service
     */
    async updateUserCopyrightCount(userAddress, increment = 1) {
        try {
            const identityClient = await this.getServiceClient('identity');
            const response = await identityClient.post(config.services.identity.endpoints.updateCopyrightCount, {
                userAddress,
                increment
            });
            return response.data;
        } catch (error) {
            console.error('Failed to update copyright count in Java service:', error.message);
            throw new Error('Identity service update failed');
        }
    }

    /**
     * Send analytics data to Java analytics service
     */
    async sendAnalytics(eventType, data) {
        try {
            const analyticsClient = await this.getServiceClient('analytics');
            const analyticsData = {
                serviceName: 'copyright-service',
                eventType,
                data: {
                    ...data,
                    timestamp: new Date().toISOString(),
                    source: 'nodejs-copyright-service'
                },
                metadata: {
                    version: require('../../package.json').version,
                    environment: config.server.env
                }
            };

            await analyticsClient.post(config.services.analytics.endpoints.sendEvent, analyticsData);
        } catch (error) {
            // Don't throw error for analytics - it's not critical
            console.warn('Java Analytics service unavailable:', error.message);
        }
    }

    /**
     * Send notification to Java notification service
     */
    async sendNotification(recipient, type, message, data = {}) {
        try {
            const notificationClient = await this.getServiceClient('notification');
            const notificationData = {
                recipient,
                type,
                title: `Copyright Service - ${type}`,
                message,
                data: {
                    ...data,
                    source: 'nodejs-copyright-service',
                    serviceType: 'copyright',
                    timestamp: new Date().toISOString()
                },
                priority: 'normal',
                channels: ['email', 'in-app']
            };

            await notificationClient.post(config.services.notification.endpoints.sendNotification, notificationData);
        } catch (error) {
            console.warn('Java Notification service unavailable:', error.message);
        }
    }

    /**
     * Synchronize copyright data with other services
     */
    async syncCopyrightData(copyrightData) {
        const syncPromises = [];

        // Sync with analytics service
        syncPromises.push(this.sendAnalytics('copyright_registered', {
            copyrightId: copyrightData.id,
            hash: copyrightData.hash,
            ownerAddress: copyrightData.ownerAddress
        }));

        // Send notification to owner
        syncPromises.push(this.sendNotification(
            copyrightData.ownerAddress,
            'copyright_registered',
            'Your document has been successfully registered for copyright protection.',
            { copyrightId: copyrightData.id }
        ));

        // Get user profile for additional context
        syncPromises.push(this.getUserProfile(copyrightData.ownerAddress));

        try {
            const results = await Promise.allSettled(syncPromises);
            console.log('✅ Data synchronization completed:', results.length, 'services updated');
            return results;
        } catch (error) {
            console.error('❌ Data synchronization failed:', error.message);
            throw error;
        }
    }

    /**
     * Health check all dependent services
     */
    async healthCheck() {
        const healthResults = {};

        for (const serviceName of Object.keys(config.services)) {
            try {
                const client = await this.getServiceClient(serviceName);
                const response = await client.get('/health');
                healthResults[serviceName] = {
                    status: 'UP',
                    responseTime: Date.now() - Date.now(), // Would need to measure properly
                    ...response.data
                };
            } catch (error) {
                healthResults[serviceName] = {
                    status: 'DOWN',
                    error: error.message
                };
            }
        }

        return healthResults;
    }

    /**
     * Get circuit breaker status
     */
    getCircuitBreakerStatus() {
        const status = {};
        for (const [serviceName, circuitBreaker] of this.circuitBreakers.entries()) {
            status[serviceName] = {
                failures: circuitBreaker.failures,
                lastFailure: circuitBreaker.lastFailure,
                state: circuitBreaker.failures >= 5 ? 'OPEN' : 'CLOSED'
            };
        }
        return status;
    }
}

module.exports = new ServiceCommunication();

const Eureka = require('eureka-js-client').Eureka;
const config = require('../config');

class ServiceDiscovery {
    constructor() {
        this.client = null;
        this.isRegistered = false;
    }

    /**
     * Initialize Eureka client
     */
    initialize() {
        if (!config.discovery.enabled) {
            console.log('Service Discovery is disabled');
            return;
        }

        const eurekaConfig = {
            instance: {
                app: 'COPYRIGHT-SERVICE',
                hostName: this.getLocalIP(),
                ipAddr: this.getLocalIP(),
                port: {
                    '$': config.server.port,
                    '@enabled': 'true',
                },
                vipAddress: 'COPYRIGHT-SERVICE',
                secureVipAddress: 'COPYRIGHT-SERVICE',
                dataCenterInfo: {
                    '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                    name: 'MyOwn'
                },
                leaseInfo: {
                    renewalIntervalInSecs: 30,
                    durationInSecs: 90,
                    registrationTimestamp: Date.now(),
                    lastRenewalTimestamp: Date.now(),
                    evictionTimestamp: 0,
                    serviceUpTimestamp: Date.now()
                },
                status: 'UP',
                overriddenStatus: 'UNKNOWN',
                actionType: 'ADDED',
                metadata: {
                    'management.context-path': '/',
                    'management.security.enabled': 'false',
                    'health.path': '/health',
                    'status.path': '/status',
                    'node.version': process.version,
                    'service.type': 'nodejs'
                },
                healthCheckUrl: `http://${this.getLocalIP()}:${config.server.port}/health`,
                statusPageUrl: `http://${this.getLocalIP()}:${config.server.port}/status`,
                homePageUrl: `http://${this.getLocalIP()}:${config.server.port}/`
            },
            eureka: {
                host: config.discovery.eureka.host,
                port: config.discovery.eureka.port,
                servicePath: config.discovery.eureka.servicePath,
                heartbeatInterval: config.discovery.eureka.heartbeatInterval,
                registryFetchInterval: config.discovery.eureka.registryFetchInterval,
                fetchRegistry: true,
                registerWithEureka: true,
                preferIpAddress: config.discovery.eureka.preferIpAddress,
                useLocalMetadata: config.discovery.eureka.useLocalMetadata,
                serviceUrls: {
                    default: [`http://${config.discovery.eureka.host}:${config.discovery.eureka.port}${config.discovery.eureka.servicePath}`]
                }
            },
        };

        this.client = new Eureka(eurekaConfig);

        this.client.on('started', () => {
            console.log('✅ Copyright Service registered with Eureka');
            this.isRegistered = true;
        });

        this.client.on('registryUpdated', () => {
            console.log('📡 Service registry updated');
        });

        this.client.on('deregistered', () => {
            console.log('❌ Copyright Service deregistered from Eureka');
            this.isRegistered = false;
        });

        this.client.start();
    }

    /**
     * Get local IP address
     */
    getLocalIP() {
        console.log(`[DEBUG] Server environment is: ${config.server.env}`);
        if (config.server.env === 'development') {
            console.log('[DEBUG] Returning localhost for development environment.');
            return 'localhost';
        }
        const os = require('os');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const networkInterface of interfaces[name]) {
                if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                    console.log(`[DEBUG] Returning IP address: ${networkInterface.address}`);
                    return networkInterface.address;
                }
            }
        }
        console.log('[DEBUG] Returning 127.0.0.1 as fallback.');
        return '127.0.0.1';
    }

    /**
     * Discover other services
     */
    async discoverService(serviceName) {
        if (!this.isRegistered || !this.client) {
            throw new Error('Service Discovery not initialized');
        }

        return new Promise((resolve, reject) => {
            this.client.getInstancesByAppId(serviceName, (error, instances) => {
                if (error) {
                    reject(error);
                    return;
                }

                if (!instances || instances.length === 0) {
                    reject(new Error(`Service ${serviceName} not found`));
                    return;
                }

                // Return the first healthy instance
                const instance = instances.find(inst => inst.status === 'UP') || instances[0];
                resolve({
                    host: instance.ipAddr,
                    port: instance.port.$,
                    url: `http://${instance.ipAddr}:${instance.port.$}`
                });
            });
        });
    }

    /**
     * Get all registered services
     */
    getRegisteredServices() {
        if (!this.client) {
            return [];
        }

        try {
            // Get all applications from Eureka
            const apps = this.client.cache.app;
            if (!apps) {
                return [];
            }

            // Find copyright-service instances
            const copyrightApps = apps['COPYRIGHT-SERVICE'] || [];
            return copyrightApps;
        } catch (error) {
            console.error('Error getting registered services:', error.message);
            return [];
        }
    }

    /**
     * Stop service discovery
     */
    stop() {
        if (this.client) {
            this.client.stop();
            this.isRegistered = false;
        }
    }

    /**
     * Health check for load balancer
     */
    getHealthStatus() {
        return {
            service: 'copyright-service',
            status: this.isRegistered ? 'UP' : 'DOWN',
            timestamp: new Date().toISOString(),
            version: require('../../package.json').version
        };
    }
}

module.exports = new ServiceDiscovery();

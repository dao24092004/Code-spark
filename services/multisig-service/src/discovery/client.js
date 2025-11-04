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
                app: 'MULTISIG-SERVICE',
                hostName: this.getLocalIP(),
                ipAddr: this.getLocalIP(),
                port: {
                    '$': config.server.port,
                    '@enabled': 'true',
                },
                vipAddress: 'MULTISIG-SERVICE',
                secureVipAddress: 'MULTISIG-SERVICE',
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
                    'node.version': process.version,
                    'service.type': 'nodejs'
                },
                healthCheckUrl: `http://${this.getLocalIP()}:${config.server.port}/health`,
                statusPageUrl: `http://${this.getLocalIP()}:${config.server.port}/health`,
                homePageUrl: `http://${this.getLocalIP()}:${config.server.port}/`
            },
            eureka: {
                host: config.discovery.host,
                port: config.discovery.port,
                servicePath: '/eureka/apps/',
                heartbeatInterval: 30000,
                registryFetchInterval: 30000,
                fetchRegistry: true,
                registerWithEureka: true,
                preferIpAddress: true,
                serviceUrls: {
                    default: [`http://${config.discovery.host}:${config.discovery.port}/eureka/apps/`]
                }
            },
        };

        this.client = new Eureka(eurekaConfig);

        this.client.on('started', () => {
            console.log('✅ Multisig Service registered with Eureka');
            this.isRegistered = true;
        });

        this.client.on('registryUpdated', () => {
            console.log('📡 Service registry updated');
        });

        this.client.on('deregistered', () => {
            console.log('❌ Multisig Service deregistered from Eureka');
            this.isRegistered = false;
        });

        this.client.start();
    }

    /**
     * Get local IP address
     */
    getLocalIP() {
        if (config.server.env === 'development' || config.server.env === 'docker') {
            return 'localhost';
        }
        const os = require('os');
        const interfaces = os.networkInterfaces();
        for (const name of Object.keys(interfaces)) {
            for (const networkInterface of interfaces[name]) {
                if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
                    return networkInterface.address;
                }
            }
        }
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
     * Stop service discovery
     */
    stop() {
        if (this.client) {
            this.client.stop();
            this.isRegistered = false;
        }
    }
}

module.exports = new ServiceDiscovery();


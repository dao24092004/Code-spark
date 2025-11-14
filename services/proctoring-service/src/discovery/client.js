const { networkInterfaces } = require('os');
const { Eureka } = require('eureka-js-client');

const config = require('../config');

class ServiceDiscovery {
  constructor() {
    this.client = null;
    this.isRegistered = false;
  }

  initialize() {
    if (!config.discovery.enabled) {
      console.log('🔍 Service discovery disabled for proctoring-service');
      return;
    }

    const host = this.getLocalIP();

    this.client = new Eureka({
      instance: {
        app: config.discovery.eureka.appName || 'PROCTORING-SERVICE',
        hostName: host,
        ipAddr: host,
        port: {
          $: config.server.port,
          '@enabled': 'true'
        },
        vipAddress: 'PROCTORING-SERVICE',
        statusPageUrl: `http://${host}:${config.server.port}/status`,
        healthCheckUrl: `http://${host}:${config.server.port}/health`,
        homePageUrl: `http://${host}:${config.server.port}/`,
        dataCenterInfo: {
          '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
          name: 'MyOwn'
        },
        metadata: {
          'service.type': 'nodejs',
          'websocket.path': config.websocket.path,
          'websocket.supported': 'true'
        }
      },
      eureka: {
        host: config.discovery.eureka.host,
        port: config.discovery.eureka.port,
        servicePath: config.discovery.eureka.servicePath,
        heartbeatInterval: config.discovery.eureka.heartbeatInterval,
        registryFetchInterval: config.discovery.eureka.registryFetchInterval,
        fetchRegistry: true,
        registerWithEureka: true,
        preferIpAddress: config.discovery.eureka.preferIpAddress
      }
    });

    this.client.on('started', () => {
      this.isRegistered = true;
      console.log('✅ Proctoring Service registered with Eureka');
    });

    this.client.on('registryUpdated', () => {
      console.log('📡 Eureka registry updated');
    });

    this.client.on('deregistered', () => {
      this.isRegistered = false;
      console.log('❌ Proctoring Service deregistered from Eureka');
    });

    this.client.start(error => {
      if (error) {
        console.error('❌ Failed to register with Eureka:', error.message);
      }
    });
  }

  stop() {
    if (this.client && this.isRegistered) {
      this.client.stop();
      this.isRegistered = false;
    }
  }

  getLocalIP() {
    if (config.server.env === 'development') {
      return 'localhost';
    }

    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const net of interfaces[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    return '127.0.0.1';
  }
}

module.exports = new ServiceDiscovery();


const Eureka = require('eureka-js-client').Eureka;

const port = process.env.PORT || 3000;
const eurekaHost = process.env.EUREKA_HOST || 'localhost';
const eurekaPort = process.env.EUREKA_PORT || 9999;

const client = new Eureka({
    instance: {
        app: 'copyright-service',
        hostName: 'copyright-service',
        ipAddr: '127.0.0.1', // This will be resolved by Eureka server
        port: {
            '$': port,
            '@enabled': 'true',
        },
        vipAddress: 'copyright-service',
        dataCenterInfo: {
            '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
            name: 'MyOwn',
        },
    },
    eureka: {
        host: eurekaHost,
        port: eurekaPort,
        servicePath: '/eureka',
    },
});

module.exports = client;
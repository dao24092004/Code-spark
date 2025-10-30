const Eureka = require('eureka-js-client').Eureka;
const config = require('../config');

let eurekaClient;

const initialize = () => {
    if (!config.discovery.enabled) {
        console.log('🔍 Service Discovery bị vô hiệu hóa.');
        return;
    }

    const { host, port, serviceName } = config.discovery;
    const serverPort = config.server.port;

    eurekaClient = new Eureka({
        instance: {
            app: serviceName.toUpperCase(),
            hostName: 'localhost',
            ipAddr: '127.0.0.1',
            statusPageUrl: `http://localhost:${serverPort}/health`,
            healthCheckUrl: `http://localhost:${serverPort}/health`,
            port: {
                '$': serverPort,
                '@enabled': 'true',
            },
            vipAddress: serviceName,
            dataCenterInfo: {
                '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
                name: 'MyOwn',
            },
        },
        eureka: {
            host: host,
            port: port,
            servicePath: '/eureka/apps/',
        },
    });

    eurekaClient.start(error => {
        if (error) {
            console.error('❌ Lỗi khi khởi động Eureka client:', error);
        } else {
            console.log('✅ Eureka client đã đăng ký thành công.');
        }
    });
};

const stop = () => {
    if (eurekaClient) {
        eurekaClient.stop();
    }
};

module.exports = { initialize, stop };
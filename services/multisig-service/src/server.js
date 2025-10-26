const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const serviceDiscovery = require('./discovery/client');
const multisigRoutes = require('./routes/multisig.routes');

class MicroservicesServer {
    constructor() {
        this.app = express();
        this.initializeMiddleware();
        this.setupRoutes();
        this.setupErrorHandling();
        this.initializeServices();
    }

    initializeMiddleware() {
        this.app.use(helmet());
        this.app.use(cors());
        this.app.use(morgan('dev'));
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
    }

    setupRoutes() {
        this.app.get('/health', (req, res) => res.status(200).send('UP'));
        this.app.use('/api/v1/multisig', multisigRoutes);
    }

    setupErrorHandling() {
        // 404 handler
        this.app.use((req, res, next) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });

        // Global error handler
        this.app.use((error, req, res, next) => {
            console.error(error);
            res.status(error.statusCode || 500).json({
                error: error.message || 'Internal Server Error'
            });
        });
    }

    initializeServices() {
        serviceDiscovery.initialize();
    }

    start() {
        const port = config.server.port;
        this.server = this.app.listen(port, () => {
            console.log(`🚀 Multisig Service đang chạy trên cổng ${port}`);
        });
    }
}

// Khởi chạy server
const server = new MicroservicesServer();
server.start();
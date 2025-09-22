require('dotenv').config();
const app = require('./src/app');
const sequelize = require('./src/config/db');
const eurekaClient = require('./src/config/eureka');

const port = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // 1. Connect to the database
        await sequelize.authenticate();
        console.log('Successfully connected to PostgreSQL.');

        // 2. Sync all Sequelize models
        await sequelize.sync({ alter: true });
        console.log('All models were synchronized successfully.');

        // 3. Start the Express server
        app.listen(port, () => {
            console.log(`Copyright service listening at http://localhost:${port}`);
            
            // 4. Register with Eureka
            eurekaClient.start(error => {
                if (error) {
                    console.log('Eureka client failed to start: ' + error.message);
                } else {
                    console.log('Eureka client registered successfully.');
                }
            });
        });

    } catch (error) {
        console.error('Failed to start the service:', error);
        process.exit(1);
    }
};

startServer();
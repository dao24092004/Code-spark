const express = require('express');
const copyrightRoutes = require('./routes/copyright.routes');

const app = express();

// Middleware
app.use(express.json());

// API Routes
app.use('/copyrights', copyrightRoutes);

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Copyright service is running.');
});

module.exports = app;
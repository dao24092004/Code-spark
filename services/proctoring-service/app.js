// app.js
const express = require('express');
const cors = require('cors');

const config = require('./src/config');
const proctoringRoutes = require('./src/routes/proctoring.routes');

const app = express();

// CORS is handled by API Gateway - Disabled to prevent duplicate headers
// const corsOptions = {
//   origin: config.security.corsOrigins,
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
// };
// app.use(cors(corsOptions));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/api/proctoring', proctoringRoutes);
app.use('/api/v1/proctoring', proctoringRoutes);
app.use('/proctoring', proctoringRoutes);

app.get('/', (req, res) => {
  res.json({ status: 'Proctoring Service is running' });
});

app.get('/ws', (req, res) => {
  res.send('WebSocket endpoint');
});

module.exports = app;
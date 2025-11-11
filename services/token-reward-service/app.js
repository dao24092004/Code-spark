// app.js
const express = require('express');
const app = express();

// CORS Configuration - Allow frontend to access API
const cors = require('cors');
const corsOptions = {
    origin: ['http://localhost:4173', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware logging để debug
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Middleware cơ bản
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Một route đơn giản để kiểm tra
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the Token Reward Service application logic!" });
});

// TODO: Nơi chúng ta sẽ import và sử dụng các file routes sau này
// Ví dụ: const tokenRoutes = require('./src/routes/tokenRoutes');
// app.use('/api/tokens', tokenRoutes);
const tokenRoutes = require('./src/routes/tokenRoutes');
app.use('/api/tokens', tokenRoutes);

// Xuất ra app để file server.js có thể sử dụng
module.exports = app;
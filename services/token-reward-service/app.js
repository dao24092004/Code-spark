// app.js
const express = require('express');
const app = express();

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
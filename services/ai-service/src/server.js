const express = require('express');
// const cors = require('cors'); // <--- 1. COMMENT HOẶC XÓA DÒNG NÀY
// ĐƯỜNG DẪN QUAN TRỌNG: Gọi folder config nằm cùng cấp trong src
const config = require('./config');
const aiRoutes = require('./routes/ai.routes');

const app = express();

// Middleware
// app.use(cors()); // <--- 2. QUAN TRỌNG NHẤT: COMMENT HOẶC XÓA DÒNG NÀY
app.use(express.json());

// Routes
app.use('/api/v1/ai', aiRoutes);

// Health Check Route
app.get('/', (req, res) => {
  res.send('AI Service is running...');
});

// Start Server
const PORT = config.port || 3002;
app.listen(PORT, () => {
  console.log(`AI Service running on port ${PORT}`);
  console.log(`Environment: ${config.env}`);
});
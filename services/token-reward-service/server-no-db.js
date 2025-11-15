const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import routes
const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const rewardRoutes = require('./src/routes/reward.routes');
const walletRoutes = require('./src/routes/wallet.routes');
const giftRoutes = require('./src/routes/gift.routes');
const tokenRoutes = require('./src/routes/token.routes');
const blockchainRoutes = require('./src/routes/blockchain.routes');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/wallets', walletRoutes);
app.use('/api/gifts', giftRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/blockchain', blockchainRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', service: 'token-reward-service' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Token Reward Service running on port ${PORT}`);
    console.log('⚠️  Database initialization skipped - running without database');
});

module.exports = app;

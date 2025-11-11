const express = require('express');
const router = express.Router();
const tokenController = require('../controllers/tokenController');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const db = require('../models');

// Định nghĩa một route: Khi có request POST tới /grant,
// hàm grantTokenHandler trong tokenController sẽ được gọi.
//router.post('/grant', authenticateToken, checkPermission('token:grant'), tokenController.grantTokenHandler);
router.post('/grant', authenticateToken, tokenController.grantTokenHandler);

// UC27: Tiêu token (mới)
router.post('/spend', authenticateToken, tokenController.spendTokenHandler);

// Test route để debug
router.get('/test', (req, res) => {
    res.json({ message: 'Route test works!' });
});

// UC28a: Lấy số dư (mới) - dùng param :studentId
router.get('/balance/:studentId', authenticateToken, tokenController.getBalanceHandler);

// UC28b: Lấy lịch sử (mới) - dùng param :studentId
router.get('/history/:studentId', authenticateToken, tokenController.getHistoryHandler);

router.get('/gifts', async (req, res) => {
    try {
        const gifts = await db.Gift.findAll();
        // Transform to match frontend expected format
        const transformedGifts = gifts.map(gift => ({
            id: gift.id,
            name: gift.name,
            description: gift.description,
            imageUrl: gift.imageUrl,
            tokenPrice: gift.tokenPrice,
            stockQuantity: gift.stockQuantity,
            category: gift.category
        }));

        res.json(transformedGifts);
    } catch (error) {
        console.error('Error fetching gifts:', error);
        res.status(500).json({ error: 'Failed to fetch gifts' });
    }
});

// GET /api/tokens/gifts/:id - Get gift details from database
router.get('/gifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const gift = await db.Gift.findByPk(id);

        if (!gift) {
            return res.status(404).json({ error: 'Gift not found' });
        }

        // Transform to match frontend expected format
        const transformedGift = {
            id: gift.id,
            name: gift.name,
            description: gift.description,
            imageUrl: gift.imageUrl,
            tokenPrice: gift.tokenPrice,
            stockQuantity: gift.stockQuantity,
            category: gift.category
        };

        res.json(transformedGift);
    } catch (error) {
        console.error('Error fetching gift:', error);
        res.status(500).json({ error: 'Failed to fetch gift' });
    }
});

// ==================== Token Balance ====================
// Route đã được định nghĩa ở trên (dòng 15) với controller

// ==================== Token History ====================
// Route đã được định nghĩa ở trên (dòng 18) với controller

// ==================== Grant Tokens (Admin) ====================
// Route handled above via controller

// ==================== Spend Tokens ====================

// POST /api/tokens/spend - handled above via controller

// ==================== Admin Endpoints ====================

// GET /api/tokens/admin/transactions - Get all transactions (admin only)
router.get('/admin/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { count, rows: rewards } = await db.Reward.findAndCountAll({
            order: [['awardedAt', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            totalItems: count,
            totalPages,
            currentPage: page,
            transactions: rewards.map(r => ({
                id: r.id.toString(),
                studentId: r.studentId.toString(),
                tokensAwarded: r.tokensAwarded,
                reasonCode: r.reasonCode,
                relatedId: r.relatedId,
                awardedAt: r.awardedAt,
                transaction_type: r.transaction_type
            }))
        });
    } catch (error) {
        console.error('Error getting all transactions:', error);
        res.status(500).json({ error: 'Failed to get transactions' });
    }
});

// GET /api/tokens/admin/stats - Get overall statistics (admin only)
router.get('/admin/stats', async (req, res) => {
    try {
        const allRewards = await db.Reward.findAll();

        const earnRecords = allRewards.filter(r => r.transaction_type === 'EARN');
        const spendRecords = allRewards.filter(r => r.transaction_type === 'SPEND');

        const totalEarned = earnRecords.reduce((sum, r) => sum + Number(r.tokensAwarded), 0);
        const totalSpent = spendRecords.reduce((sum, r) => sum + Number(r.tokensAwarded), 0);
        const currentBalance = totalEarned - totalSpent;

        // Get unique users
        const uniqueUsers = new Set(allRewards.map(r => r.studentId));

        // Get today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRewards = allRewards.filter(r => new Date(r.awardedAt) >= today);
        const todayTokens = todayRewards.reduce((sum, r) => sum + Number(r.tokensAwarded), 0);

        res.json({
            totalTokensIssued: totalEarned,
            totalTokensSpent: totalSpent,
            currentBalance,
            totalUsers: uniqueUsers.size,
            totalTransactions: allRewards.length,
            totalEarnTransactions: earnRecords.length,
            totalSpendTransactions: spendRecords.length,
            todayTransactions: todayRewards.length,
            todayTokensDistributed: todayTokens
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Failed to get stats' });
    }
});

// GET /api/tokens/admin/top-users - Get top users by token balance (admin only)
router.get('/admin/top-users', async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 10;
        
        // Get all rewards grouped by student
        const allRewards = await db.Reward.findAll();
        
        // Calculate balance for each student
        const userBalances = {};
        allRewards.forEach(r => {
            const studentId = r.studentId.toString();
            if (!userBalances[studentId]) {
                userBalances[studentId] = {
                    studentId,
                    totalEarned: 0,
                    totalSpent: 0,
                    balance: 0,
                    transactionCount: 0
                };
            }
            
            if (r.transaction_type === 'EARN') {
                userBalances[studentId].totalEarned += Number(r.tokensAwarded);
            } else {
                userBalances[studentId].totalSpent += Number(r.tokensAwarded);
            }
            userBalances[studentId].balance = userBalances[studentId].totalEarned - userBalances[studentId].totalSpent;
            userBalances[studentId].transactionCount += 1;
        });
        
        // Convert to array and sort by balance
        const topUsers = Object.values(userBalances)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, limit);
        
        res.json(topUsers);
    } catch (error) {
        console.error('Error getting top users:', error);
        res.status(500).json({ error: 'Failed to get top users' });
    }
});

// GET /api/tokens/admin/rule-performance - Get reward rule performance stats
router.get('/admin/rule-performance', async (req, res) => {
    try {
        // Get all rewards grouped by reason code
        const allRewards = await db.Reward.findAll({
            where: {
                transaction_type: 'EARN'
            }
        });
        
        // Calculate stats for each reason code
        const ruleStats = {};
        allRewards.forEach(r => {
            const reasonCode = r.reasonCode || 'UNKNOWN';
            if (!ruleStats[reasonCode]) {
                ruleStats[reasonCode] = {
                    ruleId: reasonCode,
                    ruleName: reasonCode.replace(/_/g, ' '),
                    usageCount: 0,
                    totalTokensDistributed: 0,
                    successRate: 100,
                    averageReward: 0
                };
            }
            
            ruleStats[reasonCode].usageCount += 1;
            ruleStats[reasonCode].totalTokensDistributed += Number(r.tokensAwarded);
        });
        
        // Calculate average for each rule
        Object.values(ruleStats).forEach((rule) => {
            rule.averageReward = Math.round(rule.totalTokensDistributed / rule.usageCount);
        });
        
        // Convert to array and sort by total tokens distributed
        const rulePerformance = Object.values(ruleStats)
            .sort((a, b) => b.totalTokensDistributed - a.totalTokensDistributed);
        
        res.json(rulePerformance);
    } catch (error) {
        console.error('Error getting rule performance:', error);
        res.status(500).json({ error: 'Failed to get rule performance' });
    }
});

// ==================== Withdraw Tokens ====================
// Use controller which performs on-chain transfer via blockchainService
router.post('/withdraw', authenticateToken, tokenController.withdrawTokenHandler);

// Route catch-all để debug (phải đặt ở cuối cùng)
// Lưu ý: Route này chỉ chạy nếu không có route nào match trước đó
router.use((req, res, next) => {
    console.log('⚠️ Route not matched:', req.method, req.originalUrl);
    console.log('Available routes should include: GET /balance/:studentId');
    next();
});

module.exports = router; 

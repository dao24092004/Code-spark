const express = require('express');
const router = express.Router();
const { Reward, Gift } = require('../models');
const { Op } = require('sequelize');

// ==================== Gift Store ====================

// GET /api/tokens/gifts - Get available gifts from database
router.get('/gifts', async (req, res) => {
    try {
        const { category } = req.query;

        const whereClause = {};
        if (category && category !== 'all') {
            whereClause.category = category;
        }

        const gifts = await Gift.findAll({
            where: whereClause,
            order: [['category', 'ASC'], ['tokenPrice', 'ASC']]
        });

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
        const gift = await Gift.findByPk(id);

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

// GET /api/tokens/balance/:studentId - Get user's token balance
router.get('/balance/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;

        // Calculate balance from rewards
        const earnRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'EARN'
            }
        });

        const spendRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'SPEND'
            }
        });

        const totalEarned = earnRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const totalSpent = spendRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const balance = totalEarned - totalSpent;

        res.json({
            tokenBalance: balance,
            balance,
            totalEarned,
            totalSpent
        });
    } catch (error) {
        console.error('Error getting balance:', error);
        res.status(500).json({ error: 'Failed to get balance' });
    }
});

// ==================== Token History ====================

// GET /api/tokens/history/:studentId - Get user's transaction history
router.get('/history/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const offset = (page - 1) * limit;

        const { count, rows: rewards } = await Reward.findAndCountAll({
            where: { studentId },
            order: [['awardedAt', 'DESC']],
            limit,
            offset
        });

        const totalPages = Math.ceil(count / limit);

        res.json({
            totalItems: count,
            totalPages,
            currentPage: page,
            rewards: rewards.map(r => ({
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
        console.error('Error getting history:', error);
        res.status(500).json({ error: 'Failed to get history' });
    }
});

// ==================== Grant Tokens (Admin) ====================

// POST /api/tokens/grant - Grant tokens to a student
router.post('/grant', async (req, res) => {
    try {
        const { studentId, amount, reasonCode, relatedId } = req.body;

        if (!studentId || !amount) {
            return res.status(400).json({ error: 'studentId and amount are required' });
        }

        const reward = await Reward.create({
            studentId,
            tokensAwarded: amount,
            reasonCode: reasonCode || 'ADMIN_GRANT',
            relatedId: relatedId || null,
            awardedAt: new Date(),
            transaction_type: 'EARN'
        });

        res.status(201).json({
            message: 'Tokens granted successfully',
            reward: {
                id: reward.id.toString(),
                studentId: reward.studentId.toString(),
                tokensAwarded: reward.tokensAwarded,
                reasonCode: reward.reasonCode,
                relatedId: reward.relatedId,
                awardedAt: reward.awardedAt,
                transaction_type: reward.transaction_type
            }
        });
    } catch (error) {
        console.error('Error granting tokens:', error);
        res.status(500).json({ error: 'Failed to grant tokens' });
    }
});

// ==================== Spend Tokens ====================

// POST /api/tokens/spend - Spend tokens (purchase, redeem)
router.post('/spend', async (req, res) => {
    try {
        const { studentId, amount, reasonCode, relatedId } = req.body;

        if (!studentId || !amount) {
            return res.status(400).json({ error: 'studentId and amount are required' });
        }

        // Check if user has enough balance
        const earnRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'EARN'
            }
        });

        const spendRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'SPEND'
            }
        });

        const totalEarned = earnRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const totalSpent = spendRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const currentBalance = totalEarned - totalSpent;

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // Create spend record
        const reward = await Reward.create({
            studentId,
            tokensAwarded: amount,
            reasonCode: reasonCode || 'PURCHASE',
            relatedId: relatedId || null,
            awardedAt: new Date(),
            transaction_type: 'SPEND'
        });

        res.status(201).json({
            message: 'Tokens spent successfully',
            reward: {
                id: reward.id.toString(),
                studentId: reward.studentId.toString(),
                tokensAwarded: reward.tokensAwarded,
                reasonCode: reward.reasonCode,
                relatedId: reward.relatedId,
                awardedAt: reward.awardedAt,
                transaction_type: reward.transaction_type
            },
            newBalance: currentBalance - amount
        });
    } catch (error) {
        console.error('Error spending tokens:', error);
        res.status(500).json({ error: 'Failed to spend tokens' });
    }
});

// ==================== Admin Endpoints ====================

// GET /api/tokens/admin/transactions - Get all transactions (admin only)
router.get('/admin/transactions', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        const { count, rows: rewards } = await Reward.findAndCountAll({
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
        const allRewards = await Reward.findAll();

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
        const allRewards = await Reward.findAll();
        
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
        const allRewards = await Reward.findAll({
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

// POST /api/tokens/withdraw - Withdraw tokens to blockchain address
router.post('/withdraw', async (req, res) => {
    try {
        const { studentId, amount, toAddress, address: legacyAddress } = req.body;
        const address = toAddress || legacyAddress;

        if (!studentId || !amount || !address) {
            return res.status(400).json({ error: 'studentId, amount, and address are required' });
        }

        // Check balance
        const earnRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'EARN'
            }
        });

        const spendRecords = await Reward.findAll({
            where: {
                studentId,
                transaction_type: 'SPEND'
            }
        });

        const totalEarned = earnRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const totalSpent = spendRecords.reduce((sum, record) => sum + Number(record.tokensAwarded), 0);
        const currentBalance = totalEarned - totalSpent;

        if (currentBalance < amount) {
            return res.status(400).json({ error: 'Insufficient balance' });
        }

        // TODO: Implement blockchain withdrawal logic here
        // For now, just create a spend record
        const numericAmount = Number(amount);

        const reward = await Reward.create({
            studentId,
            tokensAwarded: numericAmount,
            reasonCode: 'WITHDRAWAL',
            relatedId: address, // Store wallet address in relatedId
            awardedAt: new Date(),
            transaction_type: 'SPEND'
        });

        res.status(201).json({
            message: 'Withdrawal request submitted successfully',
            reward: {
                id: reward.id.toString(),
                studentId: reward.studentId.toString(),
                tokensAwarded: reward.tokensAwarded,
                reasonCode: reward.reasonCode,
                address: reward.relatedId,
                awardedAt: reward.awardedAt,
                transaction_type: reward.transaction_type
            },
            newBalance: currentBalance - numericAmount
        });
    } catch (error) {
        console.error('Error withdrawing tokens:', error);
        res.status(500).json({ error: 'Failed to withdraw tokens' });
    }
});

module.exports = router; 

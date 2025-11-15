const express = require('express');
const router = express.Router();

// Mock reward endpoints
router.get('/student/:studentId', (req, res) => {
    res.json({ 
        success: true, 
        rewards: [
            {
                id: 1,
                studentId: req.params.studentId,
                tokensAwarded: 100,
                reasonCode: 'HOMEWORK',
                relatedId: 'HW001',
                transactionType: 'EARN',
                awardedAt: new Date()
            }
        ]
    });
});

router.post('/', (req, res) => {
    res.json({ 
        success: true, 
        reward: {
            id: Date.now(),
            ...req.body,
            awardedAt: new Date()
        }
    });
});

module.exports = router;

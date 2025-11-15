const express = require('express');
const router = express.Router();

// Mock wallet endpoints
router.post('/link', (req, res) => {
    res.json({ 
        success: true, 
        wallet: {
            userId: req.body.userId,
            address: req.body.address,
            status: 'linked'
        }
    });
});

router.get('/user/:userId', (req, res) => {
    res.json({ 
        success: true, 
        wallets: [
            {
                address: '0x1234567890123456789012345678901234567890',
                status: 'linked'
            }
        ]
    });
});

module.exports = router;

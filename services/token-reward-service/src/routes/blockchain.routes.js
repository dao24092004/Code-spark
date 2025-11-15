const express = require('express');
const router = express.Router();

// Mock blockchain endpoints
router.get('/contract-address', (req, res) => {
    res.json({ 
        success: true, 
        address: '0x33c1895603E4E527De06232E0Dc1Cdd8688A6fe5' 
    });
});

router.get('/balance/:address', (req, res) => {
    res.json({ 
        success: true, 
        balance: '1000' 
    });
});

router.post('/transfer', (req, res) => {
    res.json({ 
        success: true, 
        txHash: '0x1234567890abcdef1234567890abcdef12345678' 
    });
});

module.exports = router;

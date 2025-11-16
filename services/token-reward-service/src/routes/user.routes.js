const express = require('express');
const router = express.Router();

// Mock user endpoints
router.get('/:id', (req, res) => {
    res.json({ 
        success: true, 
        user: { 
            id: req.params.id, 
            tokenBalance: 1000 
        } 
    });
});

router.get('/:id/balance', (req, res) => {
    res.json({ 
        success: true, 
        balance: 1000 
    });
});

module.exports = router;

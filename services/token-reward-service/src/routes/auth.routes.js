const express = require('express');
const router = express.Router();

// Mock auth endpoints
router.post('/login', (req, res) => {
    const { studentId } = req.body;
    res.json({ 
        success: true, 
        user: { 
            id: studentId || 12345, 
            tokenBalance: 1000 
        } 
    });
});

router.post('/logout', (req, res) => {
    res.json({ success: true });
});

module.exports = router;

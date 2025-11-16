const express = require('express');
const router = express.Router();

// Mock gift endpoints
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        gifts: [
            {
                id: 'gift-1',
                name: 'Notebook',
                description: 'Sổ tay cao cấp',
                imageUrl: 'https://via.placeholder.com/100',
                tokenPrice: 100,
                stockQuantity: 50,
                category: 'stationery'
            },
            {
                id: 'gift-2',
                name: 'Pen',
                description: 'Bút bi chất lượng',
                imageUrl: 'https://via.placeholder.com/100',
                tokenPrice: 50,
                stockQuantity: 100,
                category: 'stationery'
            }
        ]
    });
});

router.get('/:id', (req, res) => {
    res.json({ 
        success: true, 
        gift: {
            id: req.params.id,
            name: 'Notebook',
            description: 'Sổ tay cao cấp',
            imageUrl: 'https://via.placeholder.com/100',
            tokenPrice: 100,
            stockQuantity: 50,
            category: 'stationery'
        }
    });
});

module.exports = router;

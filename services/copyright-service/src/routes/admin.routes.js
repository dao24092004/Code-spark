const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const { authenticateToken, checkPermission ,checkRole} = require('../middleware/auth');

// Apply authentication and admin check to all admin routes
router.use(authenticateToken);
router.use(checkRole('ADMIN')); // Only users with ADMIN permission can access these routes

// Admin dashboard statistics
router.get('/dashboard/stats', adminController.getAdminDashboardStats);

// Copyright management
router.get('/copyrights', adminController.getAllCopyrights);
router.put('/copyrights/:id/status', adminController.updateCopyrightStatus);
router.post('/copyrights/bulk-status', adminController.bulkUpdateCopyrightStatus);
router.put('/copyrights/:id', adminController.updateCopyrightDetails);
router.get('/copyrights/:id/similarities', adminController.getDocumentSimilarities);

// Audit logs
router.get('/audit-logs', async (req, res) => {
    try {
        const auditLogs = await getAuditLogs({
            ...req.query,
            adminId: req.query.adminId,
            action: req.query.action,
            targetId: req.query.targetId,
            dateFrom: req.query.dateFrom,
            dateTo: req.query.dateTo,
            page: req.query.page || 1,
            limit: req.query.limit || 50,
            sortBy: req.query.sortBy || 'createdAt',
            sortOrder: req.query.sortOrder || 'DESC'
        });
        
        res.json({
            success: true,
            ...auditLogs
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy nhật ký kiểm tra',
            error: error.message
        });
    }
});

module.exports = router;

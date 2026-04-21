const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');

// Tôi thêm import hàm getAuditLogs vì ở code gốc của bạn gọi nó nhưng chưa thấy import
const { getAuditLogs } = require('../services/audit.service'); 

// 1. Nhúng đồ nghề từ thư viện chung
const { checkPermission, asyncHandler, ApiResponse } = require('common-node');

// BỎ DÒNG NÀY: router.use(authenticateToken); (Vì đã có ở app.js)

// 2. Chốt chặn Admin: Yêu cầu quyền ADMIN cho TOÀN BỘ các route bên dưới
router.use(checkPermission('ADMIN')); 

// --- Admin dashboard statistics ---
router.get('/dashboard/stats', adminController.getAdminDashboardStats);

// --- Copyright management ---
router.get('/copyrights', adminController.getAllCopyrights);
router.put('/copyrights/:id/status', adminController.updateCopyrightStatus);
router.post('/copyrights/bulk-status', adminController.bulkUpdateCopyrightStatus);
router.put('/copyrights/:id', adminController.updateCopyrightDetails);
router.get('/copyrights/:id/similarities', adminController.getDocumentSimilarities);

// --- Audit logs ---
// 3. Bọc asyncHandler và trả về ApiResponse chuẩn form, không cần try...catch nữa!
router.get('/audit-logs', asyncHandler(async (req, res) => {
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
    
    // Trả về JSON chuẩn form { success: true, message: "...", data: {...} }
    res.status(200).json(ApiResponse.success("Lấy nhật ký kiểm tra thành công", auditLogs));
}));

module.exports = router;
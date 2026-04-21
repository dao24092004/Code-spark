const express = require('express');
const router = express.Router();
const multer = require('multer');
const copyrightController = require('../controllers/copyright.controller');
const { checkPermission } = require('common-node');

// 1. CẤU HÌNH MULTER: Lưu file tạm xuống ổ cứng để Controller có thể check đạo văn
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/') // Nhớ tạo thư mục 'uploads' ở gốc project
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname)
    }
});

const uploadFile = multer({ storage: storage }).single('file');
const uploadDocument = multer({ storage: storage }).single('document');

// --- Statistics & Analytics endpoints ---
router.get('/stats', checkPermission('FILE_READ'), copyrightController.getCopyrightStats);
router.get('/analytics', checkPermission('FILE_READ'), copyrightController.getAnalytics);
router.get('/recent', checkPermission('FILE_READ'), copyrightController.getRecentCopyrights);
router.get('/blockchain/status', checkPermission('FILE_READ'), copyrightController.getBlockchainStatus);

// --- Search endpoint ---
router.get('/search', checkPermission('FILE_READ'), copyrightController.searchCopyrights);

// --- Similarity Check endpoints ---
router.post('/check-similarity', [checkPermission('FILE_WRITE'), uploadDocument], copyrightController.checkSimilarity);

// --- Owner-specific routes ---
router.get('/owner/:ownerAddress', checkPermission('FILE_READ'), copyrightController.getCopyrightsByOwner);

// --- Download/View file ---
router.get('/download/:id', checkPermission('FILE_READ'), copyrightController.downloadDocument);

// --- Main CRUD routes ---
router.post('/', [checkPermission('FILE_WRITE'), uploadFile], copyrightController.createCopyright);

router.get('/', checkPermission('FILE_READ'), copyrightController.getAllCopyrights);
router.get('/:id', checkPermission('FILE_READ'), copyrightController.getCopyrightById);
router.put('/:id', checkPermission('FILE_WRITE'), copyrightController.updateCopyright);
router.delete('/:id', checkPermission('FILE_DELETE'), copyrightController.deleteCopyright);

module.exports = router;
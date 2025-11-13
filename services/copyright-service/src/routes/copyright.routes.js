const express = require('express');
const router = express.Router();
const path = require('path');
const copyrightController = require('../controllers/copyright.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const { uploadFile, uploadDocument } = require('../middleware/upload');

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// --- Statistics & Analytics endpoints (before parameterized routes) ---
router.get('/stats', checkPermission('FILE_READ'), copyrightController.getCopyrightStats);
router.get('/analytics', checkPermission('FILE_READ'), copyrightController.getAnalytics);
router.get('/recent', checkPermission('FILE_READ'), copyrightController.getRecentCopyrights);
router.get('/blockchain/status', checkPermission('FILE_READ'), copyrightController.getBlockchainStatus);

// --- Search endpoint ---
router.get('/search', checkPermission('FILE_READ'), copyrightController.searchCopyrights);

// --- Similarity Check endpoints ---
// Use uploadDocument for 'document' field
router.post('/check-similarity', [checkPermission('FILE_WRITE'), uploadDocument], copyrightController.checkSimilarity);

// --- Owner-specific routes ---
router.get('/owner/:ownerAddress', checkPermission('FILE_READ'), copyrightController.getCopyrightsByOwner);

// --- Download/View file ---
router.get('/download/:id', checkPermission('FILE_READ'), copyrightController.downloadDocument);

// --- Main CRUD routes ---
// Use uploadFile for 'file' field
router.post('/', [checkPermission('FILE_WRITE'), uploadFile], copyrightController.createCopyright);

router.get('/', checkPermission('FILE_READ'), copyrightController.getAllCopyrights);
router.get('/:id', checkPermission('FILE_READ'), copyrightController.getCopyrightById);
router.put('/:id', checkPermission('FILE_WRITE'), copyrightController.updateCopyright);
router.delete('/:id', checkPermission('FILE_DELETE'), copyrightController.deleteCopyright);

module.exports = router;
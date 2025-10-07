const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const copyrightController = require('../controllers/copyright.controller');
const { authenticateToken, checkPermission } = require('../middleware/auth');

// Custom storage configuration to preserve original filenames
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        // Get original filename without extension
        const originalName = path.parse(file.originalname).name;
        const extension = path.extname(file.originalname);
        const timestamp = Date.now();

        // Check if file with same name already exists
        let finalName = `${originalName}_${timestamp}${extension}`;
        let counter = 1;

        while (fs.existsSync(path.join('uploads/', finalName))) {
            finalName = `${originalName}_${timestamp}_${counter}${extension}`;
            counter++;
        }

        cb(null, finalName);
    }
});

const upload = multer({ storage: storage });

// Apply authentication middleware to all routes in this router
router.use(authenticateToken);

// --- Main CRUD routes ---
router.post('/', [checkPermission('FILE_WRITE'), upload.single('document')], copyrightController.createCopyright);
router.get('/', checkPermission('FILE_READ'), copyrightController.getAllCopyrights);
router.get('/:id', checkPermission('FILE_READ'), copyrightController.getCopyrightById);
router.put('/:id', checkPermission('FILE_WRITE'), copyrightController.updateCopyright);
router.delete('/:id', checkPermission('FILE_DELETE'), copyrightController.deleteCopyright);

// --- Similarity Check endpoints ---
router.post('/check-similarity', [checkPermission('FILE_WRITE'), upload.single('document')], copyrightController.checkSimilarity);

module.exports = router;
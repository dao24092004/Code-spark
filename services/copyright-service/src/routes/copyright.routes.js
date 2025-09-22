const express = require('express');
const router = express.Router();
const multer = require('multer');
const copyrightController = require('../controllers/copyright.controller');

const upload = multer({ dest: 'uploads/' });

// --- Main CRUD routes ---
router.post('/', upload.single('document'), copyrightController.createCopyright);
router.get('/', copyrightController.getAllCopyrights);
router.get('/:id', copyrightController.getCopyrightById);
router.put('/:id', copyrightController.updateCopyright);
router.delete('/:id', copyrightController.deleteCopyright);

// --- New API routes ---
router.get('/search', copyrightController.searchCopyrights);
router.get('/hash/:hash', copyrightController.getCopyrightByHash);
router.get('/:id/verify', copyrightController.verifyCopyright);
router.get('/stats', copyrightController.getCopyrightStats);

module.exports = router;
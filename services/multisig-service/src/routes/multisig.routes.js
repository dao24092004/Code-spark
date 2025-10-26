const express = require('express');
const router = express.Router();
const controller = require('../controllers/multisig.controller');

router.get('/info', controller.getInfo);
router.get('/transactions', controller.getTransactions);
router.post('/submit', controller.submitTransaction);
router.post('/confirm', controller.confirmTransaction);
router.post('/execute', controller.executeTransaction);
router.post('/revoke', controller.revokeConfirmation);

module.exports = router;
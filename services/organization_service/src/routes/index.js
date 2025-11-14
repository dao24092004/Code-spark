const express = require('express');
const router = express.Router();

const organizationRoutes = require('./organization.routes');
const courseRoutes = require('./course.routes');

// Tất cả các route sẽ có tiền tố /organization
router.use('/organization', organizationRoutes);
router.use('/organization', courseRoutes);

module.exports = router;
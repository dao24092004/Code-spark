const express = require('express');
const router = express.Router();

// Import các router con
const organizationRoutes = require('./organization.routes');
const recruitmentRoutes = require('./recruitment.routes'); // <-- DÒNG MỚI
// Định nghĩa đường dẫn cho các router con
// Mọi API trong organizationRoutes sẽ có tiền tố là /organizations
// Ví dụ: /api/v1/organizations/
router.use('/organizations', organizationRoutes);


router.use('/recruitment', recruitmentRoutes); // <-- DÒNG MỚI

// Export router chính
module.exports = router;
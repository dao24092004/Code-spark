const express = require('express');
const router = express.Router();

const organizationController = require('../controllers/organization.controller');
const recruitmentController = require('../controllers/recruitment.controller');
// SỬA ĐƯỜNG DẪN: Đổi từ 'auth.middleware' thành 'auth'
const { authenticateToken } = require('../middleware/auth.js'); 

// API 1: POST /api/v1/organizations
router.post(
  '/', 
  authenticateToken, 
  organizationController.createOrganization
);

// API 2: GET /api/v1/organizations
router.get(
  '/',
  authenticateToken,
  organizationController.getAllOrganizations
);

// API 3: PUT /api/v1/organizations/:id
// :id là một tham số động (dynamic parameter)
router.put(
  '/:id',
  authenticateToken,
  organizationController.updateOrganization
);

// API 4: GET /:id (Lấy 1 chi tiết) - API bạn bổ sung
router.get(
  '/:id',
  authenticateToken,
  organizationController.getOrganizationById
);

// API 5: DELETE /:id (Xóa)
router.delete(
  '/:id',
  authenticateToken,
  organizationController.deleteOrganization
);

// API 6: POST /api/v1/organizations/:orgId/members (Thêm thành viên)
router.post(
  '/:orgId/members',
  authenticateToken,
  organizationController.addMember
);

// API 7: GET /api/v1/organizations/:orgId/members (Lấy danh sách thành viên)
router.get(
  '/:orgId/members',
  authenticateToken,
  organizationController.getOrganizationMembers
);
// API 1 (Nhóm 3): POST /api/v1/organizations/:orgId/recruitment-tests
router.post(
  '/:orgId/recruitment-tests',
  authenticateToken,
  recruitmentController.createTest // <-- Gọi controller mới
);

// API 2 (Nhóm 3): GET /api/v1/organizations/:orgId/recruitment-tests
router.get(
  '/:orgId/recruitment-tests',
  authenticateToken,
  recruitmentController.getTests // <-- Gọi controller mới
);
// SỬA LỖI: Đảm bảo đây là 'module.exports'
module.exports = router;
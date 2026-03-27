const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const recruitmentController = require('../controllers/recruitment.controller');
const { authenticateToken } = require('../middleware/auth.js');

// Middleware to validate ID parameter (hỗ trợ cả BIGINT và UUID)
const validateId = (req, res, next) => {
  const { id, orgId, testId } = req.params;
  const idToValidate = id || orgId || testId;

  // UUID pattern: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Numeric pattern (legacy BIGINT)
  const numericPattern = /^\d+$/;

  if (idToValidate && !uuidPattern.test(idToValidate) && !numericPattern.test(idToValidate)) {
    return res.status(400).json({
      message: 'ID phải là UUID hoặc số nguyên dương.'
    });
  }

  next();
};

// API 1: POST /api/v1/organization
router.post(
  '/', 
  authenticateToken, 
  organizationController.createOrganization
);

// API 2: GET /api/v1/organization
router.get(
  '/',
  authenticateToken,
  organizationController.getAllOrganizations
);

// API 3: PUT /api/v1/organization/:id
router.put(
  '/:id',
  authenticateToken,
  validateId,
  organizationController.updateOrganization
);

// API 4: GET /api/v1/organization/:id
router.get(
  '/:id',
  authenticateToken,
  validateId,
  organizationController.getOrganizationById
);

// API 5: DELETE /api/v1/organization/:id
router.delete(
  '/:id',
  authenticateToken,
  validateId,
  organizationController.deleteOrganization
);

// API 6: POST /api/v1/organization/:orgId/members
router.post(
  '/:orgId/members',
  authenticateToken,
  validateId,
  organizationController.addMember
);

// API 7: GET /api/v1/organization/:orgId/members
router.get(
  '/:orgId/members',
  authenticateToken,
  validateId,
  organizationController.getOrganizationMembers
);

// API 8: POST /api/v1/organization/:orgId/recruitment-tests
router.post(
  '/:orgId/recruitment-tests',
  authenticateToken,
  validateId,
  recruitmentController.createTest
);

// API 9: GET /api/v1/organization/:orgId/recruitment-tests
router.get(
  '/:orgId/recruitment-tests',
  authenticateToken,
  validateId,
  recruitmentController.getTests
);

// API 10: DELETE /api/v1/organization/:orgId/members/:userId
router.delete(
  '/:orgId/members/:userId',
  authenticateToken,
  validateId,
  organizationController.deleteMember
);

// API 11: PATCH /api/v1/organization/:orgId/members/:userId
router.patch(
  '/:orgId/members/:userId',
  authenticateToken,
  validateId,
  organizationController.updateMember
);

// API 12: POST /api/v1/organization/recruitment/tests/:testId/questions
router.post(
  '/recruitment/tests/:testId/questions',
  authenticateToken,
  validateId,
  recruitmentController.addQuestion
);

// API 13: POST /api/v1/organization/recruitment/tests/:testId/questions/upload
router.post(
  '/recruitment/tests/:testId/questions/upload',
  authenticateToken,
  validateId,
  recruitmentController.addQuestionsFromFile
);

// API 14: POST /api/v1/organization/recruitment/tests/:testId/submit
router.post(
  '/recruitment/tests/:testId/submit',
  authenticateToken,
  validateId,
  recruitmentController.submitTest
);

module.exports = router;
const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const recruitmentController = require('../controllers/recruitment.controller');
const { authenticateToken } = require('../middleware/auth.js');

// Middleware to validate ID parameter
const validateId = (req, res, next) => {
  const { id, orgId } = req.params;
  const idToValidate = id || orgId;
  
  if (idToValidate && !/^\d+$/.test(idToValidate)) {
    return res.status(400).json({ 
      message: 'ID phải là một số nguyên dương.'
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

module.exports = router;
const express = require('express');
const router = express.Router();
const AIController = require('../controllers/aiController');
const { validateRequest } = require('../middleware/validation');
const { body } = require('express-validator');

// Validate request body
const validateRecommendationRequest = [
  body('userInput')
    .trim()
    .isLength({ min: 10 })
    .withMessage('User input must be at least 10 characters long'),
  body('preferences')
    .optional()
    .isObject()
    .withMessage('Preferences must be an object'),
  validateRequest
];

/**
 * @route   POST /api/ai/recommend-courses
 * @desc    Get course recommendations based on user input and preferences
 * @access  Public
 */
router.post('/recommend-courses', validateRecommendationRequest, AIController.recommendCourses);

module.exports = router;

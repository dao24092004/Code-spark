const express = require('express');
const { body } = require('express-validator');
const { authenticateToken, checkPermission } = require('../middleware/auth');
const aiController = require('../controllers/ai.controller');
const { validate } = require('../middleware/validate');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * @swagger
 * /api/v1/ai/generate:
 *   post:
 *     summary: Generate text using AI
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - prompt
 *             properties:
 *               prompt:
 *                 type: string
 *                 description: The prompt to generate text from
 *               options:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.7
 *                   maxOutputTokens:
 *                     type: integer
 *                     minimum: 1
 *                     maximum: 2048
 *                     default: 1000
 *     responses:
 *       200:
 *         description: Generated text
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: string
 */
router.post(
  '/generate',
  [
    checkPermission('AI_GENERATE'),
    body('prompt').isString().notEmpty().withMessage('Prompt is required'),
    body('options').optional().isObject(),
    body('options.temperature').optional().isFloat({ min: 0, max: 1 }),
    body('options.maxOutputTokens').optional().isInt({ min: 1, max: 2048 }),
    validate
  ],
  aiController.generateText
);

/**
 * @swagger
 * /api/v1/ai/analyze/course:
 *   post:
 *     summary: Analyze course content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - required: [content]
 *               - required: [courseId]
 *             properties:
 *               content:
 *                 type: string
 *                 description: The course content to analyze
 *               courseId:
 *                 type: string
 *                 description: ID of the course to fetch content from
 *               options:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.5
 *     responses:
 *       200:
 *         description: Course analysis
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     objectives:
 *                       type: array
 *                       items:
 *                         type: string
 *                     topics:
 *                       type: array
 *                       items:
 *                         type: string
 *                     difficulty:
 *                       type: string
 *                       enum: [beginner, intermediate, advanced]
 *                     improvements:
 *                       type: array
 *                       items:
 *                         type: string
 *                     prerequisites:
 *                       type: array
 *                       items:
 *                         type: string
 *                     estimatedStudyTime:
 *                       type: string
 */
router.post(
  '/analyze/course',
  [
    checkPermission('AI_ANALYZE'),
    body().custom((value, { req }) => {
      if (!req.body.content && !req.body.courseId) {
        throw new Error('Either content or courseId must be provided');
      }
      return true;
    }),
    body('content').optional().isString(),
    body('courseId').optional().isString(),
    body('options').optional().isObject(),
    validate
  ],
  aiController.analyzeCourse
);

/**
 * @swagger
 * /api/v1/ai/generate/quiz:
 *   post:
 *     summary: Generate quiz questions from content
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - required: [content]
 *               - required: [courseId]
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content to generate quiz questions from
 *               courseId:
 *                 type: string
 *                 description: ID of the course to fetch content from
 *               count:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 10
 *                 default: 5
 *               options:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.7
 *     responses:
 *       200:
 *         description: Generated quiz questions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       question:
 *                         type: string
 *                       options:
 *                         type: array
 *                         items:
 *                           type: string
 *                       correctAnswer:
 *                         type: integer
 *                         minimum: 0
 *                         maximum: 3
 *                       explanation:
 *                         type: string
 */
router.post(
  '/generate/quiz',
  [
    checkPermission('AI_GENERATE_QUIZ'),
    body().custom((value, { req }) => {
      if (!req.body.content && !req.body.courseId) {
        throw new Error('Either content or courseId must be provided');
      }
      return true;
    }),
    body('content').optional().isString(),
    body('courseId').optional().isString(),
    body('count').optional().isInt({ min: 1, max: 10 }),
    body('options').optional().isObject(),
    validate
  ],
  aiController.generateQuiz
);

/**
 * @swagger
 * /api/v1/ai/chat:
 *   post:
 *     summary: Chat completion with conversation history
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messages
 *             properties:
 *               messages:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - role
 *                     - content
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant]
 *                     content:
 *                       type: string
 *               options:
 *                 type: object
 *                 properties:
 *                   temperature:
 *                     type: number
 *                     minimum: 0
 *                     maximum: 1
 *                     default: 0.7
 *     responses:
 *       200:
 *         description: AI response
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [assistant]
 *                     content:
 *                       type: string
 */
router.post(
  '/chat',
  [
    checkPermission('AI_CHAT'),
    body('messages').isArray().withMessage('Messages must be an array'),
    body('messages.*.role').isIn(['user', 'assistant']).withMessage('Invalid role'),
    body('messages.*.content').isString().withMessage('Content must be a string'),
    body('options').optional().isObject(),
    validate
  ],
  aiController.chatCompletion
);

module.exports = router;

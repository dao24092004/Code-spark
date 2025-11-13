const { StatusCodes } = require('http-status-codes');
const { validationResult } = require('express-validator');
const { ApiError } = require('../middleware/error');
const aiService = require('../services/gemini/ai.service');
const logger = require('../utils/logger');

/**
 * Generate text based on a prompt
 */
exports.generateText = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Validation error', true, {
        errors: errors.array()
      });
    }

    const { prompt, options } = req.body;
    
    logger.info(`Generating text for prompt: ${prompt.substring(0, 50)}...`);
    
    const result = await aiService.generateText(prompt, options);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Analyze course content
 */
exports.analyzeCourse = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Validation error', true, {
        errors: errors.array()
      });
    }

    const { content, courseId, options } = req.body;
    
    // If courseId is provided, fetch course content from database
    let analysisContent = content;
    if (courseId && !content) {
      // TODO: Implement course content fetching from database
      // const course = await db.Course.findByPk(courseId);
      // analysisContent = course.content;
      throw new ApiError(
        StatusCodes.NOT_IMPLEMENTED, 
        'Course content fetching not implemented'
      );
    }

    if (!analysisContent) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST, 
        'Either content or courseId must be provided'
      );
    }
    
    logger.info(`Analyzing course content (${analysisContent.length} chars)`);
    
    const analysis = await aiService.analyzeCourseContent(analysisContent, options);
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate quiz questions from content
 */
exports.generateQuiz = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Validation error', true, {
        errors: errors.array()
      });
    }

    const { content, courseId, options, count = 5 } = req.body;
    
    // If courseId is provided, fetch course content from database
    let quizContent = content;
    if (courseId && !content) {
      // TODO: Implement course content fetching from database
      // const course = await db.Course.findByPk(courseId);
      // quizContent = course.content;
      throw new ApiError(
        StatusCodes.NOT_IMPLEMENTED, 
        'Course content fetching not implemented'
      );
    }

    if (!quizContent) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST, 
        'Either content or courseId must be provided'
      );
    }
    
    logger.info(`Generating ${count} quiz questions from content (${quizContent.length} chars)`);
    
    const questions = await aiService.generateQuizQuestions(quizContent, {
      ...options,
      count: parseInt(count, 10)
    });
    
    res.json({
      success: true,
      data: questions
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Chat completion with conversation history
 */
exports.chatCompletion = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new ApiError(StatusCodes.BAD_REQUEST, 'Validation error', true, {
        errors: errors.array()
      });
    }

    const { messages, options } = req.body;
    
    if (!Array.isArray(messages) || messages.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST, 
        'Messages array is required and must not be empty'
      );
    }
    
    // Validate message format
    const isValidMessage = messages.every(msg => 
      msg.role && (msg.role === 'user' || msg.role === 'assistant') && 
      typeof msg.content === 'string'
    );
    
    if (!isValidMessage) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Each message must have a role (user/assistant) and content (string)'
      );
    }
    
    logger.info(`Processing chat completion with ${messages.length} messages`);
    
    const response = await aiService.chatCompletion(messages, options);
    
    res.json({
      success: true,
      data: {
        role: 'assistant',
        content: response
      }
    });
  } catch (error) {
    next(error);
  }
};

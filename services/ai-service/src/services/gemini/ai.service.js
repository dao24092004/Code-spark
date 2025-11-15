const { GoogleGenerativeAI } = require('@google/generative-ai');
const config = require('../../config');
const logger = require('../../utils/logger');

class AIService {
  constructor() {
    if (!config.gemini.apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables');
    }
    
    try {
      this.ai = new GoogleGenerativeAI(config.gemini.apiKey);
      this.model = this.ai.getGenerativeModel({ 
        model: config.gemini.model,
        generationConfig: {
          temperature: config.gemini.temperature,
          maxOutputTokens: config.gemini.maxOutputTokens,
        },
      });
      
      logger.info(`Initialized Gemini AI with model: ${config.gemini.model}`);
    } catch (error) {
      logger.error('Failed to initialize Gemini AI:', error);
      throw new Error('Failed to initialize AI service');
    }
  }

  /**
   * Generate text based on a prompt
   * @param {string} prompt - The input prompt
   * @param {Object} options - Generation options
   * @returns {Promise<string>} Generated text
   */
  async generateText(prompt, options = {}) {
    try {
      const { 
        temperature = config.gemini.temperature,
        maxOutputTokens = config.gemini.maxOutputTokens,
        systemInstruction
      } = options;

      const generationConfig = {
        temperature,
        maxOutputTokens,
      };

      const generationParams = {
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      };

      if (systemInstruction) {
        generationParams.systemInstruction = {
          role: 'model',
          parts: [{ text: systemInstruction }],
        };
      }

      const result = await this.model.generateContent(generationParams);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Error generating text with Gemini:', error);
      throw new Error(`Failed to generate text: ${error.message}`);
    }
  }

  /**
   * Analyze course content and provide insights
   * @param {string} content - Course content to analyze
   * @param {Object} options - Generation options
   * @returns {Promise<Object>} Analysis results
   */
  async analyzeCourseContent(content, options = {}) {
    try {
      const prompt = `Analyze the following course content and provide detailed insights:

${content}

Please provide a structured analysis including:
1. Key learning objectives
2. Main topics covered
3. Difficulty level assessment
4. Suggested improvements
5. Prerequisites (if any)
6. Estimated study time

Format the response as a JSON object with these fields:
{
  "objectives": ["list", "of", "objectives"],
  "topics": ["main", "topics"],
  "difficulty": "beginner|intermediate|advanced",
  "improvements": ["suggested", "improvements"],
  "prerequisites": ["required", "knowledge"],
  "estimatedStudyTime": "X hours"
}`;

      const response = await this.generateText(prompt, {
        ...options,
        temperature: 0.5, // More focused analysis
        maxOutputTokens: 2000
      });

      // Parse the JSON response
      try {
        // Extract JSON from markdown code block if present
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const parsedResponse = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          success: true,
          ...parsedResponse
        };
      } catch (parseError) {
        logger.error('Failed to parse AI response:', parseError);
        // Fallback to returning the raw text if parsing fails
        return {
          success: false,
          error: 'Failed to parse AI response',
          rawResponse: response
        };
      }
    } catch (error) {
      logger.error('Error analyzing course content:', error);
      throw new Error(`Failed to analyze course content: ${error.message}`);
    }
  }

  /**
   * Generate quiz questions based on content
   * @param {string} content - Content to generate questions from
   * @param {Object} options - Generation options
   * @returns {Promise<Array>} Array of quiz questions
   */
  async generateQuizQuestions(content, options = {}) {
    try {
      const prompt = `Generate 5 multiple-choice quiz questions based on the following content. 
For each question, provide 4 possible answers with exactly one correct answer.

Content:
${content}

Format the response as a JSON array of question objects with this structure:
[
  {
    "question": "The question text",
    "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
    "correctAnswer": 0, // Index of the correct answer
    "explanation": "Explanation of the correct answer"
  }
]`;

      const response = await this.generateText(prompt, {
        ...options,
        temperature: 0.7,
        maxOutputTokens: 2000
      });

      try {
        // Extract JSON from markdown code block if present
        const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                         response.match(/```\n([\s\S]*?)\n```/) || 
                         [null, response];
        
        const questions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return {
          success: true,
          questions: Array.isArray(questions) ? questions : [questions]
        };
      } catch (parseError) {
        logger.error('Failed to parse quiz questions:', parseError);
        return {
          success: false,
          error: 'Failed to parse quiz questions',
          rawResponse: response
        };
      }
    } catch (error) {
      logger.error('Error generating quiz questions:', error);
      throw new Error(`Failed to generate quiz questions: ${error.message}`);
    }
  }

  /**
   * Chat completion with conversation history
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Generation options
   * @returns {Promise<string>} AI response
   */
  async chatCompletion(messages, options = {}) {
    try {
      const chat = this.model.startChat({
        history: messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        })),
        generationConfig: {
          temperature: options.temperature || config.gemini.temperature,
          maxOutputTokens: options.maxOutputTokens || config.gemini.maxOutputTokens,
        },
      });

      const result = await chat.sendMessage(messages[messages.length - 1].content);
      const response = await result.response;
      return response.text();
    } catch (error) {
      logger.error('Error in chat completion:', error);
      throw new Error(`Chat completion failed: ${error.message}`);
    }
  }
}

// Export a singleton instance
module.exports = new AIService();

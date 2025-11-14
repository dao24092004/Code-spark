const axios = require('axios');
const config = require('../config');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Google's Generative AI
const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

class AIController {
  /**
   * Generate course recommendations based on user input
   */
  static async recommendCourses(req, res, next) {
    try {
      const { userInput, preferences = {} } = req.body;
      
      // Get all courses with metadata from course-service
      const courses = await this.fetchAllCourses();
      
      if (!courses || courses.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No courses found',
          data: []
        });
      }

      // Format courses for the prompt
      const formattedCourses = courses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        category: course.metadata?.category,
        subcategory: course.metadata?.subcategory,
        difficulty: course.metadata?.difficultyLevel,
        skills: course.metadata?.skillsCovered,
        targetAudience: course.metadata?.targetAudience,
        learningObjectives: course.metadata?.learningObjectives
      }));

      // Generate prompt for the AI
      const prompt = this.generateRecommendationPrompt(userInput, preferences, formattedCourses);
      
      // Get recommendations from AI
      const recommendations = await this.getAIRecommendations(prompt);
      
      // Match AI response with actual course data
      const recommendedCourses = this.matchAISuggestionsWithCourses(recommendations, formattedCourses);
      
      res.json({
        success: true,
        message: 'Course recommendations generated successfully',
        data: recommendedCourses
      });
      
    } catch (error) {
      console.error('Error generating course recommendations:', error);
      next(error);
    }
  }

  /**
   * Fetch all courses with metadata from course-service
   */
  static async fetchAllCourses() {
    try {
      const response = await axios.get('http://course-service:8082/api/courses/all-with-metadata');
      return response.data.data || [];
    } catch (error) {
      console.error('Error fetching courses:', error.message);
      return [];
    }
  }

  /**
   * Generate a prompt for the AI based on user input and preferences
   */
  static generateRecommendationPrompt(userInput, preferences, courses) {
    // Convert courses to a formatted string for the prompt
    const coursesInfo = courses.map(course => 
      `Course: ${course.title}
       Description: ${course.description}
       Category: ${course.category}
       Subcategory: ${course.subcategory}
       Difficulty: ${course.difficulty}
       Skills: ${course.skills}
       Target Audience: ${course.targetAudience}
       Learning Objectives: ${course.learningObjectives}
       ---`
    ).join('\n\n');

    return `You are an AI course recommendation assistant. Your task is to recommend the most suitable courses based on the user's input and preferences.

User Input: "${userInput}"

User Preferences:
- Preferred difficulty: ${preferences.difficulty || 'Any'}
- Preferred category: ${preferences.category || 'Any'}
- Preferred subcategory: ${preferences.subcategory || 'Any'}
- Time commitment: ${preferences.timeCommitment || 'Flexible'}

Available Courses:
${coursesInfo}

Please analyze the user's input and preferences, then recommend up to 5 most suitable courses from the list above. For each recommendation, provide:
1. Course ID
2. A brief explanation of why this course is recommended
3. How it matches the user's stated preferences or input

Format your response as a JSON array of objects with the following structure:
[
  {
    "courseId": "course-id-here",
    "relevanceScore": 0.9,
    "reasoning": "This course is recommended because...",
    "matchDetails": {
      "preferencesMatched": ["difficulty", "category"],
      "inputKeywords": ["keyword1", "keyword2"]
    }
  }
]`;
  }

  /**
   * Get recommendations from the AI model
   */
  static async getAIRecommendations(prompt) {
    try {
      const model = genAI.getGenerativeModel({ model: config.gemini.model });
      
      const generationConfig = {
        temperature: config.gemini.temperature,
        maxOutputTokens: config.gemini.maxOutputTokens,
      };

      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig,
      });

      const response = await result.response;
      const text = response.text();
      
      // Parse the AI's response (assuming it returns valid JSON)
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Error parsing AI response:', e);
        console.log('Raw AI response:', text);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error);
      throw error;
    }
  }

  /**
   * Match AI's response with actual course data
   */
  static matchAISuggestionsWithCourses(aiSuggestions, courses) {
    if (!aiSuggestions || !Array.isArray(aiSuggestions)) {
      return [];
    }

    return aiSuggestions
      .map(suggestion => {
        const course = courses.find(c => c.id === suggestion.courseId);
        if (!course) return null;
        
        return {
          ...course,
          relevanceScore: suggestion.relevanceScore || 0,
          reasoning: suggestion.reasoning || '',
          matchDetails: suggestion.matchDetails || {}
        };
      })
      .filter(Boolean) // Remove any null entries
      .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0)); // Sort by relevance
  }
}

module.exports = AIController;

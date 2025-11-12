// file: src/mappers/quiz.mapper.js

/**
 * Chuyển đổi đối tượng QuestionOption từ DB sang DTO (che giấu đáp án).
 */
function toQuestionOptionResponse(option) {
  return {
    id: option.id,
    content: option.content,
    // QUAN TRỌNG: Không trả về trường 'isCorrect'
  };
}

/**
 * Chuyển đổi đối tượng Question từ DB sang DTO.
 */
function toQuestionResponse(question) {
  // ✨ FIX: Extract question text from JSONB content
  // question.content can be:
  // 1. JSONB object: { "question": "text", "options": [...], "correctAnswer": 0 }
  // 2. String: "question text"
  // 3. Null/undefined
  let questionText = question.text; // Default to text field
  let optionsArray = [];
  
  if (question.content && typeof question.content === 'object') {
    // Extract question text
    if (question.content.question) {
      questionText = question.content.question;
    }
    
    // Extract options from JSONB content.options (for imported questions from exam-service)
    if (Array.isArray(question.content.options)) {
      optionsArray = question.content.options.map((optionText, index) => ({
        id: `${question.id}-opt-${index}`, // Generate ID từ question ID + index
        content: optionText,
      }));
    }
  } else if (question.content && typeof question.content === 'string') {
    // Case 2: Already a string
    questionText = question.content;
  }
  
  // Fallback: Use question.options association if content.options not available
  if (optionsArray.length === 0 && question.options && question.options.length > 0) {
    optionsArray = question.options.map(toQuestionOptionResponse);
  }
  
  return {
    id: question.id,
    content: questionText, // ✨ Use extracted question text (NOT the whole JSONB object)
    type: question.type,
    displayOrder: question.ExamQuestion?.displayOrder || 0, // Get displayOrder from join table
    options: optionsArray,
  };
}

/**
 * Chuyển đổi đối tượng Quiz từ DB sang DTO chi tiết cho sinh viên.
 */
function toQuizDetailResponse(quiz) {
  return {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    timeLimitMinutes: quiz.timeLimitMinutes,
    questions: quiz.questions ? quiz.questions.map(toQuestionResponse) : [],
  };
}

module.exports = {
  toQuizDetailResponse,
};
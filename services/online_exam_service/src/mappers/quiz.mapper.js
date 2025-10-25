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
  return {
    id: question.id,
    content: question.content,
    type: question.type,
    displayOrder: question.displayOrder,
    options: question.options ? question.options.map(toQuestionOptionResponse) : [],
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
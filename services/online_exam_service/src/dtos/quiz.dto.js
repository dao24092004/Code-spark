 // file: src/dtos/quiz.dto.js

const Joi = require('joi');

// Định nghĩa khuôn mẫu cho dữ liệu khi sinh viên nộp bài
const submitQuizSchema = Joi.object({
  // 'answers' phải là một mảng và là bắt buộc
  answers: Joi.array().items(
    // Mỗi phần tử trong mảng phải là một object
    Joi.object({
      // 'questionId' phải là một chuỗi UUID và là bắt buộc
      questionId: Joi.string().uuid().required(),
      // 'selectedOptionId' phải là một chuỗi UUID và là bắt buộc
      selectedOptionId: Joi.string().uuid().required()
    })
  ).required()
});

module.exports = {
  submitQuizSchema,
};

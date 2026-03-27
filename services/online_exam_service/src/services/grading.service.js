// file: src/services/grading.service.js

const db = require('../models');

/**
 * Chấm điểm tự động cho một bài làm đã nộp.
 * exam_db: answers được lưu vào bảng answers (submitQuiz tạo trước).
 * gradingService đọc từ bảng answers, so với đáp án đúng trong question_options hoặc JSONB content.
 * @param {string} submissionId - ID của bài làm.
 * @returns {Promise<{score, scoreRaw, correctAnswers, wrongAnswers, totalQuestions}>}
 */
async function autoGrade(submissionId) {
  // 1. Lấy submission
  const submission = await db.QuizSubmission.findByPk(submissionId);
  if (!submission) throw new Error('Không tìm thấy bài làm.');

  // 2. Lấy quiz với questions và options
  const quiz = await db.Quiz.findByPk(submission.quizId, {
    include: {
      model: db.Question,
      as: 'questions',
      include: {
        model: db.QuestionOption,
        as: 'options'
      }
    }
  });

  // 3. Lấy câu trả lời sinh viên từ bảng answers (exam_db)
  const studentAnswerRecords = await db.Answer.findAll({
    where: { submissionId }
  });

  let correctAnswers = 0;
  let wrongAnswers = 0;
  let totalScore = 0;
  const totalQuestions = quiz.questions.length;

  // 4. Với mỗi câu trả, so sánh với đáp án đúng
  for (const record of studentAnswerRecords) {
    const question = quiz.questions.find(q => q.id === record.questionId);
    if (!question) continue;

    let isCorrect = false;
    let maxScore = 1;

    // Đáp án đúng từ JSONB content (exam-service import)
    if (question.content && typeof question.content === 'object') {
      if (question.content.correctAnswer !== undefined && Array.isArray(question.content.options)) {
        const correctIndex = question.content.correctAnswer;
        const correctOptionId = `${question.id}-opt-${correctIndex}`;
        isCorrect = record.selectedAnswer === correctOptionId;
      }
    }

    // Fallback: đáp án đúng từ question_options table
    if (!isCorrect && question.options && question.options.length > 0) {
      const correctOption = question.options.find(opt => opt.isCorrect === true);
      if (correctOption) {
        isCorrect = record.selectedAnswer === correctOption.id;
      }
    }

    // Cập nhật Answer record trong exam_db
    record.isCorrect = isCorrect;
    record.score = isCorrect ? 1 : 0;
    await record.save();

    if (isCorrect) {
      correctAnswers++;
      totalScore++;
    } else {
      wrongAnswers++;
    }
  }

  // 5. Tính điểm phần trăm
  const rawPercentage = totalQuestions > 0
    ? Number(((totalScore / totalQuestions) * 100).toFixed(2))
    : 0;
  const scorePercentage = Math.round(rawPercentage);

  // 6. Cập nhật điểm vào quiz_submissions (exam_db)
  submission.score = scorePercentage;
  await submission.save();

  return {
    score: scorePercentage,
    scoreRaw: rawPercentage,
    correctAnswers,
    wrongAnswers,
    totalQuestions
  };
}

/**
 * Chấm điểm thủ công một câu trả lời (essay) bởi giảng viên.
 */
async function manualGrade(answerId, score, comment) {
  try {
    const answer = await db.Answer.findByPk(answerId);
    if (!answer) {
      throw new Error('Không tìm thấy câu trả lời này.');
    }

    answer.score = score;
    answer.instructorComment = comment;
    // isCorrect dựa trên score > 0
    answer.isCorrect = score > 0;
    await answer.save();

    // Tính lại tổng điểm submission
    const submission = await db.QuizSubmission.findByPk(answer.submissionId);
    const allAnswers = await db.Answer.findAll({ where: { submissionId: submission.id } });

    let totalScore = 0;
    for (const ans of allAnswers) {
      if (ans.score != null) {
        totalScore += parseFloat(ans.score);
      }
    }

    submission.score = totalScore;
    await submission.save();

    return submission;
  } catch (error) {
    console.error('Lỗi chấm điểm thủ công:', error);
    throw error;
  }
}

module.exports = {
  autoGrade,
  manualGrade,
};

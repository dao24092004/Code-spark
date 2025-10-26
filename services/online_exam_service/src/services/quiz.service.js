// file: src/services/quiz.service.js

const db = require('../models');
const gradingService = require('./grading.service');
const proctoringIntegrationService = require('./proctoring.integration');
const blockchainService = require('./blockchain.service');

/**
 * Xử lý logic khi sinh viên bắt đầu làm bài.
 */
async function startQuiz(userId, quizId) {
  // <<< BỔ SUNG 1: Kiểm tra xem bài quiz có tồn tại không >>>
  const quiz = await db.Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  // <<< BỔ SUNG 2: Kiểm tra xem sinh viên đã bắt đầu bài thi này chưa >>>
  const existingSubmission = await db.QuizSubmission.findOne({
    where: {
      studentId: userId,
      quizId: quizId,
    }
  });

  if (existingSubmission) {
    throw new Error('Bạn đã bắt đầu bài thi này rồi và chưa hoàn thành.');
  }

  // 1. Tạo bản ghi bài làm trong DB
  const newSubmission = await db.QuizSubmission.create({
    studentId: userId,
    quizId: quizId,
  });

  // 2. (Tích hợp) Gọi đến proctoring service để bắt đầu giám sát
  try {
    await proctoringIntegrationService.startMonitoringSession(userId, newSubmission.id);
  } catch (proctoringError) {
    // Nếu không thể bắt đầu giám sát, có thể cần xử lý (ví dụ: không cho phép thi)
    console.error('Lỗi nghiêm trọng: Không thể khởi động dịch vụ giám sát.', proctoringError);
    throw new Error('Không thể khởi động dịch vụ giám sát.');
  }

  // 3. Lấy câu hỏi để trả về cho Frontend
  // <<< BỔ SUNG 3: Lấy đầy đủ cả câu hỏi và lựa chọn để mapper xử lý >>>
  const quizWithDetails = await db.Quiz.findByPk(quizId, {
    include: {
      model: db.Question,
      as: 'questions',
      include: {
        model: db.QuestionOption,
        as: 'options',
      },
    },
    order: [
      [{ model: db.Question, as: 'questions' }, 'displayOrder', 'ASC'],
    ],
  });
  
  return {
    submissionId: newSubmission.id,
    quizDetails: quizWithDetails, // Trả về dữ liệu đầy đủ, controller/mapper sẽ lọc sau
  };
}

/**
 * Xử lý logic khi sinh viên nộp bài.
 */
async function submitQuiz(submissionId, answers) {
  // 1. Tìm bài làm và kiểm tra trạng thái
  const submission = await db.QuizSubmission.findByPk(submissionId);

  // <<< BỔ SUNG 4: Kiểm tra xem bài làm có tồn tại và đã nộp chưa >>>
  if (!submission) {
    throw new Error(`Không tìm thấy bài làm với ID: ${submissionId}`);
  }
  if (submission.status === 'submitted') {
    throw new Error('Bài thi này đã được nộp trước đó.');
  }

  // 2. Cập nhật câu trả lời, thời gian và trạng thái
  submission.answers = JSON.stringify(answers);
  submission.submittedAt = new Date();
  submission.status = 'submitted'; // Chuyển trạng thái
  await submission.save();

  // 3. (Gọi service con) Bắt đầu chấm điểm tự động
  const finalScore = await gradingService.autoGrade(submissionId);

  // 4. (Gọi service con) Ghi điểm cuối cùng lên Blockchain
  await blockchainService.recordFinalGrade(submissionId, parseInt(submission.studentId), finalScore);   
  return {
    submissionId: submissionId,
    score: finalScore,
    message: "Nộp bài và chấm điểm thành công!",
  };
}

module.exports = {
  startQuiz,
  submitQuiz,
};
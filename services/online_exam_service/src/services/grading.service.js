 // file: src/services/grading.service.js

const db = require('../models'); // Import các model

/**
 * Chấm điểm tự động cho một bài làm đã nộp.
 * @param {string} submissionId - ID của bài làm.
 * @returns {Promise<number>} - Điểm số cuối cùng.
 */
async function autoGrade(submissionId) {
  try {
    // 1. Lấy thông tin bài làm và các câu hỏi liên quan
    const submission = await db.QuizSubmission.findByPk(submissionId);
    if (!submission) throw new Error('Không tìm thấy bài làm.');

    const quiz = await db.Quiz.findByPk(submission.quizId, {
      include: {
        model: db.Question,
        as: 'questions', // Giả sử bạn định nghĩa mối quan hệ này trong models/index.js
        include: {
          model: db.QuestionOption,
          as: 'options'
        }
      }
    });

    // 2. Tạo một "answer key" - bản đồ đáp án đúng
    const answerKey = {};
    quiz.questions.forEach(question => {
      // ✨ FIX: Extract correctAnswer from JSONB content (for exam-service imports)
      if (question.content && typeof question.content === 'object') {
        if (question.content.correctAnswer !== undefined && Array.isArray(question.content.options)) {
          // Convert correctAnswer index to option ID format
          const correctIndex = question.content.correctAnswer;
          answerKey[question.id] = `${question.id}-opt-${correctIndex}`;
        }
      }
      
      // Fallback: Use options association (for native question_options)
      if (!answerKey[question.id]) {
        const correctOption = question.options.find(opt => opt.isCorrect === true);
        if (correctOption) {
          answerKey[question.id] = correctOption.id;
        }
      }
    });

    // 3. Lấy câu trả lời của sinh viên (giả sử lưu dạng JSON)
    const studentAnswers = JSON.parse(submission.answers); // Ví dụ: [{ questionId: '...', selectedOptionId: '...' }]
    
    let totalScore = 0;
    
    // 4. So sánh và tính điểm
    let correctAnswers = 0;
    let wrongAnswers = 0;
    const totalQuestions = quiz.questions.length;
    
    studentAnswers.forEach(answer => {
      const correctOptionId = answerKey[answer.questionId];
      const studentOptionId = answer.selectedOptionId;
      const isCorrect = correctOptionId && correctOptionId === studentOptionId;
      
      if (isCorrect) {
        totalScore += 1; // Giả sử mỗi câu đúng được 1 điểm
        correctAnswers++;
      } else {
        wrongAnswers++;
      }
    });

    // 5. Cập nhật điểm vào database (tính phần trăm)
    const rawPercentage = totalQuestions > 0 ? Number(((totalScore / totalQuestions) * 100).toFixed(2)) : 0;
    const scorePercentage = Math.round(rawPercentage);
    submission.score = scorePercentage;
    await submission.save();
    
    return {
      score: scorePercentage,
      scoreRaw: rawPercentage,
      correctAnswers,
      wrongAnswers,
      totalQuestions
    };

  } catch (error) {
    console.error('❌ Lỗi trong quá trình chấm điểm:', error);
    throw new Error('Quá trình chấm điểm tự động thất bại.');
  }
}
async function manualGrade(answerId, score, comment) {
  // Bọc toàn bộ logic trong try...catch để xử lý lỗi
  try {
    // === BƯỚC 1: CẬP NHẬT ĐIỂM CHO CÂU TRẢ LỜI RIÊNG LẺ ===
    
    // 1.1. Tìm chính xác câu trả lời mà giảng viên đang chấm trong bảng `cm_answers`
    const answer = await db.Answer.findByPk(answerId);
    if (!answer) {
      throw new Error('Không tìm thấy câu trả lời này.');
    }

    // 1.2. Cập nhật điểm và nhận xét do giảng viên cung cấp
    answer.score = score;
    answer.instructorComment = comment;
    await answer.save(); // Lưu thay đổi vào DB

    // === BƯỚC 2: TÍNH TOÁN LẠI TỔNG ĐIỂM CHO CẢ BÀI LÀM ===

    // 2.1. Tìm bài làm (submission) cha của câu trả lời này
    const submission = await db.QuizSubmission.findByPk(answer.submissionId);
    
    // 2.2. Lấy TẤT CẢ các câu trả lời khác thuộc cùng bài làm đó
    const allAnswers = await db.Answer.findAll({ where: { submissionId: submission.id } });

    // 2.3. Tính lại tổng điểm từ đầu
    let totalScore = 0;
    for (const ans of allAnswers) {
      // Cộng dồn điểm của tất cả các câu đã được chấm (cả tự động và thủ công)
      if (ans.score != null) {
        totalScore += parseFloat(ans.score);
      }
    }

    // === BƯỚC 3: CẬP NHẬT TỔNG ĐIỂM VÀ GHI NHẬN BLOCKCHAIN ===

    // 3.1. Cập nhật tổng điểm mới vào bảng `cm_quiz_submissions`
    submission.score = totalScore;
    await submission.save();

    // 3.2. Gọi service blockchain để ghi nhận điểm số cuối cùng này
    await blockchainService.recordFinalGrade(
      submission.id,
      submission.studentId,
      totalScore
    );
    
    // Trả về bài làm đã được cập nhật
    return submission;
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình chấm điểm thủ công:', error);
    throw new Error('Quá trình chấm điểm thủ công thất bại.');
  }
}

module.exports = {
  autoGrade,
  manualGrade,
};

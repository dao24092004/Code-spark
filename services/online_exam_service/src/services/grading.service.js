 // file: src/services/grading.service.js

const db = require('../models'); // Import các model

/**
 * Chấm điểm tự động cho một bài làm đã nộp.
 * @param {string} submissionId - ID của bài làm.
 * @returns {Promise<number>} - Điểm số cuối cùng.
 */
async function autoGrade(submissionId) {
  console.log(`[Grading] Bắt đầu chấm điểm tự động cho submission ${submissionId}...`);
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
      const correctOption = question.options.find(opt => opt.isCorrect === true);
      if (correctOption) {
        answerKey[question.id] = correctOption.id; // Lưu ID của đáp án đúng
      }
    });

    // 3. Lấy câu trả lời của sinh viên (giả sử lưu dạng JSON)
    const studentAnswers = JSON.parse(submission.answers); // Ví dụ: [{ questionId: '...', selectedOptionId: '...' }]
    
    let totalScore = 0;
    
    // 4. So sánh và tính điểm
    studentAnswers.forEach(answer => {
      if (answerKey[answer.questionId] && answerKey[answer.questionId] === answer.selectedOptionId) {
        totalScore += 1; // Giả sử mỗi câu đúng được 1 điểm
      }
    });

    // 5. Cập nhật điểm vào database
    submission.score = totalScore;
    await submission.save();

    console.log(`[Grading] Chấm điểm thành công. Điểm số: ${totalScore}`);
    return totalScore;

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

    console.log(`[Grading] Chấm điểm thủ công thành công. Tổng điểm mới: ${totalScore}. Đã ghi nhận Blockchain.`);
    
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

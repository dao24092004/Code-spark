// file: src/controllers/student.quiz.controller.js

// Import "bộ não" chính từ lớp service
const quizService = require('../services/quiz.service');

/**
 * Controller xử lý yêu cầu bắt đầu bài thi.
 */
async function startQuiz(req, res) {
  try {
    // Lấy quizId từ URL (ví dụ: /api/quizzes/abc-123/start)
    const { quizId } = req.params;
    const userId = req.user.id; // Lấy userId từ token JWT đã được xác thực

    // Gọi đến service để xử lý logic
    const result = await quizService.startQuiz(userId, quizId);

    // Trả về kết quả thành công cho Frontend
    res.status(200).json({
      success: true,
      message: "Bắt đầu bài thi thành công.",
      data: result,
    });
  } catch (error) {
    // <<< PHẦN CẢI THIỆN NẰM Ở ĐÂY >>>
    // Kiểm tra nội dung của thông báo lỗi từ service
    if (error.message.includes('Bạn đã bắt đầu bài thi này rồi')) {
      // Nếu là lỗi nghiệp vụ đã biết, trả về 409 Conflict
      return res.status(409).json({ success: false, message: error.message });
    }

    // Đối với các lỗi không mong muốn khác, mới trả về 500
    console.error("Lỗi không xác định trong startQuiz controller:", error);
    res.status(500).json({ success: false, message: 'An unexpected error occurred on the server.' });
  }
}

/**
 * Controller xử lý yêu cầu nộp bài.
 */
async function submitQuiz(req, res) {
  try {
    // Lấy submissionId từ URL
    const { submissionId } = req.params;
    // Lấy mảng câu trả lời từ body của request
    const answers = req.body.answers;

    // Gọi đến service để xử lý logic
    const result = await quizService.submitQuiz(submissionId, answers);

    // Trả về kết quả thành công
    res.status(200).json({
      success: true,
      message: "Nộp bài thành công.",
      data: result,
    });
  } catch (error) {
    console.error("Lỗi trong submitQuiz controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  startQuiz,
  submitQuiz,
};
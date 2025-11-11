// file: src/controllers/student.quiz.controller.js

// Import "bộ não" chính từ lớp service
const quizService = require('../services/quiz.service');
const { toQuizDetailResponse } = require('../mappers/quiz.mapper');

/**
 * Controller xử lý yêu cầu bắt đầu bài thi.
 */
async function startQuiz(req, res) {
  try {
    // Lấy quizId từ URL (ví dụ: /api/quizzes/abc-123/start)
    const { quizId } = req.params;
    // Lấy userId từ JWT token (đã được verify bởi auth middleware)
    const userId = req.userId || req.user?.userId || req.user?.sub || req.user?.id;

    // Validate userId
    if (!userId) {
      console.error('❌ userId is undefined. req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token. Please login again.'
      });
    }

    // Gọi đến service để xử lý logic
    const authHeader = req.headers['authorization'] || '';
    const result = await quizService.startQuiz(userId, quizId, authHeader);

    // Map quiz details để che giấu đáp án và format đúng
    const mappedQuizDetails = toQuizDetailResponse(result.quizDetails);

    // Trả về kết quả thành công cho Frontend
    res.status(200).json({
      success: true,
      message: "Bắt đầu bài thi thành công.",
      data: {
        submissionId: result.submissionId,
        ...mappedQuizDetails,
      },
    });
  } catch (error) {
    // <<< PHẦN CẢI THIỆN NẰM Ở ĐÂY >>>
    
    // Kiểm tra nếu bài thi đã hoàn thành (không cho làm lại)
    if (error.message.includes('đã hoàn thành bài thi này rồi')) {
      return res.status(400).json({ 
        success: false, 
        error: error.message,
        message: error.message
      });
    }
    
    // Kiểm tra nếu đã bắt đầu nhưng chưa hoàn thành (cho phép tiếp tục)
    if (error.message.includes('Bạn đã bắt đầu bài thi này rồi')) {
      // Map quiz details để che giấu đáp án
      const mappedQuizDetails = error.quizDetails ? toQuizDetailResponse(error.quizDetails) : null;
      
      // Nếu là lỗi nghiệp vụ đã biết, trả về 409 Conflict với submission ID và quiz details
      return res.status(409).json({ 
        success: false, 
        message: error.message,
        data: {
          submissionId: error.submissionId,
          ...(mappedQuizDetails || {}), // Spread quiz details (title, description, questions, etc.)
        }
      });
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

/**
 * Controller xử lý yêu cầu lấy tất cả quiz.
 */
async function getAllQuizzes(req, res) {
  try {
    const quizzes = await quizService.getAllQuizzes();
    
    res.status(200).json({
      success: true,
      data: quizzes,
    });
  } catch (error) {
    console.error("Lỗi trong getAllQuizzes controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Controller xử lý yêu cầu lấy chi tiết quiz (không tạo submission).
 */
async function getQuizDetails(req, res) {
  try {
    const { quizId } = req.params;
    const quizDetails = await quizService.getQuizDetails(quizId);
    
    // Map quiz details để che giấu đáp án và format đúng
    const mappedQuizDetails = toQuizDetailResponse(quizDetails);
    
    res.status(200).json({
      success: true,
      data: mappedQuizDetails,
    });
  } catch (error) {
    console.error("Lỗi trong getQuizDetails controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Controller xử lý yêu cầu lấy tất cả submissions của student.
 */
async function getMySubmissions(req, res) {
  try {
    // Lấy userId từ JWT token (đã được verify bởi auth middleware)
    const userId = req.userId || req.user?.userId || req.user?.sub || req.user?.id;
    
    // Validate userId
    if (!userId) {
      console.error('❌ userId is undefined. req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token. Please login again.'
      });
    }
    
    const submissions = await quizService.getStudentSubmissions(userId);
    
    res.status(200).json({
      success: true,
      data: submissions,
    });
  } catch (error) {
    console.error("Lỗi trong getMySubmissions controller:", error);
    res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * Controller xử lý yêu cầu lấy kết quả chi tiết của một submission.
 */
async function getSubmissionResult(req, res) {
  try {
    const { submissionId } = req.params;
    // Lấy userId từ JWT token (đã được verify bởi auth middleware)
    const userId = req.userId || req.user?.userId || req.user?.sub || req.user?.id;
    
    // Validate userId
    if (!userId) {
      console.error('❌ userId is undefined. req.user:', req.user);
      return res.status(401).json({
        success: false,
        message: 'User ID not found in token. Please login again.'
      });
    }
    
    const result = await quizService.getSubmissionResult(submissionId, userId);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy kết quả bài thi",
      });
    }
    
    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Lỗi trong getSubmissionResult controller:", error);
    
    // Handle specific errors
    if (error.message.includes('Không tìm thấy')) {
      return res.status(404).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    if (error.message.includes('chưa nộp bài')) {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  startQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizDetails,
  getMySubmissions,
  getSubmissionResult,
};
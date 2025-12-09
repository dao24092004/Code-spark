const aiService = require('../services/gemini/ai.service');

exports.consultCourses = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập nội dung tin nhắn."
      });
    }

    // Gọi service
    const answer = await aiService.chatConsult(message, history || []);

    return res.status(200).json({
      success: true,
      data: {
        role: "assistant",
        content: answer
      }
    });

  } catch (error) {
    console.error("Controller Error:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server nội bộ."
    });
  }
};
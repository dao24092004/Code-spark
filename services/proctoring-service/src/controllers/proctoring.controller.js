const proctoringService = require('../services/proctoring.service');

/**
 * Controller để lấy tất cả các sự kiện vi phạm của một phiên thi.
 * @param {object} req - Đối tượng request của Express.
 * @param {object} res - Đối tượng response của Express.
 */
async function getEventsBySession(req, res) {
  try {
    // Lấy sessionId từ URL, ví dụ: /api/sessions/abc-123/events
    const sessionId = req.params.sessionId;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }

    // Gọi hàm trong service mà chúng ta đã chuẩn bị sẵn từ Phần 3.
    // Service sẽ làm việc với database để lấy dữ liệu.
    const events = await proctoringService.getEventsBySession(sessionId);

    // Trả về dữ liệu cho client với status code 200 (OK)
    res.status(200).json(events);

  } catch (error) {
    console.error('Error in getEventsBySession controller:', error);
    // Nếu có lỗi, trả về status code 500 (Internal Server Error)
    res.status(500).json({ message: 'An error occurred while fetching proctoring events.' });
  }
}

async function startProctoringSession(req, res) {
  try {
    // Lấy userId và examId (chính là submissionId) từ body của request
    const { userId, examId } = req.body;
    if (!userId || !examId) {
      return res.status(400).json({ message: 'userId và examId là bắt buộc.' });
    }

    // Gọi đến service để tạo một bản ghi exam_session mới
    const newSession = await proctoringService.createSession({
      user_id: userId,
      exam_id: examId, // Lưu lại submissionId để liên kết
    });

    // Trả về response thành công với status 201 (Created)
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error in startProctoringSession controller:', error);
    res.status(500).json({ message: 'Lỗi khi tạo phiên giám sát.' });
  }
}
module.exports = {
  getEventsBySession,
  startProctoringSession,
};
// src/controllers/proctoring.controller.js
const proctoringService = require('../services/proctoring.service');

/**
 * Controller để lấy tất cả các sự kiện vi phạm của một phiên thi.
 */
async function getEventsBySession(req, res) {
  try {
    const sessionId = req.params.sessionId;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required.' });
    }
    const events = await proctoringService.getEventsBySession(sessionId);
    res.status(200).json(events);
  } catch (error) {
    console.error('Error in getEventsBySession controller:', error);
    res.status(500).json({ message: 'An error occurred while fetching proctoring events.' });
  }
}

/**
 * Controller để bắt đầu một phiên thi
 */
async function startProctoringSession(req, res) {
  try {
    const userId = req.user.id; // Lấy userId từ token JWT
    const { examId } = req.body;
   // Thành dòng này:
    if (!userId || !examId) {
      return res.status(400).json({ message: 'userId và examId là bắt buộc.' });
    }
    const newSession = await proctoringService.createSession({
      user_id: userId,
      exam_id: examId,
    });
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error in startProctoringSession controller:', error);
    res.status(500).json({ message: 'Lỗi khi tạo phiên giám sát.' });
  }
}

// <<< BỔ SUNG >>>
/**
 * Controller để lấy tất cả các phiên thi (sinh viên) đang hoạt động.
 */
async function getActiveSessions(req, res) {
  try {
    const sessions = await proctoringService.getActiveSessions();
    res.status(200).json(sessions);
  } catch (error) {
    console.error('Error in getActiveSessions controller:', error);
    res.status(500).json({ message: 'Lỗi khi lấy các phiên đang hoạt động.' });
  }
}

// <<< BỔ SUNG >>>
/**
 * Controller để lấy tất cả sinh viên đang thi trong một kỳ thi.
 */
async function getStudentsInExam(req, res) {
  try {
    const { examId } = req.params;
    if (!examId) {
      return res.status(400).json({ message: 'Exam ID is required.' });
    }
    const students = await proctoringService.getStudentsInExam(examId);
    res.status(200).json(students);
  } catch (error) {
    console.error('Error in getStudentsInExam controller:', error);
    res.status(500).json({ message: 'Lỗi khi lấy sinh viên.' });
  }
}

module.exports = {
  getEventsBySession,
  startProctoringSession,
  getActiveSessions,   // <<< BỔ SUNG >>>
  getStudentsInExam,  // <<< BỔ SUNG >>>
};
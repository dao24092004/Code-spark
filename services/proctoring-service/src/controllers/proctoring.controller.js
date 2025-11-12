// src/controllers/proctoring.controller.js
console.log('[CONTROLLER] Starting to load controller...');
const proctoringService = require('../services/proctoring.service');
const aiService = require('../services/ai.service');
console.log('[CONTROLLER] Service loaded:', typeof proctoringService);
console.log('[CONTROLLER] Service keys:', Object.keys(proctoringService || {}));

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
    const body = req.body || {};
    const userIdFromToken = req.user?.id ?? req.user?.userId ?? req.user?.user_id;
    const userIdFromBody = body.userId ?? body.user_id ?? body.studentId;
    const examId = body.examId ?? body.exam_id;

    let resolvedUserId = userIdFromToken ?? userIdFromBody;

    if (typeof resolvedUserId === 'string') {
      const parsed = Number(resolvedUserId);
      resolvedUserId = Number.isNaN(parsed) ? resolvedUserId : parsed;
    }

    if (!resolvedUserId || !examId) {
      console.warn('[PROCTORING CONTROLLER] Thiếu userId hoặc examId khi tạo session', {
        hasToken: !!userIdFromToken,
        hasBodyUserId: !!userIdFromBody,
        hasExamId: !!examId,
      });
      return res.status(400).json({ message: 'userId và examId là bắt buộc.' });
    }

    // Gọi đến service để tạo một bản ghi exam_session mới
    const newSession = await proctoringService.createSession({
      user_id: resolvedUserId,
      exam_id: examId,
    });

    // Trả về response thành công với status 201 (Created)
    res.status(201).json(newSession);
  } catch (error) {
    console.error('Error in startProctoringSession controller:', error);
    res.status(500).json({ message: 'Lỗi khi tạo phiên giám sát.' });
  }
}

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

/**
 * Controller để phân tích frame camera bằng AI
 * Frontend gửi: { image: string (base64), examId: string, studentId: string }
 * Trả về: { detections: Array<Detection> }
 */
async function analyzeFrame(req, res) {
  try {
    const { image, examId, studentId, sessionId } = req.body;
    
    if (!image) {
      return res.status(400).json({ message: 'Image is required.' });
    }

    // Gọi AI service để phân tích frame
    const aiEvents = await aiService.analyzeFrame(image);

    try {
      await proctoringService.saveDetectionsAsEvents({
        sessionId,
        examId,
        studentId,
        detections: aiEvents,
        screenshotBase64: image,
      });
    } catch (persistError) {
      console.error('[CONTROLLER] Không thể lưu sự kiện proctoring', persistError);
    }
    
    // Map AI service response sang format mà frontend mong đợi
    const detections = aiEvents.map(event => {
      // Map event_type từ AI service sang type mà frontend mong đợi
      let type = event.event_type;
      if (type === 'FACE_NOT_DETECTED') type = 'FACE_NOT_DETECTED';
      else if (type === 'MULTIPLE_FACES') type = 'MULTIPLE_FACES';
      else if (type === 'MOBILE_PHONE_DETECTED') type = 'MOBILE_PHONE_DETECTED';
      else if (type === 'CAMERA_TAMPERED') type = 'CAMERA_TAMPERED';
      else if (type === 'LOOKING_AWAY') type = 'LOOKING_AWAY';
      
      // Map severity
      let severity = event.severity;
      if (!severity || !['low', 'medium', 'high', 'critical'].includes(severity)) {
        // Default severity mapping
        if (event.event_type === 'FACE_NOT_DETECTED' || event.event_type === 'MULTIPLE_FACES') {
          severity = 'high';
        } else if (event.event_type === 'MOBILE_PHONE_DETECTED') {
          severity = 'critical';
        } else if (event.event_type === 'CAMERA_TAMPERED') {
          severity = 'high';
        } else {
          severity = 'medium';
        }
      }

      // Generate description based on event type
      const descriptions = {
        'FACE_NOT_DETECTED': 'Không phát hiện khuôn mặt',
        'MULTIPLE_FACES': 'Phát hiện nhiều người trong khung hình',
        'MOBILE_PHONE_DETECTED': 'Phát hiện điện thoại di động',
        'CAMERA_TAMPERED': 'Camera bị che khuất hoặc can thiệp',
        'LOOKING_AWAY': 'Thí sinh đang nhìn ra xa',
      };

      return {
        type: type,
        severity: severity,
        confidence: 90, // Default confidence, có thể lấy từ AI service nếu có
        timestamp: Date.now(),
        description: descriptions[event.event_type] || 'Phát hiện hành vi bất thường',
        metadata: event.metadata || {},
      };
    });

    // Trả về response theo format mà frontend mong đợi
    res.status(200).json({ detections });
  } catch (error) {
    console.error('Error in analyzeFrame controller:', error);
    // Trả về empty detections thay vì lỗi để frontend không bị crash
    res.status(200).json({ detections: [] });
  }
}

// Debug: Kiểm tra các function có được define đúng không
console.log('[CONTROLLER DEBUG] startProctoringSession type:', typeof startProctoringSession);
console.log('[CONTROLLER DEBUG] getEventsBySession type:', typeof getEventsBySession);
console.log('[CONTROLLER DEBUG] analyzeFrame type:', typeof analyzeFrame);
console.log('[CONTROLLER DEBUG] Exports keys:', Object.keys({
  getEventsBySession,
  startProctoringSession,
  getActiveSessions,
  getStudentsInExam,
  analyzeFrame,
}));

module.exports = {
  getEventsBySession,
  startProctoringSession,
  getActiveSessions,
  getStudentsInExam,
  analyzeFrame,
};

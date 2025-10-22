// file: proctoring-service/src/services/proctoring.service.js

const db = require('../models');
console.log('[DEBUG MODELS in proctoring.service]', Object.keys(db));

const aiService = require('./ai.service');
const blockchainService = require('./blockchain.service');

const SEVERE_VIOLATIONS = ['MOBILE_PHONE_DETECTED', 'MULTIPLE_FACES', 'FACE_NOT_DETECTED'];

/**
 * ✅ Tạo một phiên giám sát mới (exam session)
 */
async function createSession({ user_id, exam_id }) {
  try {
    const newSession = await db.ExamSession.create({
      userId: user_id,
      examId: exam_id,
      startTime: new Date(), // ✅ phải là startTime (đúng theo model)
      status: 'in_progress',      // hoặc giữ 'in_progress' nếu bạn muốn mặc định
    });

    console.log(`[ProctoringService] Đã tạo phiên giám sát mới:`, newSession.id);
    return newSession;
  } catch (error) {
    console.error('❌ Lỗi khi tạo phiên giám sát:', error);
    throw error;
  }
}


/**
 * Nhận dữ liệu giám sát từ AI
 */
async function handleProctoringData(sessionId, imageBuffer) {
  const violations = await aiService.analyzeFrame(imageBuffer);
  if (!violations || violations.length === 0) return;

  console.log(`[Service] Phát hiện ${violations.length} vi phạm cho phiên thi ${sessionId}.`);

  for (const violation of violations) {
    const eventData = {
      sessionId,
      studentId: 'student-001',
      eventType: violation.event_type,
      severity: violation.severity,
      metadata: violation.metadata,
    };

    try {
      const newEvent = await db.ProctoringEvent.create(eventData);
      console.log(`[Database] Đã lưu vi phạm '${eventData.eventType}' vào DB, ID:`, newEvent.id);

      if (SEVERE_VIOLATIONS.includes(eventData.eventType)) {
        console.log(`[Blockchain] Vi phạm nghiêm trọng [${eventData.eventType}], đang chuẩn bị ghi...`);
        const blockchainData = {
          sessionId: eventData.sessionId,
          studentId: eventData.studentId,
          violationType: eventData.eventType,
          transactionHash: newEvent.id.toString(),
        };
        // await blockchainService.recordViolation(blockchainData);
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý vi phạm '${eventData.eventType}':`, error);
    }
  }
}

/**
 * Lấy danh sách các sự kiện vi phạm của một phiên thi
 */
async function getEventsBySession(sessionId) {
  try {
    const events = await db.ProctoringEvent.findAll({
      where: { sessionId },
      order: [['timestamp', 'ASC']],
    });
    return events;
  } catch (error) {
    console.error(`Lỗi khi lấy sự kiện cho phiên thi ${sessionId}:`, error);
    return [];
  }
}

module.exports = {
  createSession,
  handleProctoringData,
  getEventsBySession,
};

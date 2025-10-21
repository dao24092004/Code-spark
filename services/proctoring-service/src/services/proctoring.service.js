// file: src/services/proctoring.service.js

const db = require('../models');
const aiService = require('./ai.service');
const blockchainService = require('./blockchain.service');

// Các loại vi phạm nghiêm trọng cần ghi lên blockchain
const SEVERE_VIOLATIONS = ['MOBILE_PHONE_DETECTED', 'MULTIPLE_FACES', 'FACE_NOT_DETECTED'];

/**
 * Xử lý dữ liệu giám sát nhận được.
 */
async function handleProctoringData(sessionId, imageBuffer) {
  const violations = await aiService.analyzeFrame(imageBuffer);

  if (!violations || violations.length === 0) {
    return; 
  }

  console.log(`[Service] Phát hiện ${violations.length} vi phạm cho phiên thi ${sessionId}.`);

  for (const violation of violations) {
    const eventData = {
      sessionId: sessionId,
      studentId: 'student-001', // Tạm thời hardcode để test
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
 * Lấy tất cả các sự kiện vi phạm của một phiên thi.
 */
async function getEventsBySession(sessionId) {
  try {
    const events = await db.ProctoringEvent.findAll({
      // === PHẦN ĐÃ SỬA LỖI ===
      // Sử dụng thuộc tính 'sessionId' (camelCase) đã định nghĩa trong model.
      // Sequelize sẽ tự động chuyển nó thành 'session_id' (snake_case) khi truy vấn DB
      // nhờ vào tùy chọn 'field: 'session_id'' trong file model.
      where: { sessionId: sessionId }, 
      order: [['timestamp', 'ASC']],
    });
    return events;
  } catch (error) {
    console.error(`Lỗi khi lấy sự kiện cho phiên thi ${sessionId}:`, error);
    return [];
  }
}

module.exports = {
  handleProctoringData,
  getEventsBySession,
};
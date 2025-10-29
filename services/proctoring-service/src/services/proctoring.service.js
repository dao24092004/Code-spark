// src/services/proctoring.service.js

const db = require('../models');
console.log('[DEBUG MODELS in proctoring.service]', Object.keys(db));

console.log('[DEBUG MODELS in proctoring.service]', Object.keys(db));

const aiService = require('./ai.service');
const blockchainService = require('./blockchain.service');

// <<< BỎ DÒNG REQUIRE Ở ĐÂY ĐỂ TRÁNH LỖI VÒNG LẶP >>>
// const { getIO } = require('../config/websocket'); 

const SEVERE_VIOLATIONS = ['MOBILE_PHONE_DETECTED', 'MULTIPLE_FACES', 'FACE_NOT_DETECTED'];

// <<< BỔ SUNG (CHO YÊU CẦU MỚI) >>>
// Chỉ định nghĩa các event_type từ AI mà bạn MUỐN LƯU VÀO DB
const VIOLATIONS_TO_SAVE = [
  'MOBILE_PHONE_DETECTED',
  'MULTIPLE_FACES',
  'FACE_NOT_DETECTED',
  'LOOKING_AWAY', // << Thêm các vi phạm khác của bạn ở đây
  'TALKING'       // << (ví dụ)
  // AI có thể trả về 'FACE_OKAY' nhưng chúng ta không thêm nó vào đây
];


/**
 * ✅ Tạo một phiên giám sát mới (exam session)
 */
async function createSession({ user_id, exam_id }) {
  // ... (Code này của bạn đã đúng, giữ nguyên)
  try {
    const newSession = await db.ExamSession.create({
      userId: user_id,
      examId: exam_id,
      startTime: new Date(), 
      status: 'in_progress',
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
async function handleProctoringData(sessionId, studentId, imageBuffer) {
  // <<< SỬA LỖI (Phần 1): Di chuyển require vào đây >>>
  const { getIO } = require('../config/websocket');

  const violations = await aiService.analyzeFrame(imageBuffer);
  if (!violations || violations.length === 0) return;

  const session = await db.ExamSession.findByPk(sessionId);
  if (!session) {
      console.error(`Không tìm thấy session với ID: ${sessionId}`);
      return;
  }
  const examId = session.examId;

  // <<< SỬA ĐỔI (Phần 2): Lọc vi phạm trước khi lưu >>>
  const filteredViolations = violations.filter(v => 
    VIOLATIONS_TO_SAVE.includes(v.event_type)
  );

  if (filteredViolations.length === 0) {
    // AI có trả về sự kiện, nhưng không phải lỗi vi phạm cần lưu
    return;
  }
  
  console.log(`[Service] Phát hiện ${filteredViolations.length} vi phạm CẦN LƯU cho SV ${studentId}.`);

  // Chỉ lặp qua các vi phạm đã lọc
  for (const violation of filteredViolations) {
    const eventData = {
      sessionId: sessionId,
      studentId: studentId, 
      eventType: violation.event_type,
      severity: violation.severity,
      metadata: violation.metadata,
      timestamp: new Date()
    };

    try {
      // 1. Lưu vào DB (Đã lọc)
      const newEvent = await db.ProctoringEvent.create(eventData);
      console.log(`[Database] Đã lưu vi phạm '${eventData.eventType}' vào DB, ID:`, newEvent.id);

      // 2. Gửi cảnh báo real-time
      const io = getIO();
      io.to(examId).emit('proctoring_alert', newEvent);
      
      // 3. (Tùy chọn) Ghi Blockchain
      if (SEVERE_VIOLATIONS.includes(eventData.eventType)) {
        console.log(`[Blockchain] Vi phạm nghiêm trọng [${eventData.eventType}], đang chuẩn bị ghi...`);
        // await blockchainService.recordViolation(...);
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý vi phạm '${eventData.eventType}':`, error);
    }
  }
}

/**
 * Lấy danh sách các sự kiện vi phạm của một phiên thi
 * Lấy danh sách các sự kiện vi phạm của một phiên thi
 */
async function getEventsBySession(sessionId) {
  // ... (Code này của bạn đã đúng, giữ nguyên)
  try {
    const events = await db.ProctoringEvent.findAll({
      where: { sessionId },
      where: { sessionId },
      order: [['timestamp', 'ASC']],
    });
    return events;
  } catch (error) {
    console.error(`Lỗi khi lấy sự kiện cho phiên thi ${sessionId}:`, error);
    return [];
  }
}

/**
 * Lấy tất cả các phiên thi (của sinh viên) đang hoạt động
 */
async function getActiveSessions() {
  // ... (Code này của bạn đã đúng, giữ nguyên)
  try {
    const sessions = await db.ExamSession.findAll({
      where: { status: 'in_progress' },
    });
    return sessions;
  } catch (error) {
    console.error(`Lỗi khi lấy các phiên đang hoạt động:`, error);
    return [];
  }
}

/**
 * Lấy tất cả các sinh viên (ExamSession) đang thi trong một kỳ thi (examId)
 */
async function getStudentsInExam(examId) {
  // ... (Code này của bạn đã đúng, giữ nguyên)
  try {
    const students = await db.ExamSession.findAll({
      where: { 
        examId: examId,
        status: 'in_progress' 
      },
    });
    return students;
  } catch (error) {
    console.error(`Lỗi khi lấy sinh viên cho kỳ thi ${examId}:`, error);
    return [];
  }
}

module.exports = {
  createSession,
  createSession,
  handleProctoringData,
  getEventsBySession,
  getActiveSessions,
  getStudentsInExam,
};

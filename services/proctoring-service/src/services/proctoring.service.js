// src/services/proctoring.service.js

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const db = require('../models');
console.log('[DEBUG MODELS in proctoring.service]', Object.keys(db));

const { Op } = db.Sequelize;

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


const SCREENSHOT_DIR = path.resolve(__dirname, '../../uploads/screenshots');
const STORAGE_PATH_PREFIX = '/uploads/screenshots';

const generateUuid = () => (typeof crypto.randomUUID === 'function'
  ? crypto.randomUUID()
  : crypto.randomBytes(16).toString('hex'));

async function persistScreenshotFile({ screenshotBase64, eventType }) {
  if (!screenshotBase64) {
    return null;
  }

  try {
    await fs.mkdir(SCREENSHOT_DIR, { recursive: true });

    let base64Payload = screenshotBase64.trim();
    let extension = 'jpg';

    const matches = base64Payload.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/);
    if (matches) {
      const mime = matches[1];
      const [, ext] = mime.split('/');
      if (ext) {
        extension = ext.replace(/^jpeg$/, 'jpg');
      }
      base64Payload = base64Payload.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');
    } else {
      base64Payload = base64Payload.replace(/^data:.*;base64,/, '');
    }

    const buffer = Buffer.from(base64Payload, 'base64');

    if (!buffer || buffer.length === 0) {
      console.warn('[ProctoringService] Buffer screenshot rỗng, bỏ qua lưu file');
      return null;
    }

    const safeEventType = (eventType || 'VIOLATION').toUpperCase();
    const timestamp = new Date().toISOString().replace(/[:.-]/g, '').replace('T', '').replace('Z', '');
    const fileName = `${safeEventType}_${timestamp}_${generateUuid()}.${extension}`;
    const absolutePath = path.join(SCREENSHOT_DIR, fileName);

    await fs.writeFile(absolutePath, buffer);

    const storagePath = path.posix.join(STORAGE_PATH_PREFIX, fileName);

    return {
      fileName,
      absolutePath,
      storagePath,
    };
  } catch (error) {
    console.error('[ProctoringService] Không thể lưu screenshot vi phạm', error);
    return null;
  }
}


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

async function ensureProctoringSession({ sessionId, examId, studentId }) {
  if (!sessionId && !examId) {
    console.warn('[ProctoringService] Không thể đảm bảo phiên giám sát vì thiếu sessionId và examId');
    return null;
  }

  let existingSession = null;

  if (sessionId) {
    existingSession = await db.ExamSession.findByPk(sessionId);
    if (existingSession) {
      return existingSession;
    }
  }

  if (examId && studentId) {
    const numericStudentId = Number(studentId);
    if (!Number.isNaN(numericStudentId)) {
      existingSession = await db.ExamSession.findOne({
        where: {
          examId,
          userId: numericStudentId,
        },
        order: [['startTime', 'DESC']],
      });

      if (existingSession) {
        return existingSession;
      }
    }
  }

  if (!examId || !studentId) {
    console.warn('[ProctoringService] Thiếu examId hoặc studentId để tạo phiên giám sát');
    return null;
  }

  const parsedStudentId = Number(studentId);

  if (Number.isNaN(parsedStudentId)) {
    console.warn('[ProctoringService] studentId không hợp lệ, không thể tạo phiên giám sát', { studentId });
    return null;
  }

  const payload = {
    examId,
    userId: parsedStudentId,
    startTime: new Date(),
    status: 'in_progress',
  };

  if (sessionId) {
    payload.id = sessionId;
  }

  try {
    const createdSession = await db.ExamSession.create(payload);
    console.log('[ProctoringService] Tạo mới exam session cho proctoring', createdSession.id);
    return createdSession;
  } catch (error) {
    console.error('[ProctoringService] Lỗi khi tạo exam session', error);
    return null;
  }
}

async function saveDetectionsAsEvents({ sessionId, examId, studentId, detections, screenshotBase64 }) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const session = await ensureProctoringSession({ sessionId, examId, studentId });

  if (!session) {
    console.warn('[ProctoringService] Không thể lưu sự kiện vì không tìm thấy hoặc tạo được session', {
      sessionId,
      examId,
      studentId,
    });
    return [];
  }

  const savedEvents = [];
  const baseTimestamp = new Date();

  for (const detection of detections) {
    const eventType = detection.event_type || detection.type;
    if (!eventType) {
      continue;
    }

    const severity = (detection.severity || 'medium').toLowerCase();

    const recentDuplicate = await db.ProctoringEvent.findOne({
      where: {
        sessionId: session.id,
        eventType,
        timestamp: {
          [Op.gt]: new Date(baseTimestamp.getTime() - 3000),
        },
      },
      order: [['timestamp', 'DESC']],
    });

    if (recentDuplicate) {
      continue;
    }

    let captureInfo = null;
    if (screenshotBase64) {
      captureInfo = await persistScreenshotFile({
        screenshotBase64,
        eventType,
      });
    }

    const metadataPayload = {
      ...(detection.metadata || {}),
      description: detection.description,
      confidence: detection.confidence,
      examId,
      studentId,
      source: detection.source || 'ai_service',
      screenshotCaptured: Boolean(captureInfo),
    };

    if (captureInfo) {
      metadataPayload.mediaCapturePath = captureInfo.storagePath;
    }

    try {
      const savedEvent = await db.ProctoringEvent.create({
        sessionId: session.id,
        eventType,
        severity,
        metadata: metadataPayload,
        timestamp: new Date(),
      });

      savedEvents.push(savedEvent);

      if (captureInfo) {
        try {
          await db.MediaCapture.create({
            eventId: savedEvent.id,
            captureType: 'screenshot',
            storagePath: captureInfo.storagePath,
          });
        } catch (mediaError) {
          console.error('[ProctoringService] Không thể tạo bản ghi media capture', {
            eventId: savedEvent.id,
            storagePath: captureInfo.storagePath,
            error: mediaError,
          });
        }
      }
    } catch (error) {
      console.error('[ProctoringService] Lỗi khi lưu sự kiện proctoring', {
        eventType,
        severity,
        sessionId: session.id,
        error,
      });
    }
  }

  return savedEvents;
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
  handleProctoringData,
  saveDetectionsAsEvents,
  getEventsBySession,
  getActiveSessions,
  getStudentsInExam,
};
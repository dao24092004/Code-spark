// src/services/proctoring.service.js
// Proctoring service sử dụng exam_db (proctoring_db đã gộp vào exam_db)

const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');

const db = require('../models');
console.log('[PROCTORING SERVICE] Models loaded:', Object.keys(db));

const { Op } = db.Sequelize;

const aiService = require('./ai.service');

// --- IMPORT KAFKA PRODUCER TẠI ĐÂY ---
// Đã thêm đuôi .js để Node.js phân giải chính xác nhất
const { sendNotification } = require('./notification.producer.js');

const ACTIVE_SESSION_TIMEOUT_MS = 2 * 60 * 1000; // 2 phút
const activeSessionHeartbeats = new Map();

function pruneInactiveSessions() {
  const now = Date.now();
  for (const [sessionId, lastActive] of activeSessionHeartbeats.entries()) {
    if (now - lastActive > ACTIVE_SESSION_TIMEOUT_MS) {
      activeSessionHeartbeats.delete(sessionId);
    }
  }
}

function markSessionHeartbeat(sessionId) {
  if (!sessionId) return;
  activeSessionHeartbeats.set(sessionId, Date.now());
}

const SEVERE_VIOLATIONS = ['MOBILE_PHONE_DETECTED', 'MULTIPLE_FACES', 'FACE_NOT_DETECTED'];

const VIOLATIONS_TO_SAVE = [
  'MOBILE_PHONE_DETECTED',
  'MULTIPLE_FACES',
  'FACE_NOT_DETECTED',
  'LOOKING_AWAY',
  'TALKING'
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
 * Chuyển đổi userId/examId sang UUID string
 * Hỗ trợ cả UUID, numeric string, và number
 */
function toUuid(value) {
  if (!value) return null;
  // Nếu đã là UUID string hợp lệ
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (typeof value === 'string' && uuidRegex.test(value)) {
    return value;
  }
  // Nếu là số hoặc numeric string, chuyển sang UUID (dùng 0000-0000-0000-0000 prefix)
  const num = Number(value);
  if (!Number.isNaN(num)) {
    // Tạo UUID từ số bằng cách padding
    const padded = num.toString().padStart(12, '0');
    return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-0000-0000-000000000000`;
  }
  return null;
}

/**
 * Tạo một phiên giám sát mới (exam session)
 * userId và examId: UUID string hoặc giá trị có thể chuyển đổi sang UUID
 */
async function createSession({ user_id, exam_id }) {
  try {
    const userUuid = toUuid(user_id);
    const examUuid = toUuid(exam_id);

    if (!userUuid || !examUuid) {
      throw new Error(`Invalid UUID: user_id=${user_id}, exam_id=${exam_id}`);
    }

    const newSession = await db.ExamSession.create({
      userId: userUuid,
      examId: examUuid,
      startTime: new Date(),
      status: 'ACTIVE',
      gracePeriodMinutes: 0,
      violationThresholdCount: 3,
      highSeverityViolationCount: 0,
    });
    console.log(`[ProctoringService] Đã tạo exam session mới:`, newSession.id);
    return newSession;
  } catch (error) {
    console.error('Lỗi khi tạo exam session:', error);
    throw error;
  }
}

/**
 * Nhận dữ liệu giám sát từ AI
 */
async function handleProctoringData(sessionId, studentId, imageBuffer) {
  const { getIO } = require('../config/websocket');

  const violations = await aiService.analyzeFrame(imageBuffer);
  if (!violations || violations.length === 0) return;

  const session = await db.ExamSession.findByPk(sessionId);
  if (!session) {
    console.error(`Không tìm thấy session với ID: ${sessionId}`);
    return;
  }

  const filteredViolations = violations.filter(v =>
    VIOLATIONS_TO_SAVE.includes(v.event_type)
  );

  if (filteredViolations.length === 0) {
    return;
  }

  console.log(`[Service] Phát hiện ${filteredViolations.length} vi phạm CẦN LƯU.`);

  for (const violation of filteredViolations) {
    // --- [SỬA ĐỔI ĐỂ KHỚP VỚI JAVA] ---
    const customData = {
      severity: violation.severity || 'MEDIUM',
      metadata: violation.metadata || {},
    };

    try {
      const newEvent = await db.ProctoringEvent.create({
        sessionId: sessionId,
        eventType: violation.event_type,
        eventData: JSON.stringify(customData), // Gộp hết vào chuỗi JSON
        timestamp: new Date() // Java bắt buộc có trường này
      });
      console.log(`[Database] Đã lưu vi phạm '${violation.event_type}' vào DB, ID:`, newEvent.id);

      const io = getIO();
      io.to(String(session.examId)).emit('proctoring_alert', newEvent);

      if (SEVERE_VIOLATIONS.includes(violation.event_type)) {
        console.log(`[Proctoring] Vi phạm nghiêm trọng [${violation.event_type}]`);
      }
    } catch (error) {
      console.error(`Lỗi khi xử lý vi phạm '${violation.event_type}':`, error);
    }
  }
}

/**
 * Đảm bảo proctoring session tồn tại
 */
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
    const examUuid = toUuid(examId);
    const studentUuid = toUuid(studentId);

    if (examUuid && studentUuid) {
      existingSession = await db.ExamSession.findOne({
        where: {
          examId: examUuid,
          userId: studentUuid,
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

  const examUuid = toUuid(examId);
  const studentUuid = toUuid(studentId);

  if (!examUuid || !studentUuid) {
    console.warn('[ProctoringService] examId hoặc studentId không hợp lệ', { examId, studentId });
    return null;
  }

  const payload = {
    examId: examUuid,
    userId: studentUuid,
    startTime: new Date(),
    status: 'ACTIVE',
    gracePeriodMinutes: 0,
    violationThresholdCount: 3,
    highSeverityViolationCount: 0,
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

/**
 * Emit session status update to admin clients
 */
async function emitSessionStatusUpdate(sessionId, examId, statusUpdate) {
  try {
    const { getIO } = require('../config/websocket');
    const io = getIO();

    if (io && examId) {
      const updatePayload = {
        sessionId,
        examId: String(examId),
        timestamp: new Date().toISOString(),
        ...statusUpdate
      };

      io.to(String(examId)).emit('session_status_update', updatePayload);
      console.log(`[ProctoringService] Đã emit session_status_update cho session ${sessionId}`);
    }
  } catch (error) {
    console.warn('[ProctoringService] Không thể emit session_status_update', error);
  }
}

async function recordSessionActivity({ sessionId, examId, studentId }) {
  const session = await ensureProctoringSession({ sessionId, examId, studentId });

  if (!session) {
    return null;
  }

  if (session.status !== 'ACTIVE') {
    activeSessionHeartbeats.delete(session.id);
    return session;
  }

  markSessionHeartbeat(session.id);

  await emitSessionStatusUpdate(sessionId, examId, {
    connectionStatus: 'online'
  });

  return session;
}

async function saveDetectionsAsEvents({ sessionId, examId, studentId, detections, screenshotBase64 }) {
  if (!detections || detections.length === 0) {
    return [];
  }

  const session = await recordSessionActivity({ sessionId, examId, studentId });

  if (!session) {
    console.warn('[ProctoringService] Không thể lưu sự kiện vì không tìm thấy hoặc tạo được session', {
      sessionId, examId, studentId,
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

    const severity = (detection.severity || 'MEDIUM').toUpperCase();

    const recentDuplicate = await db.ProctoringEvent.findOne({
      where: {
        sessionId: session.id,
        eventType,
        createdAt: {
          [Op.gt]: new Date(baseTimestamp.getTime() - 3000),
        },
      },
      order: [['createdAt', 'DESC']],
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

    // --- [SỬA ĐỔI ĐỂ KHỚP VỚI JAVA] ---
    const customData = {
      severity,
      ...metadataPayload
    };

    try {
      const savedEvent = await db.ProctoringEvent.create({
        sessionId: session.id,
        eventType,
        eventData: JSON.stringify(customData), // Gộp vào eventData
        timestamp: new Date() // Java bắt buộc có trường này
      });

      savedEvents.push(savedEvent);

      if (captureInfo) {
        try {
          await db.MediaCapture.create({
            sessionId: session.id,
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

      // ==========================================
      // BỔ SUNG: GỬI NOTIFICATION QUA KAFKA KHI CÓ VI PHẠM NGHIÊM TRỌNG (Cho Giám Thị)
      // ==========================================
      if (SEVERE_VIOLATIONS.includes(eventType)) {
        await sendNotification({
          recipientUserId: `PROCTORS_OF_EXAM_${examId}`, // Quy ước gửi broadcast cho giám thị
          title: "Hệ thống AI phát hiện gian lận",
          content: `Phát hiện vi phạm: ${eventType} từ sinh viên ID: ${studentId}`,
          type: "AI_ALERT",
          severity: severity.toLowerCase(),
          extraData: {
            examId: examId,
            sessionId: session.id,
            studentId: studentId,
            violationType: eventType,
            eventId: savedEvent.id,
            imageUrl: captureInfo ? captureInfo.storagePath : null // Truyền cả link ảnh nếu có
          }
        });
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

  if (savedEvents.length > 0) {
    const statusUpdate = {};

    const faceNotDetected = savedEvents.some(e => e.eventType === 'FACE_NOT_DETECTED' || e.eventType === 'CAMERA_TAMPERED');
    const multipleFaces = savedEvents.some(e => e.eventType === 'MULTIPLE_FACES');

    if (faceNotDetected) {
      statusUpdate.faceDetected = false;
      statusUpdate.cameraEnabled = false;
    } else if (multipleFaces) {
      statusUpdate.faceDetected = true;
      statusUpdate.faceCount = 2;
    } else {
      statusUpdate.faceDetected = true;
      statusUpdate.faceCount = 1;
    }

    await emitSessionStatusUpdate(sessionId, examId, statusUpdate);
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
      order: [['createdAt', 'ASC']],
    });
    return events;
  } catch (error) {
    console.error(`Lỗi khi lấy sự kiện cho phiên thi ${sessionId}:`, error);
    return [];
  }
}

/**
 * Lấy tất cả các phiên thi đang hoạt động
 */
async function getActiveSessions() {
  pruneInactiveSessions();

  const activeSessionIds = Array.from(activeSessionHeartbeats.entries())
    .filter(([, lastActive]) => Date.now() - lastActive <= ACTIVE_SESSION_TIMEOUT_MS)
    .map(([sessionId]) => sessionId);

  if (activeSessionIds.length === 0) {
    return [];
  }

  try {
    const sessions = await db.ExamSession.findAll({
      where: {
        id: activeSessionIds,
        status: 'ACTIVE',
      },
    });

    const sessionMap = new Map(sessions.map(session => [session.id, session]));

    return activeSessionIds
      .map(id => sessionMap.get(id))
      .filter(Boolean);
  } catch (error) {
    console.error(`Lỗi khi lấy các phiên đang hoạt động:`, error);
    return [];
  }
}

/**
 * Lấy tất cả các sinh viên đang thi trong một kỳ thi
 */
async function getStudentsInExam(examId) {
  try {
    const examUuid = toUuid(examId) || examId;
    const students = await db.ExamSession.findAll({
      where: {
        examId: examUuid,
        status: 'ACTIVE'
      },
    });
    return students;
  } catch (error) {
    console.error(`Lỗi khi lấy sinh viên cho kỳ thi ${examId}:`, error);
    return [];
  }
}

/**
 * Kết thúc phiên giám sát (terminated by admin)
 */
async function terminateSession(sessionId, { terminatedBy, reason } = {}) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const session = await db.ExamSession.findByPk(sessionId);
    if (!session) {
      return null;
    }

    session.status = 'TERMINATED';
    session.endTime = new Date();

    if (terminatedBy) {
      session.reviewerId = toUuid(terminatedBy) || terminatedBy;
    }

    if (reason) {
      session.reviewNotes = reason;
    }

    await session.save();
    activeSessionHeartbeats.delete(sessionId);

    try {
      const { getIO } = require('../config/websocket');
      const io = getIO();
      if (io && session.examId) {
        const terminatePayload = {
          sessionId,
          examId: String(session.examId),
          userId: String(session.userId),
          terminatedBy: terminatedBy ?? null,
          reason: reason ?? null,
        };
        io.to(String(session.examId)).emit('proctoring_session_terminated', terminatePayload);
        console.log(`[ProctoringService] Đã emit terminate event cho session ${sessionId}`);
      }
    } catch (notifyError) {
      console.warn('[ProctoringService] Không thể thông báo sự kiện terminate qua socket', notifyError);
    }

    // ==========================================
    // BỔ SUNG: GỬI NOTIFICATION QUA KAFKA (Cho Sinh Viên bị đình chỉ)
    // ==========================================
    await sendNotification({
      recipientUserId: session.userId,
      title: "ĐÌNH CHỈ THI",
      content: reason ? `Bài thi của bạn đã bị đình chỉ với lý do: ${reason}` : "Bài thi của bạn đã bị đình chỉ do vi phạm quy chế.",
      type: "TERMINATE",
      severity: "high",
      extraData: {
        examId: session.examId,
        sessionId: session.id,
        terminatedBy: terminatedBy
      }
    });

    return session;
  } catch (error) {
    console.error('[ProctoringService] Lỗi khi dừng phiên giám sát', error);
    throw error;
  }
}

/**
 * Đánh dấu session là completed khi user hoàn thành bài thi
 */
async function completeSession(sessionId) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const session = await db.ExamSession.findByPk(sessionId);
    if (!session) {
      console.warn(`[ProctoringService] Không tìm thấy session ${sessionId} để complete`);
      return null;
    }

    if (session.status !== 'ACTIVE') {
      console.log(`[ProctoringService] Session ${sessionId} đã có status ${session.status}, không cần complete`);
      return session;
    }

    session.status = 'COMPLETED';
    session.endTime = new Date();
    await session.save();
    activeSessionHeartbeats.delete(sessionId);

    try {
      const { getIO } = require('../config/websocket');
      const io = getIO();
      if (io && session.examId) {
        const completePayload = {
          sessionId,
          examId: String(session.examId),
          userId: String(session.userId),
        };
        io.to(String(session.examId)).emit('proctoring_session_completed', completePayload);
        console.log(`[ProctoringService] Đã emit completed event cho session ${sessionId}`);
      }
    } catch (notifyError) {
      console.warn('[ProctoringService] Không thể thông báo sự kiện completed qua socket', notifyError);
    }

    return session;
  } catch (error) {
    console.error('[ProctoringService] Lỗi khi complete phiên giám sát', error);
    throw error;
  }
}

/**
 * Gửi cảnh báo từ admin đến student
 */
async function sendWarning(sessionId, { sentBy, message } = {}) {
  if (!sessionId) {
    throw new Error('Session ID is required');
  }

  try {
    const session = await db.ExamSession.findByPk(sessionId);
    if (!session) {
      return null;
    }

    // --- [SỬA ĐỔI ĐỂ KHỚP VỚI JAVA] ---
    const customData = {
      severity: 'MEDIUM',
      isReviewed: false,
      sentBy: sentBy ?? null,
      message: message ?? 'Bạn đã nhận được cảnh báo từ giám thị'
    };

    const warningEvent = await db.ProctoringEvent.create({
      sessionId: sessionId,
      eventType: 'ADMIN_WARNING',
      eventData: JSON.stringify(customData), // Ép thành String để lưu vào cột TEXT
      timestamp: new Date() // Java bắt buộc có trường này
    });

    try {
      const { getIO } = require('../config/websocket');
      const io = getIO();

      if (io && session.examId) {
        const warningPayload = {
          sessionId,
          examId: String(session.examId),
          userId: String(session.userId),
          sentBy: sentBy ?? null,
          message: message ?? 'Bạn đã nhận được cảnh báo từ giám thị',
          timestamp: new Date().toISOString(),
          eventId: warningEvent.id
        };
        io.to(String(session.examId)).emit('admin_warning', warningPayload);
        console.log(`[ProctoringService] Đã gửi cảnh báo đến session ${sessionId}`);
      }
    } catch (notifyError) {
      console.warn('[ProctoringService] Không thể thông báo cảnh báo qua socket', notifyError);
    }

    // ==========================================
    // BỔ SUNG: GỬI NOTIFICATION QUA KAFKA (Cho Sinh Viên)
    // ==========================================
    await sendNotification({
      recipientUserId: session.userId,
      title: "Cảnh báo vi phạm nội quy phòng thi",
      content: message ?? 'Bạn đã nhận được cảnh báo từ giám thị. Vui lòng tuân thủ quy định.',
      type: "WARNING",
      severity: "medium",
      extraData: {
        examId: session.examId,
        sessionId: session.id,
        sentBy: sentBy,
        eventId: warningEvent.id
      }
    });

    return warningEvent;
  } catch (error) {
    console.error('[ProctoringService] Lỗi khi gửi cảnh báo', error);
    throw error;
  }
}

module.exports = {
  createSession,
  handleProctoringData,
  saveDetectionsAsEvents,
  getEventsBySession,
  getActiveSessions,
  getStudentsInExam,
  recordSessionActivity,
  terminateSession,
  completeSession,
  sendWarning,
  emitSessionStatusUpdate,
  toUuid,
};
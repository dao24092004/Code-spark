// file: src/models/initdata.js
// Proctoring service sử dụng exam_db (proctoring_db đã gộp vào exam_db)
// Hàm tạo dữ liệu mẫu để test
const { v4: uuidv4 } = require('uuid');

// Hàm tạo dữ liệu mẫu
const createSampleData = async (db) => {
  try {
    // Tạo một ExamSession mẫu với UUID
    const userId = uuidv4();
    const examId = uuidv4();

    const examSession = await db.ExamSession.create({
      userId: userId,
      examId: examId,
      startTime: new Date(),
      status: 'ACTIVE',
      gracePeriodMinutes: 0,
      violationThresholdCount: 3,
      highSeverityViolationCount: 0,
    });
    console.log('ExamSession mẫu đã được tạo:', examSession.toJSON());

    // Tạo một ProctoringEvent liên quan đến ExamSession
    const proctoringEvent = await db.ProctoringEvent.create({
      sessionId: examSession.id,
      eventType: 'FACE_NOT_DETECTED',
      severity: 'HIGH',
      metadata: {
        details: 'User covered their face with a hand.',
      },
    });
    console.log('ProctoringEvent mẫu đã được tạo:', proctoringEvent.toJSON());

    // Tạo một MediaCapture liên quan đến ProctoringEvent
    const mediaCapture = await db.MediaCapture.create({
      sessionId: examSession.id,
      eventId: proctoringEvent.id,
      captureType: 'screenshot',
      storagePath: `/captures/screenshots/${uuidv4()}.png`,
    });
    console.log('MediaCapture mẫu đã được tạo:', mediaCapture.toJSON());

    console.log('Tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  }
};

module.exports = createSampleData;

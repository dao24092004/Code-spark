
// file: src/models/initdata.js
const { v4: uuidv4 } = require('uuid');

// Hàm tạo dữ liệu mẫu
const createSampleData = async (db) => {
  try {
    // 1. Tạo một ExamSession mẫu
    const examSession = await db.ExamSession.create({
      userId: 1, // ID người dùng mẫu
      examId: 'EXAM_101', // ID kỳ thi mẫu
      startTime: new Date(),
      status: 'in_progress',
    });
    console.log('ExamSession mẫu đã được tạo:', examSession.toJSON());

    // 2. Tạo một ProctoringEvent liên quan đến ExamSession
    const proctoringEvent = await db.ProctoringEvent.create({
      sessionId: examSession.id,
      eventType: 'face_occlusion', // Ví dụ: Khuôn mặt bị che khuất
      severity: 'high',
      timestamp: new Date(),
      metadata: {
        details: 'User covered their face with a hand.',
      },
    });
    console.log('ProctoringEvent mẫu đã được tạo:', proctoringEvent.toJSON());

    // 3. Tạo một MediaCapture liên quan đến ProctoringEvent
    const mediaCapture = await db.MediaCapture.create({
      eventId: proctoringEvent.id,
      captureType: 'screenshot', // 'screenshot' hoặc 'webcam'
      storagePath: `/captures/screenshots/${uuidv4()}.png`, // Đường dẫn lưu trữ mẫu
    });
    console.log('MediaCapture mẫu đã được tạo:', mediaCapture.toJSON());

    console.log('Tạo dữ liệu mẫu thành công!');
  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu mẫu:', error);
  }
};

module.exports = createSampleData;

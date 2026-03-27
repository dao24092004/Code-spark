// file: scripts/seed.js
// Proctoring service sử dụng exam_db (proctoring_db đã gộp vào exam_db)
const createSampleData = require('../src/models/initdata');
const db = require('../src/models');
const { v4: uuidv4 } = require('uuid');

/**
 * This script is for seeding the database with sample data for testing purposes.
 * It connects to the exam_db, creates sample exam sessions and corresponding
 * proctoring events, and then inserts them into their respective tables.
 *
 * To run this script, execute `node scripts/seed.js` from the service's root directory.
 */
const seedDatabase = async () => {
  try {
    const { sequelize, ExamSession, ProctoringEvent } = db;

    // 1. Authenticate and Sync Database
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    // Using { alter: true } will check the current state of the table in the database
    // and then perform the necessary changes in the table to make it match the model.
    // This is safer than { force: true } which would drop the tables first.
    await sequelize.sync({ alter: true });
    console.log('All models were synchronized successfully.');

    // 2. Create Sample Exam Sessions (sử dụng UUID)
    console.log('Creating sample exam sessions...');
    const userId1 = uuidv4();
    const userId2 = uuidv4();
    const examId1 = uuidv4();
    const examId2 = uuidv4();
    const reviewerId = uuidv4();

    const sessionsData = [
      {
        userId: userId1,
        examId: examId1,
        startTime: new Date(),
        status: 'ACTIVE',
        highSeverityViolationCount: 1,
        maxSeverityLevel: 'HIGH',
      },
      {
        userId: userId2,
        examId: examId2,
        startTime: new Date(Date.now() - 3 * 60 * 60 * 1000), // Started 3 hours ago
        endTime: new Date(Date.now() - 1 * 60 * 60 * 1000), // Ended 1 hour ago
        status: 'COMPLETED',
        maxSeverityLevel: 'MEDIUM',
        highSeverityViolationCount: 0,
        reviewNotes: 'Student looked away from the screen multiple times.',
        reviewerId: reviewerId,
      },
    ];

    // Using `create` individually to get instances back with default values like ID
    const session1 = await ExamSession.create(sessionsData[0]);
    const session2 = await ExamSession.create(sessionsData[1]);

    console.log('2 exam sessions created.');

    // 3. Create Sample Proctoring Events linked to the sessions
    console.log('Creating sample proctoring events...');
    const eventsData = [
      // Events for Session 1
      {
        sessionId: session1.id,
        eventType: 'FACE_NOT_DETECTED',
        severity: 'HIGH',
        metadata: { reason: 'User left the room for 30 seconds' },
        isReviewed: false,
      },
      {
        sessionId: session1.id,
        eventType: 'MULTIPLE_FACES',
        severity: 'MEDIUM',
        metadata: { detected_faces: 2, image_ref: '/path/to/image1.jpg' },
        isReviewed: false,
      },
      // Events for Session 2
      {
        sessionId: session2.id,
        eventType: 'MOBILE_PHONE_DETECTED',
        severity: 'LOW',
        metadata: { confidence: 0.85, image_ref: '/path/to/image2.jpg' },
        isReviewed: true,
      },
      {
        sessionId: session2.id,
        eventType: 'LOOKING_AWAY',
        severity: 'MEDIUM',
        metadata: { direction: 'left', duration_sec: 10 },
        isReviewed: true,
      },
    ];

    await ProctoringEvent.bulkCreate(eventsData);

    console.log(`${eventsData.length} proctoring events created.`);

    // Gọi hàm tạo dữ liệu mẫu từ initdata.js
    await createSampleData(db);

    console.log('Database seeding completed successfully!');

  } catch (error) {
    console.error('Unable to seed the database:', error);
  } finally {
    // 4. Close the database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
};

// Run the seeding function
seedDatabase();

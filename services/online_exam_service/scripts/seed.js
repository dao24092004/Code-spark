// file: scripts/seed.js

const db = require('../src/models');

// --- DỮ LIỆU MẪU ---
const courseId = 'f2e1b3a0-9c8c-4b4e-8b1a-1b1b1b1b1b1b'; // Giả sử một ID khóa học

const quizzes = [
  {
    id: 'a1b2c3d4-e5f6-7890-1234-567890abcdef',
    courseId: courseId,
    title: 'Bài kiểm tra giữa kỳ - Lập trình Web',
    description: 'Kiểm tra kiến thức về HTML, CSS, và JavaScript cơ bản.',
    timeLimitMinutes: 45,
  },
];

const questions = [
  // Câu hỏi cho Quiz 1
  {
    id: 'q1-a1b2c3d4-e5f6-7890-1234-567890abcdef',
    quizId: quizzes[0].id,
    content: 'Thẻ HTML nào được sử dụng để tạo một siêu liên kết?',
    type: 'multiple-choice',
    displayOrder: 1,
  },
  {
    id: 'q2-a1b2c3d4-e5f6-7890-1234-567890abcdef',
    quizId: quizzes[0].id,
    content: 'Thuộc tính CSS nào được dùng để thay đổi màu nền của một phần tử?',
    type: 'multiple-choice',
    displayOrder: 2,
  },
];

const questionOptions = [
  // Lựa chọn cho Câu hỏi 1
  { id: 'opt1-q1', questionId: questions[0].id, content: '<a>', isCorrect: true },
  { id: 'opt2-q1', questionId: questions[0].id, content: '<p>', isCorrect: false },
  { id: 'opt3-q1', questionId: questions[0].id, content: '<div>', isCorrect: false },

  // Lựa chọn cho Câu hỏi 2
  { id: 'opt1-q2', questionId: questions[1].id, content: 'color', isCorrect: false },
  { id: 'opt2-q2', questionId: questions[1].id, content: 'font-size', isCorrect: false },
  { id: 'opt3-q2', questionId: questions[1].id, content: 'background-color', isCorrect: true },
];

// --- HÀM THỰC THI ---

const seedDatabase = async () => {
  try {
    console.log('Bắt đầu quá trình seeding dữ liệu...');

    // Sử dụng transaction để đảm bảo toàn vẹn dữ liệu
    await db.sequelize.transaction(async (t) => {
      // Xóa dữ liệu cũ để tránh trùng lặp (thứ tự quan trọng)
      console.log('Xóa dữ liệu cũ...');
      await db.QuestionOption.destroy({ where: {}, transaction: t });
      await db.Question.destroy({ where: {}, transaction: t });
      await db.Quiz.destroy({ where: {}, transaction: t });

      // Thêm dữ liệu mới
      console.log('Thêm Quizzes...');
      await db.Quiz.bulkCreate(quizzes, { transaction: t });

      console.log('Thêm Questions...');
      await db.Question.bulkCreate(questions, { transaction: t });

      console.log('Thêm Question Options...');
      await db.QuestionOption.bulkCreate(questionOptions, { transaction: t });
    });

    console.log('✅ Seeding dữ liệu thành công!');

  } catch (error) {
    console.error('❌ Lỗi khi seeding dữ liệu:', error);
  } finally {
    // Đóng kết nối database
    await db.sequelize.close();
    console.log('Đã đóng kết nối database.');
  }
};

// Chạy hàm
seedDatabase();

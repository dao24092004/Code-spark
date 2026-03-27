// db/init-data.js
// Script khởi tạo dữ liệu mẫu (không migration - DB đã được tạo lại với UUID)
const { organizationDbSequelize } = require('../src/config/db');
const db = require('../src/models');

const syncDatabase = async () => {
  try {
    console.log('\n=== Khởi động Organization Service ===');

    console.log('\n--- Sync Sequelize Schema ---');
    await organizationDbSequelize.sync({ alter: true });
    console.log('  ✓ Sync schema hoàn tất');

    console.log('\n--- Thêm dữ liệu mẫu ---');
    await addSampleData();

    console.log('\n=== Khởi động hoàn tất ===');

  } catch (error) {
    console.error('\n❌ Lỗi khởi động:', error.message);
    process.exit(1);
  }
};

const addSampleData = async () => {
  try {
    console.log('  Kiểm tra và thêm dữ liệu mẫu...');

    // Tạo Organization với UUID tự động
    const [organization, orgCreated] = await db.Organization.findOrCreate({
      where: { name: 'CodeSpark Community' },
      defaults: {
        ownerId: '00000000-0000-0000-0000-000000000001',
        orgType: 'Community',
        orgSize: '100-500',
        industry: 'Education Technology',
        subscriptionPackage: 'premium',
        verificationStatus: 'verified',
        status: 'active',
        coursesCount: 0,
        membersCount: 1,
        recruitmentTestsCount: 0
      }
    });

    if (orgCreated) {
      console.log('  ✓ Đã tạo Organization:', organization.id);
    }

    // Tạo OrganizationMember
    const [member, memberCreated] = await db.OrganizationMember.findOrCreate({
      where: {
        organizationId: organization.id,
        userId: '00000000-0000-0000-0000-000000000001'
      },
      defaults: {
        status: 'ACTIVE',
        joinedAt: new Date()
      }
    });

    if (memberCreated) {
      console.log('  ✓ Đã thêm Owner vào Organization.');
    }

    // Tạo RecruitmentTest
    const [test, testCreated] = await db.RecruitmentTest.findOrCreate({
      where: { title: 'Bài Test Lập Trình Viên Frontend (ReactJS)' },
      defaults: {
        organizationId: organization.id,
        description: 'Bài test đánh giá kiến thức cơ bản và nâng cao về ReactJS, HTML, CSS và JavaScript.',
        durationMinutes: 60
      }
    });

    if (testCreated) {
      console.log('  ✓ Đã tạo Recruitment Test:', test.id);

      const question1 = await db.RecruitmentQuestion.create({
        testId: test.id,
        questionText: '`useEffect` hook trong React dùng để làm gì?',
        questionType: 'multiple-choice',
        options: JSON.stringify([
          { id: 'a', text: 'Quản lý state của component', isCorrect: false },
          { id: 'b', text: 'Thực hiện các side effect', isCorrect: true },
          { id: 'c', text: 'Render các component con', isCorrect: false },
          { id: 'd', text: 'Tạo context cho ứng dụng', isCorrect: false }
        ]),
        points: 10,
        displayOrder: 1
      });

      await db.RecruitmentAnswer.bulkCreate([
        { questionId: question1.id, answerText: 'Quản lý state của component', isCorrect: false },
        { questionId: question1.id, answerText: 'Thực hiện các side effect', isCorrect: true },
        { questionId: question1.id, answerText: 'Render các component con', isCorrect: false },
        { questionId: question1.id, answerText: 'Tạo context cho ứng dụng', isCorrect: false }
      ]);
      console.log('  ✓ Đã thêm câu hỏi và đáp án mẫu.');
    }

    console.log('  Hoàn tất dữ liệu mẫu.');
  } catch (error) {
    console.error('❌ Lỗi dữ liệu mẫu:', error.message);
  }
};

module.exports = syncDatabase;

if (require.main === module) {
  syncDatabase();
}

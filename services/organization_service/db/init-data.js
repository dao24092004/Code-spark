// db/init-data.js
const { organizationDbSequelize } = require('../src/config/db');
const db = require('../src/models');

/**
 * Đồng bộ hóa tất cả các model với cơ sở dữ liệu.
 * - alter: true: Tự động thêm cột mới, thay đổi kiểu dữ liệu nếu cần.
 *              Không xóa cột cũ để tránh mất dữ liệu.
 */
const syncDatabase = async () => {
  try {
    console.log('Bắt đầu đồng bộ hóa cơ sở dữ liệu (organizationDb)...');
    
    // Đồng bộ các model thuộc organizationDbSequelize
    await organizationDbSequelize.sync({ alter: true });

    console.log('✅ Đồng bộ hóa cơ sở dữ liệu thành công.');

    // Tùy chọn: Thêm dữ liệu mẫu sau khi đồng bộ
    await addSampleData();

  } catch (error) {
    console.error('❌ Lỗi đồng bộ hóa cơ sở dữ liệu:', error);
    process.exit(1); // Thoát tiến trình nếu có lỗi nghiêm trọng
  }
};

/**
 * Thêm dữ liệu mẫu vào cơ sở dữ liệu nếu chưa có.
 */
const addSampleData = async () => {
  try {
    console.log('Kiểm tra và thêm dữ liệu mẫu...');

    // 1. Thêm Organization mẫu
    const [organization, orgCreated] = await db.Organization.findOrCreate({
      where: { name: 'CodeSpark Community' },
      defaults: {
        ownerId: 1, // Giả sử user có ID=1 là owner
        orgType: 'Community',
        orgSize: '100-500',
        industry: 'Education Technology',
        package: 'premium',
        isVerified: true,
        status: 'active'
      }
    });

    if (orgCreated) {
      console.log('-> Đã tạo Organization mẫu.');
    }

    // 2. Thêm Thành viên cho Organization
    const [member, memberCreated] = await db.OrganizationMember.findOrCreate({
        where: { organizationId: organization.id, userId: 1 },
        defaults: {
            orgRole: 'owner'
        }
    });

    if (memberCreated) {
        console.log('-> Đã thêm Owner vào Organization.');
    }

    // 3. Thêm một bài Test tuyển dụng mẫu
    const [test, testCreated] = await db.RecruitmentTest.findOrCreate({
        where: { title: 'Bài Test Lập Trình Viên Frontend (ReactJS)' },
        defaults: {
            organizationId: organization.id,
            description: 'Bài test đánh giá kiến thức cơ bản và nâng cao về ReactJS, HTML, CSS và JavaScript.',
            durationMinutes: 60
        }
    });

    if (testCreated) {
        console.log('-> Đã tạo Recruitment Test mẫu.');

        // 4. Thêm câu hỏi cho Test
        const question1 = await db.RecruitmentQuestion.create({
            testId: test.id,
            content: '`useEffect` hook trong React dùng để làm gì?',
            questionType: 'multiple-choice'
        });
        console.log('--> Đã thêm câu hỏi 1.');

        // 5. Thêm các câu trả lời cho câu hỏi
        await db.RecruitmentAnswer.bulkCreate([
            { questionId: question1.id, content: 'Quản lý state của component', isCorrect: false },
            { questionId: question1.id, content: 'Thực hiện các side effect (ví dụ: fetch data, subscriptions)', isCorrect: true },
            { questionId: question1.id, content: 'Render các component con', isCorrect: false },
            { questionId: question1.id, content: 'Tạo context cho ứng dụng', isCorrect: false }
        ]);
        console.log('---> Đã thêm các câu trả lời.');
    }


    console.log('✅ Hoàn tất việc thêm dữ liệu mẫu.');
  } catch (error) {
    console.error('❌ Lỗi khi thêm dữ liệu mẫu:', error);
  }
}


// Chạy hàm đồng bộ
// syncDatabase();

module.exports = syncDatabase;
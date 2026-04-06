// db/drop-and-recreate.js
// Script DROP toàn bộ organization_db và tạo lại từ đầu
// Chạy: node db/drop-and-recreate.js

const { Sequelize } = require('sequelize');
const path = require('path');

// Load env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const ORG_DB_NAME = process.env.ORGANIZATION_DB_NAME || 'organization_db';
const DB_USER = process.env.DB_USER || 'postgres';
const DB_PASS = process.env.DB_PASSWORD || 'password';
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 5433;
const DB_DIALECT = process.env.DB_DIALECT || 'postgres';

async function dropAndRecreate() {
  console.log('=== DROP và RECREATE organization_db ===\n');

  // 1. Kết nối postgres (database mặc định)
  console.log('1. Kết nối PostgreSQL server...');
  const postgresDb = new Sequelize(DB_DIALECT + '://' + DB_USER + ':' + DB_PASS + '@' + DB_HOST + ':' + DB_PORT + '/postgres', {
    logging: false
  });

  try {
    await postgresDb.authenticate();
    console.log('   ✓ Kết nối thành công\n');
  } catch (err) {
    console.error('   ❌ Lỗi kết nối:', err.message);
    process.exit(1);
  }

  // 2. Terminate all connections to organization_db
  console.log('2. Terminate all connections to ' + ORG_DB_NAME + '...');
  try {
    await postgresDb.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = '` + ORG_DB_NAME + `'
        AND pid <> pg_backend_pid()
    `);
    console.log('   ✓ Đã terminate connections\n');
  } catch (err) {
    console.error('   ⚠ Lỗi terminate:', err.message);
  }

  // 3. DROP database
  console.log('3. DROP database ' + ORG_DB_NAME + '...');
  try {
    await postgresDb.query(`DROP DATABASE IF EXISTS "` + ORG_DB_NAME + `"`);
    console.log('   ✓ Đã DROP database\n');
  } catch (err) {
    console.error('   ❌ Lỗi DROP:', err.message);
    process.exit(1);
  }

  // 4. CREATE database
  console.log('4. CREATE database ' + ORG_DB_NAME + '...');
  try {
    await postgresDb.query(`CREATE DATABASE "` + ORG_DB_NAME + `"`);
    console.log('   ✓ Đã CREATE database\n');
  } catch (err) {
    console.error('   ❌ Lỗi CREATE:', err.message);
    process.exit(1);
  }

  await postgresDb.close();

  // 5. Chạy sync schema
  console.log('5. Sync Sequelize schema...');
  const { organizationDbSequelize } = require('../src/config/db');
  const db = require('../src/models');

  try {
    await organizationDbSequelize.sync({ alter: true });
    console.log('   ✓ Sync schema hoàn tất\n');
  } catch (err) {
    console.error('   ❌ Lỗi sync:', err.message);
    process.exit(1);
  }

  // 6. Thêm dữ liệu mẫu
  console.log('6. Thêm dữ liệu mẫu...');
  try {
    await addSampleData(db);
    console.log('   ✓ Dữ liệu mẫu đã thêm\n');
  } catch (err) {
    console.error('   ❌ Lỗi dữ liệu mẫu:', err.message);
  }

  console.log('=== HOÀN TẤT ===');
  console.log('organization_db đã được tạo lại từ đầu với schema UUID.');
  process.exit(0);
}

async function addSampleData(db) {
  const [organization, orgCreated] = await db.Organization.findOrCreate({
    where: { name: 'CodeSpark Community' },
    defaults: {
      id: '00000000-0000-0000-0000-000000000001',
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
    console.log('   ✓ Đã tạo Organization:', organization.id);
  }

  const [member, memberCreated] = await db.OrganizationMember.findOrCreate({
    where: {
      id: '00000000-0000-0000-0000-000000000002',
      organizationId: organization.id,
      userId: '00000000-0000-0000-0000-000000000001'
    },
    defaults: {
      status: 'ACTIVE',
      joinedAt: new Date()
    }
  });

  if (memberCreated) {
    console.log('   ✓ Đã thêm Owner vào Organization.');
  }

  const [test, testCreated] = await db.RecruitmentTest.findOrCreate({
    where: { title: 'Bài Test Lập Trình Viên Frontend (ReactJS)' },
    defaults: {
      id: '00000000-0000-0000-0000-000000000003',
      organizationId: organization.id,
      description: 'Bài test đánh giá kiến thức cơ bản và nâng cao về ReactJS, HTML, CSS và JavaScript.',
      durationMinutes: 60
    }
  });

  if (testCreated) {
    console.log('   ✓ Đã tạo Recruitment Test:', test.id);

    const question1 = await db.RecruitmentQuestion.create({
      id: '00000000-0000-0000-0000-000000000004',
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
      { id: '00000000-0000-0000-0000-000000000005', questionId: question1.id, answerText: 'Quản lý state của component', isCorrect: false },
      { id: '00000000-0000-0000-0000-000000000006', questionId: question1.id, answerText: 'Thực hiện các side effect', isCorrect: true },
      { id: '00000000-0000-0000-0000-000000000007', questionId: question1.id, answerText: 'Render các component con', isCorrect: false },
      { id: '00000000-0000-0000-0000-000000000008', questionId: question1.id, answerText: 'Tạo context cho ứng dụng', isCorrect: false }
    ]);
    console.log('   ✓ Đã thêm câu hỏi và đáp án mẫu.');
  }
}

dropAndRecreate();

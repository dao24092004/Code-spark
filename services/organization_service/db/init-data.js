// db/init-data.js

const db = require('../src/models');

const createInitialData = async () => {
  try {
    // --- Create Organization ---
    const org1 = await db.Organization.create({
      name: 'CodeSpark',
      ownerId: 1, // Giả sử có user với id = 1
      orgType: 'Technology',
      orgSize: '10-50 employees',
      industry: 'Software Development',
      package: 'premium',
      status: 'active',
      isVerified: true,
    });

    const org2 = await db.Organization.create({
      name: 'DesignPro',
      ownerId: 2, // Giả sử có user với id = 2
      orgType: 'Design',
      orgSize: '1-10 employees',
      industry: 'Creative Agency',
      package: 'free',
      status: 'active',
      isVerified: false,
    });

    console.log('Organizations created:', org1.toJSON(), org2.toJSON());

    // --- Create Organization Members ---
    const member1 = await db.OrganizationMember.create({
      organizationId: org1.id,
      userId: 1,
      orgRole: 'admin',
    });

    const member2 = await db.OrganizationMember.create({
      organizationId: org1.id,
      userId: 3, // Giả sử có user với id = 3
      orgRole: 'member',
    });

    const member3 = await db.OrganizationMember.create({
      organizationId: org2.id,
      userId: 2,
      orgRole: 'admin',
    });
    
    console.log('Organization members created:', member1.toJSON(), member2.toJSON(), member3.toJSON());


    // --- Create Recruitment Test for CodeSpark ---
    const test1 = await db.RecruitmentTest.create({
      organizationId: org1.id,
      title: 'Node.js Developer Skill Test',
      description: 'A test to assess skills in Node.js, Express, and Sequelize.',
      durationMinutes: 60,
    });

    console.log('Recruitment test created:', test1.toJSON());

    // --- Create Questions for the Test ---
    const q1 = await db.RecruitmentQuestion.create({
      testId: test1.id,
      content: 'What is the event loop in Node.js?',
      questionType: 'multiple_choice',
    });

    const q2 = await db.RecruitmentQuestion.create({
      testId: test1.id,
      content: 'Explain the difference between `let`, `const`, and `var`.',
      questionType: 'short_answer',
    });
    
    const q3 = await db.RecruitmentQuestion.create({
      testId: test1.id,
      content: 'Which of the following is NOT a core module in Node.js?',
      questionType: 'multiple_choice',
    });

    console.log('Questions created:', q1.toJSON(), q2.toJSON(), q3.toJSON());

    // --- Create Answers for Question 1 ---
    await db.RecruitmentAnswer.bulkCreate([
      { questionId: q1.id, content: 'A mechanism that allows Node.js to perform non-blocking I/O operations.', isCorrect: true },
      { questionId: q1.id, content: 'A loop that iterates over arrays.', isCorrect: false },
      { questionId: q1.id, content: 'A special syntax for creating custom events.', isCorrect: false },
    ]);
    
    // --- Create Answers for Question 3 ---
    await db.RecruitmentAnswer.bulkCreate([
      { questionId: q3.id, content: 'http', isCorrect: false },
      { questionId: q3.id, content: 'fs', isCorrect: false },
      { questionId: q3.id, content: 'express', isCorrect: true },
      { questionId: q3.id, content: 'path', isCorrect: false },
    ]);

    console.log('Answers created for questions.');

    console.log('--- Initial data created successfully! ---');

  } catch (error) {
    console.error('Error creating initial data:', error);
  } finally {
    // Đóng kết nối DB
    await db.Organization.sequelize.close();
    // Nếu các model dùng các kết nối khác nhau, hãy đóng tất cả
    // await db.Course.sequelize.close(); 
  }
};

createInitialData();

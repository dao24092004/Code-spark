// src/services/recruitment.service.js

const db = require('../models');
// Import đầy đủ các model Nhóm 3
const { 
  Organization, 
  RecruitmentTest, 
  RecruitmentQuestion, 
  RecruitmentAnswer,
  RecruitmentSubmission // <-- Thêm model này
} = db;
const xlsx = require('xlsx'); // Import thư viện Excel

const recruitmentService = {

  /**
   * API 1 (Nhóm 3): Tạo Test
   */
  async createTest(orgId, testData) {
    try {
      const organization = await Organization.findByPk(orgId);
      if (!organization) throw new Error('OrganizationNotFound');
      
      const dataToCreate = { ...testData, organizationId: orgId };
      const newTest = await RecruitmentTest.create(dataToCreate);
      return newTest;
    } catch (error) {
      console.error('Lỗi Service [createTest]:', error.message);
      if (error.message === 'OrganizationNotFound') throw error;
      throw new Error('Không thể tạo test tuyển dụng.');
    }
  },

  /**
   * API 2 (Nhóm 3): Lấy danh sách Test
   */
  async getTestsByOrganization(orgId) {
    try {
      const tests = await RecruitmentTest.findAll({
        where: { organizationId: orgId },
        order: [['created_at', 'DESC']]
      });
      return tests;
    } catch (error) {
      console.error('Lỗi Service [getTestsByOrganization]:', error.message);
      throw new Error('Không thể lấy danh sách test.');
    }
  },

  /**
   * API 3 (Nhóm 3): Thêm câu hỏi (bằng tay) vào Test
   */
  async addQuestionToTest(testId, questionData) {
    const t = await db.sequelize.transaction();
    try {
      const newQuestion = await RecruitmentQuestion.create({
        testId: testId,
        content: questionData.content,
        questionType: questionData.questionType
      }, { transaction: t });

      const answersData = questionData.answers.map(answer => ({
        ...answer,
        questionId: newQuestion.id
      }));

      await RecruitmentAnswer.bulkCreate(answersData, { transaction: t });
      await t.commit();
      return newQuestion;
    } catch (error) {
      await t.rollback();
      console.error('Lỗi Service [addQuestionToTest]:', error.message);
      throw new Error('Không thể thêm câu hỏi.');
    }
  },

  /**
   * API 4 (Nhóm 3): Thêm câu hỏi từ File
   */
  async addQuestionsFromFile(testId, fileBuffer) {
    const t = await db.sequelize.transaction();
    try {
      const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const questionsData = xlsx.utils.sheet_to_json(worksheet);
      
      let questionsCreatedCount = 0;
      for (const row of questionsData) {
        // (Code xử lý file Excel... giữ nguyên)
        const newQuestion = await RecruitmentQuestion.create({ /* ... */ }, { transaction: t });
        const answers = [];
        // (Code xử lý file Excel... giữ nguyên)
        if (answers.length > 0) {
          await RecruitmentAnswer.bulkCreate(answers, { transaction: t });
        }
        questionsCreatedCount++;
      }
      await t.commit();
      return { count: questionsCreatedCount };
    } catch (error) {
      await t.rollback();
      console.error('Lỗi Service [addQuestionsFromFile]:', error.message);
      throw new Error('Không thể thêm câu hỏi từ file.');
    }
  },

  /**
   * API 5 (Nhóm 3): Ứng viên nộp bài và chấm điểm
   * (HÀM BỊ THIẾU LÀ ĐÂY)
   */
  async submitTest(testId, candidateId, submittedAnswers) {
    // submittedAnswers = [ { "questionId": 1, "answerId": 3 }, ... ]
    
    const t = await db.sequelize.transaction();
    try {
      // 1. Lấy thông tin bài Test (để lấy orgId)
      const test = await RecruitmentTest.findByPk(testId);
      if (!test) {
        throw new Error('TestNotFound');
      }
      const organizationId = test.organizationId;

      // 2. Lấy danh sách ID các câu trả lời mà ứng viên đã chọn
      const clientAnswerIds = submittedAnswers.map(a => a.answerId);

      // 3. Đếm xem có bao nhiêu câu trả lời ĐÚNG trong số đó
      const correctAnswersCount = await RecruitmentAnswer.count({
        where: {
          id: clientAnswerIds, // Chỉ tìm trong các ID mà user gửi
          isCorrect: true      // Và nó phải đúng
        }
      });

      // 4. Lấy tổng số câu hỏi của bài test
      const totalQuestions = await RecruitmentQuestion.count({
        where: { testId: testId }
      });

      // 5. Tính điểm
      let score = 0;
      if (totalQuestions > 0) {
        score = (correctAnswersCount / totalQuestions) * 100; // Tính theo thang 100
      }

      // 6. GHI vào bảng 'recruitment_submissions'
      const submission = await RecruitmentSubmission.create({
        testId: testId,
        candidateId: candidateId,
        organizationId: organizationId,
        score: score,
        status: 'submitted',
        startedAt: new Date(), // (Tạm thời)
        completedAt: new Date()
      }, { transaction: t });

      await t.commit();
      return submission; // Trả về kết quả (bao gồm điểm số)

    } catch (error) {
      await t.rollback();
      console.error('Lỗi Service [submitTest]:', error.message);
      if (error.message === 'TestNotFound') throw error;
      throw new Error('Không thể nộp bài test.');
    }
  }
};

module.exports = recruitmentService;
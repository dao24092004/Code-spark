// src/controllers/recruitment.controller.js
const recruitmentService = require('../services/recruitment.service');

const recruitmentController = {

  /**
   * API 1 (Nhóm 3): Xử lý POST /organizations/:orgId/recruitment-tests
   */
  async createTest(req, res) {
    try {
      const { orgId } = req.params; // Lấy ID tổ chức từ URL
      const testData = req.body; // Lấy dữ liệu test từ body

      // 1. Validation
      if (!testData.title || !testData.durationMinutes) {
        return res.status(400).json({
          message: 'Tên test (title) và thời lượng (durationMinutes) là bắt buộc.'
        });
      }

      // 2. Gọi Service
      const newTest = await recruitmentService.createTest(orgId, testData);

      // 3. Trả về thành công
      res.status(201).json({
        message: 'Tạo test tuyển dụng thành công!',
        data: newTest
      });

    } catch (error) {
      console.error('Lỗi Controller [createTest]:', error.message);
      if (error.message === 'OrganizationNotFound') {
        return res.status(404).json({ message: 'Lỗi: Không tìm thấy tổ chức này.' });
      }
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 2 (Nhóm 3): Xử lý GET /organizations/:orgId/recruitment-tests
   */
  async getTests(req, res) {
    try {
      const { orgId } = req.params; // Lấy ID tổ chức từ URL

      // 1. Gọi Service
      const tests = await recruitmentService.getTestsByOrganization(orgId);

      // 2. Trả về thành công
      res.status(200).json({
        message: 'Lấy danh sách test tuyển dụng thành công!',
        data: tests
      });

    } catch (error) {
      console.error('Lỗi Controller [getTests]:', error.message);
      res.status(500).json({ 
        message: 'Lỗi máy chủ nội bộ.',
        error: error.message 
      });
    }
  },
  /**
   * API 3 (Nhóm 3): Xử lý POST /recruitment-tests/:testId/questions
   */
  async addQuestion(req, res) {
    try {
      const { testId } = req.params; // Lấy ID bài test
      const questionData = req.body; // Lấy { content, questionType, answers: [] }

      // 1. Validation
      if (!questionData.content || !questionData.answers || !Array.isArray(questionData.answers) || questionData.answers.length === 0) {
        return res.status(400).json({
          message: 'Nội dung (content) và mảng câu trả lời (answers) là bắt buộc.'
        });
      }

      // 2. Gọi Service
      const newQuestion = await recruitmentService.addQuestionToTest(testId, questionData);
      
      // 3. Trả về thành công
      res.status(201).json({
        message: 'Thêm câu hỏi vào test thành công!',
        data: newQuestion
      });

    } catch (error) {
      console.error('Lỗi Controller [addQuestion]:', error.message);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
  },
  /**
   * API 4 (Nhóm 3): Xử lý POST /recruitment/tests/:testId/questions/upload
   */
  async addQuestionsFromFile(req, res) {
    try {
      const { testId } = req.params;

      // 1. Kiểm tra file (Multer sẽ lưu file vào req.file)
      if (!req.file) {
        return res.status(400).json({ message: 'Không tìm thấy file nào.' });
      }

      // 2. Lấy buffer của file
      const fileBuffer = req.file.buffer;

      // 3. Gọi Service
      const result = await recruitmentService.addQuestionsFromFile(testId, fileBuffer);

      // 4. Trả về
      res.status(201).json({
        message: `Thêm câu hỏi từ file thành công! Đã thêm ${result.count} câu hỏi.`,
        data: result
      });

    } catch (error) {
      console.error('Lỗi Controller [addQuestionsFromFile]:', error.message);
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
  },
  /**
   * API 5 (Nhóm 3): Xử lý POST /recruitment/tests/:testId/submit
   */
  async submitTest(req, res) {
    try {
      const { testId } = req.params;
      
      // --- SỬA LỖI Ở ĐÂY ---
      // Lấy ID của ứng viên TỪ TOKEN.
      // Dựa vào log của bạn, ID nằm trong trường 'userId'
      const candidateId = req.user.userId; 
      // --- KẾT THÚC SỬA LỖI ---
      
      const { answers } = req.body;

      // 1. Validation
      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({
          message: 'Mảng câu trả lời (answers) là bắt buộc.'
        });
      }
      
      // Kiểm tra (lần này sẽ thành công)
      if (!candidateId) {
         return res.status(401).json({
          message: 'Không tìm thấy thông tin ứng viên (userId) từ token.'
        });
      }

      // 2. Gọi Service
      // Chuyển candidateId thành số (INT) vì DB của bạn lưu là BIGINT
      const submissionResult = await recruitmentService.submitTest(
        testId, 
        parseInt(candidateId, 10), // Chuyển '3' (chuỗi) thành 3 (số)
        answers
      );

      // 3. Trả về thành công
      res.status(201).json({
        message: 'Nộp bài thành công!',
        data: submissionResult
      });

    } catch (error) {
      console.error('Lỗi Controller [submitTest]:', error.message);
      if (error.message === 'TestNotFound') {
         return res.status(404).json({ message: 'Lỗi: Không tìm thấy bài test này.' });
      }
      res.status(500).json({ message: 'Lỗi máy chủ nội bộ.', error: error.message });
    }
  }

 
};

module.exports = recruitmentController;
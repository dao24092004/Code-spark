// file: src/services/quiz.service.js

const db = require('../models');
const gradingService = require('./grading.service');
const proctoringIntegrationService = require('./proctoring.integration');
const blockchainService = require('./blockchain.service');

/**
 * Tính toán và lưu ranking/percentile cho submission
 */
async function calculateAndStoreRanking(quizId, submissionId, studentId, score) {
  try {
    // 1. Lấy tất cả submissions đã hoàn thành cho quiz này
    const allSubmissions = await db.QuizSubmission.findAll({
      where: { 
        quizId,
        submittedAt: { [db.Sequelize.Op.not]: null } // Only submitted submissions
      },
      attributes: ['id', 'score'],
      order: [['score', 'DESC']]
    });

    const totalSubmissions = allSubmissions.length;
    
    // 2. Tìm vị trí của submission hiện tại
    const rank = allSubmissions.findIndex(s => s.id === submissionId) + 1;
    
    // 3. Tính percentile (phần trăm submissions có điểm thấp hơn)
    const submissionsWithLowerScore = allSubmissions.filter(s => s.score < score).length;
    const percentile = totalSubmissions > 1 
      ? Math.round((submissionsWithLowerScore / (totalSubmissions - 1)) * 100)
      : 100; // Nếu là submission đầu tiên, percentile = 100
    
    // 4. Lưu vào bảng rankings (upsert)
    await db.QuizRanking.upsert({
      quizId,
      studentId,
      submissionId,
      score,
      percentile,
      rank,
      totalSubmissions
    });
  } catch (error) {
    console.error('Error calculating ranking:', error);
    // Don't throw - ranking is not critical for submission success
  }
}

/**
 * Xử lý logic khi sinh viên bắt đầu làm bài.
 */
async function startQuiz(userId, quizId, authToken) {
  // <<< BỔ SUNG 1: Kiểm tra xem bài quiz có tồn tại không >>>
  const quiz = await db.Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  // <<< BỔ SUNG 2: Kiểm tra xem sinh viên đã bắt đầu bài thi này chưa >>>
  const existingSubmission = await db.QuizSubmission.findOne({
    where: {
      studentId: userId,
      quizId: quizId,
    }
  });

  if (existingSubmission) {
    // Nếu bài thi đã hoàn thành (đã nộp), không cho làm lại
    if (existingSubmission.submittedAt) {
      throw new Error('Bạn đã hoàn thành bài thi này rồi. Không thể làm lại.');
    }
    
    // Nếu chưa hoàn thành, cho phép tiếp tục với submission cũ
    // Load quiz details để trả về cho frontend
    const quizWithDetails = await db.Quiz.findByPk(quizId, {
      include: {
        model: db.Question,
        as: 'questions',
        through: { attributes: ['displayOrder'] },
        include: {
          model: db.QuestionOption,
          as: 'options',
        },
      },
      order: [
        [{ model: db.Question, as: 'questions' }, db.ExamQuestion, 'displayOrder', 'ASC'],
      ],
    });
    
    const error = new Error('Bạn đã bắt đầu bài thi này rồi và chưa hoàn thành.');
    error.submissionId = existingSubmission.id;
    error.quizDetails = quizWithDetails; // Attach quiz details to error
    error.isConflict = true;
    throw error;
  }

  // 1. Tạo bản ghi bài làm trong DB
  const newSubmission = await db.QuizSubmission.create({
    studentId: userId,
    quizId: quizId,
    startedAt: new Date(), // Track start time
  });

  // 2. (Tích hợp) Gọi đến proctoring service để bắt đầu giám sát
  if (authToken) {
    try {
      await proctoringIntegrationService.startMonitoringSession(userId, quizId, authToken);
    } catch (proctoringError) {
      // Tạm thời chỉ log warning, không block việc thi
      console.warn('Cảnh báo: Không thể khởi động dịch vụ giám sát, nhưng vẫn cho phép thi.', proctoringError.message);
      // throw new Error('Không thể khởi động dịch vụ giám sát.');
    }
  } else {
    console.warn('Cảnh báo: Bỏ qua việc gọi dịch vụ giám sát vì thiếu Authorization token.');
  }

  // 3. Lấy câu hỏi để trả về cho Frontend
  // <<< BỔ SUNG 3: Lấy đầy đủ cả câu hỏi và lựa chọn để mapper xử lý >>>
  const quizWithDetails = await db.Quiz.findByPk(quizId, {
    include: {
      model: db.Question,
      as: 'questions',
      through: { attributes: ['displayOrder'] }, // Include displayOrder from join table
      include: {
        model: db.QuestionOption,
        as: 'options',
      },
    },
    order: [
      [{ model: db.Question, as: 'questions' }, db.ExamQuestion, 'displayOrder', 'ASC'],
    ],
  });
  
  return {
    submissionId: newSubmission.id,
    quizDetails: quizWithDetails, // Trả về dữ liệu đầy đủ, controller/mapper sẽ lọc sau
  };
}

/**
 * Xử lý logic khi sinh viên nộp bài.
 */
async function submitQuiz(submissionId, answers) {
  // 1. Tìm bài làm và kiểm tra trạng thái
  const submission = await db.QuizSubmission.findByPk(submissionId);

  // <<< BỔ SUNG 4: Kiểm tra xem bài làm có tồn tại và đã nộp chưa >>>
  if (!submission) {
    throw new Error(`Không tìm thấy bài làm với ID: ${submissionId}`);
  }
  if (submission.status === 'submitted') {
    throw new Error('Bài thi này đã được nộp trước đó.');
  }

  // 2. Cập nhật câu trả lời, thời gian và trạng thái
  submission.answers = JSON.stringify(answers);
  const submittedAt = new Date();
  submission.submittedAt = submittedAt;
  submission.status = 'submitted'; // Chuyển trạng thái
  
  // Calculate time spent in seconds
  if (submission.startedAt) {
    submission.timeSpentSeconds = Math.round((submittedAt - submission.startedAt) / 1000);
  }
  
  await submission.save();

  // ✨ NEW: Save individual answers to Answer table for detailed review
  // First, delete any existing answers for this submission (in case of resubmit)
  await db.Answer.destroy({ where: { submissionId: submission.id } });
  
  // Create answer records
  const answerRecords = answers.map(answer => ({
    submissionId: submission.id,
    questionId: answer.questionId,
    selectedAnswer: answer.selectedOptionId, // Store the option ID in selectedAnswer field
  }));
  
  await db.Answer.bulkCreate(answerRecords);

  // 3. (Gọi service con) Bắt đầu chấm điểm tự động
  const gradingResult = await gradingService.autoGrade(submissionId);
  const finalScore = gradingResult.score;
  const finalScoreRaw = gradingResult.scoreRaw;
  
  // Update answer breakdown
  await db.QuizSubmission.update(
    {
      correctAnswers: gradingResult.correctAnswers,
      wrongAnswers: gradingResult.wrongAnswers,
      totalQuestions: gradingResult.totalQuestions,
    },
    { where: { id: submissionId } }
  );

  // 4. Calculate and store ranking/percentile (non-blocking)
  try {
    await calculateAndStoreRanking(submission.quizId, submissionId, submission.studentId, finalScore);
  } catch (error) {
    console.error('Error calculating ranking (non-critical):', error.message);
    // Continue execution - ranking is not critical for submission success
  }

  // 5. (Gọi service con) Ghi điểm cuối cùng lên Blockchain (non-blocking)
  try {
    await blockchainService.recordFinalGrade(submissionId, parseInt(submission.studentId), finalScore);
  } catch (error) {
    console.error('Error recording to blockchain (non-critical):', error.message);
    // Continue execution - blockchain is not critical for submission success
  }
  
  return {
    submissionId: submissionId,
    score: finalScore,
    scoreRaw: finalScoreRaw,
    message: "Nộp bài và chấm điểm thành công!",
  };
}

/**
 * Lấy danh sách tất cả các quiz (cho trang danh sách bài thi)
 * CHỈ trả về các exam đã xuất bản (status = 'PUBLISHED')
 */
async function getAllQuizzes() {
  const quizzes = await db.Quiz.findAll({
    where: {
      status: 'PUBLISHED' // CHỈ lấy exam đã xuất bản
    },
    include: {
      model: db.Question,
      as: 'questions',
      attributes: ['id'], // Only get count, not full question details
    },
    order: [['id', 'ASC']], // Simple ordering by ID
  });
  
  // Add participant count for each quiz
  const quizzesWithStats = await Promise.all(
    quizzes.map(async (quiz) => {
      // Count unique students who have submissions for this quiz
      const participantCount = await db.QuizSubmission.count({
        where: { quizId: quiz.id },
        distinct: true,
        col: 'studentId'
      });
      
      return {
        ...quiz.toJSON(),
        participantCount
      };
    })
  );
  
  return quizzesWithStats;
}

/**
 * Lấy chi tiết quiz (không tạo submission)
 */
async function getQuizDetails(quizId) {
  const quiz = await db.Quiz.findByPk(quizId, {
    include: {
      model: db.Question,
      as: 'questions',
      through: { attributes: ['displayOrder'] }, // Include displayOrder from join table
      include: {
        model: db.QuestionOption,
        as: 'options',
      },
    },
    order: [
      [{ model: db.Question, as: 'questions' }, db.ExamQuestion, 'displayOrder', 'ASC'],
    ],
  });

  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  return quiz;
}

/**
 * Lấy tất cả submissions của một student
 */
async function getStudentSubmissions(studentId) {
  const submissions = await db.QuizSubmission.findAll({
    where: { studentId },
    // Order by id since timestamps are disabled in this model
    order: [['id', 'DESC']],
  });
  
  return submissions;
}

/**
 * Lấy kết quả chi tiết của một submission
 */
async function getSubmissionResult(submissionId, userId) {
  // 1. Tìm submission và verify ownership
  const submission = await db.QuizSubmission.findOne({
    where: { 
      id: submissionId,
      studentId: userId // Đảm bảo student chỉ xem được submission của mình
    },
    include: [
      {
        model: db.Quiz,
        as: 'quiz',
        include: {
          model: db.Question,
          as: 'questions',
          include: {
            model: db.QuestionOption,
            as: 'options',
          },
        },
      },
      {
        model: db.Answer,
        as: 'answersDetail', // Fixed: use correct alias from model association
      },
      {
        model: db.QuizRanking,
        as: 'ranking',
        required: false, // LEFT JOIN - ranking might not exist yet
      }
    ],
  });

  if (!submission) {
    throw new Error('Không tìm thấy bài thi hoặc bạn không có quyền xem kết quả này');
  }

  // 2. Kiểm tra đã nộp bài chưa
  if (!submission.submittedAt) {
    throw new Error('Bài thi này chưa nộp bài');
  }

  // 3. Use stored values from submission (already calculated during submit)
  const totalQuestions = submission.totalQuestions || submission.quiz.questions.length;
  const correctAnswers = submission.correctAnswers || 0;
  const wrongAnswers = submission.wrongAnswers || 0;
  const score = submission.score || 0; // Score is already percentage (0-100)
  const passed = score >= 70; // Điểm đạt >= 70%
  
  // 4. Build detailed question results for review
  const questionResults = [];
  for (const question of submission.quiz.questions) {
    // Find student answer from answersDetail association
    const studentAnswer = submission.answersDetail.find(a => a.questionId === question.id);
    
    let isCorrect = false;
    let correctOptionIds = [];
    let studentSelectedOptionId = null;
    let studentAnswerText = null;
    let optionsArray = [];
    
    // Extract selected option ID from Answer record (stored in selectedAnswer field)
    if (studentAnswer && studentAnswer.selectedAnswer) {
      studentSelectedOptionId = studentAnswer.selectedAnswer;
    }

    // ✨ FIX: Extract options from JSONB content field (for imported questions)
    if (question.content && typeof question.content === 'object' && Array.isArray(question.content.options)) {
      // Options stored in JSONB content.options
      optionsArray = question.content.options.map((optText, idx) => ({
        id: `${question.id}-opt-${idx}`,
        text: optText,
        isCorrect: idx === question.content.correctAnswer, // correctAnswer is index
      }));
    } else if (question.options && question.options.length > 0) {
      // Options stored in separate table
      optionsArray = question.options.map(opt => ({
        id: opt.id,
        text: opt.optionText,
        isCorrect: opt.isCorrect,
      }));
    }

    // ✨ ALWAYS extract correctOptionIds from optionsArray regardless of question type
    correctOptionIds = optionsArray
      .filter(opt => opt.isCorrect)
      .map(opt => opt.id);
    
    // Handle different question type formats (both lowercase and UPPERCASE)
    const normalizedType = (question.type || '').toLowerCase();
    
    if (normalizedType === 'multiple_choice' || normalizedType === 'single_choice' || 
        normalizedType === 'true_false' || normalizedType.includes('choice')) {
      // Kiểm tra đáp án sinh viên
      if (studentSelectedOptionId) {
        isCorrect = correctOptionIds.includes(studentSelectedOptionId);
      }
    } else if (normalizedType === 'essay') {
      // Essay question - lấy text từ answer
      if (studentAnswer) {
        studentAnswerText = studentAnswer.selectedAnswer; // Essay text stored in selectedAnswer
        // Essay không tự động chấm điểm, cần giảng viên review
        isCorrect = studentAnswer.score > 0;
      }
    }


    // ✨ Extract question text from content field
    let questionText = question.text || ''; // Default to text field
    
    // If text is empty, try to extract from JSONB content
    if (!questionText && question.content) {
      if (typeof question.content === 'object') {
        // Try different field names in JSONB
        questionText = question.content.question || question.content.text || question.content.questionText || '';
      } else if (typeof question.content === 'string') {
        // If content is stringified JSON, try to parse it
        try {
          const parsed = JSON.parse(question.content);
          questionText = parsed.question || parsed.text || parsed.questionText || question.content;
        } catch {
          // Not JSON, use as-is
          questionText = question.content;
        }
      }
    }
    
    // Final fallback
    if (!questionText) {
      questionText = `Question ${question.id}`;
    }

    questionResults.push({
      questionId: question.id,
      questionText: questionText,
      questionType: question.type,
      isCorrect,
      correctOptionIds,
      studentSelectedOptionId: studentSelectedOptionId,
      studentAnswerText,
      earnedPoints: studentAnswer?.score || 0,
      maxPoints: question.points,
      options: optionsArray,
    });
  }

  return {
    submissionId: submission.id,
    examId: submission.quizId,
    examTitle: submission.quiz.title,
    score: Math.round(score * 10) / 10, // Làm tròn 1 chữ số thập phân
    totalQuestions,
    correctAnswers,
    wrongAnswers, // Use pre-calculated value from submission
    passed,
    submittedAt: submission.submittedAt,
    timeSpentSeconds: submission.timeSpentSeconds,
    questionResults, // Chi tiết từng câu hỏi
    // Ranking data (if available)
    percentile: submission.ranking?.percentile || null,
    rank: submission.ranking?.rank || null,
    totalSubmissions: submission.ranking?.totalSubmissions || null,
  };
}

module.exports = {
  startQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizDetails,
  getStudentSubmissions,
  getSubmissionResult,
};
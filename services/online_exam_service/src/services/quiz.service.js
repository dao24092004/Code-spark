// file: src/services/quiz.service.js

const db = require('../models');
const gradingService = require('./grading.service');
const proctoringIntegrationService = require('./proctoring.integration');

/**
 * Tính toán và lưu ranking/percentile cho submission.
 * studentId đã là UUID (BigInt đã chuyển sang UUID theo exam_db ERD).
 */
async function calculateAndStoreRanking(quizId, submissionId, studentId, score) {
  try {
    const allSubmissions = await db.QuizSubmission.findAll({
      where: {
        quizId,
        submittedAt: { [db.Sequelize.Op.ne]: null }
      },
      attributes: ['id', 'score'],
      order: [['score', 'DESC']]
    });

    const totalSubmissions = allSubmissions.length;
    const rank = allSubmissions.findIndex(s => s.id === submissionId) + 1;
    const submissionsWithLowerScore = allSubmissions.filter(s => s.score < score).length;
    const percentile = totalSubmissions > 1
      ? Math.round((submissionsWithLowerScore / (totalSubmissions - 1)) * 100)
      : 100;

    await db.QuizRanking.upsert({
      quizId,
      studentId,
      submissionId,
      percentile,
      rank,
      totalSubmissions
    });
  } catch (error) {
    console.error('Error calculating ranking:', error);
  }
}

/**
 * Xử lý logic khi sinh viên bắt đầu làm bài.
 * studentId đến từ JWT (identity_db users.id = UUID).
 */
async function startQuiz(userId, quizId, authToken) {
  const quiz = await db.Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  // Kiểm tra submission chưa nộp (dùng submittedAt thay vì status)
  const existingSubmission = await db.QuizSubmission.findOne({
    where: {
      studentId: userId,
      quizId,
      submittedAt: { [db.Sequelize.Op.eq]: null }
    }
  });

  if (existingSubmission) {
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
    error.quizDetails = quizWithDetails;
    error.isConflict = true;
    throw error;
  }

  // Tạo submission mới
  const newSubmission = await db.QuizSubmission.create({
    studentId: userId,
    quizId,
    startedAt: new Date(),
    isFinal: false,
  });

  // Gọi proctoring service
  if (authToken) {
    try {
      await proctoringIntegrationService.startMonitoringSession(userId, quizId, authToken);
    } catch (proctoringError) {
      console.warn('Cảnh báo: Không thể khởi động dịch vụ giám sát, nhưng vẫn cho phép thi.',
        proctoringError.message);
    }
  }

  // Lấy câu hỏi để trả về cho Frontend
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

  return {
    submissionId: newSubmission.id,
    quizDetails: quizWithDetails,
  };
}

/**
 * Xử lý logic khi sinh viên nộp bài.
 * 1. Cập nhật submission với câu trả lời.
 * 2. Lưu chi tiết từng câu trả lời vào bảng answers (exam_db).
 * 3. Chấm điểm tự động.
 * 4. Tính ranking.
 */
async function submitQuiz(submissionId, answers, authHeader) {
  const submission = await db.QuizSubmission.findByPk(submissionId);

  if (!submission) {
    throw new Error(`Không tìm thấy bài làm với ID: ${submissionId}`);
  }

  // Kiểm tra đã nộp chưa (dùng submittedAt thay vì status)
  if (submission.submittedAt) {
    throw new Error('Bài thi này đã được nộp trước đó.');
  }

  // --- Tìm proctoring session trước khi cập nhật submission ---
  let proctoringSessionId = null;
  try {
    const activeSessions = await proctoringIntegrationService.getActiveSessions(authHeader || undefined);
    const sessions = Array.isArray(activeSessions) ? activeSessions : (activeSessions?.data || []);

    const matchingSession = sessions.find(s => {
      const sessionExamId = String(s.examId || s.exam_id || '');
      const sessionUserId = String(s.userId || s.user_id || '');
      const examIdStr = String(submission.quizId || '');
      const studentIdStr = String(submission.studentId || '');

      return sessionExamId === examIdStr
        && sessionUserId === studentIdStr
        && (s.status === 'in_progress' || s.status === 'IN_PROGRESS');
    });

    if (matchingSession) {
      proctoringSessionId = matchingSession.id || matchingSession.sessionId;
    }
  } catch (error) {
    console.warn('[QUIZ SERVICE] Không thể lấy danh sách proctoring sessions (non-critical):', error.message || error);
  }

  // --- Lưu chi tiết câu trả vào bảng answers (exam_db) ---
  // Xóa câu trả lời cũ (phòng resubmit)
  await db.Answer.destroy({ where: { submissionId: submission.id } });

  const answerRecords = answers.map(answer => ({
    submissionId: submission.id,
    questionId: answer.questionId,
    selectedAnswer: answer.selectedOptionId,
    score: null,
    isCorrect: null,
  }));

  await db.Answer.bulkCreate(answerRecords);

  // --- Cập nhật submission ---
  const submittedAt = new Date();
  submission.answers = JSON.stringify(answers);
  submission.submittedAt = submittedAt;
  submission.isFinal = true;

  if (submission.startedAt) {
    submission.timeSpentSeconds = Math.round((submittedAt - submission.startedAt) / 1000);
  }

  await submission.save();

  // --- Chấm điểm tự động ---
  const gradingResult = await gradingService.autoGrade(submissionId);
  const finalScore = gradingResult.score;
  const finalScoreRaw = gradingResult.scoreRaw;

  await db.QuizSubmission.update(
    {
      correctAnswers: gradingResult.correctAnswers,
      wrongAnswers: gradingResult.wrongAnswers,
      totalQuestions: gradingResult.totalQuestions,
    },
    { where: { id: submissionId } }
  );

  // --- Tính ranking (non-blocking) ---
  try {
    await calculateAndStoreRanking(submission.quizId, submissionId, submission.studentId, finalScore);
  } catch (error) {
    console.error('Error calculating ranking (non-critical):', error.message);
  }

  // --- Hoàn tất proctoring session (non-blocking) ---
  if (proctoringSessionId) {
    try {
      await proctoringIntegrationService.completeMonitoringSession(
        proctoringSessionId,
        authHeader || undefined
      );
    } catch (error) {
      console.warn('Không thể hoàn tất phiên giám sát (non-critical):', error.message || error);
    }
  }

  return {
    submissionId,
    score: finalScore,
    scoreRaw: finalScoreRaw,
    message: "Nộp bài và chấm điểm thành công!",
  };
}

/**
 * Lấy danh sách tất cả các quiz (cho trang danh sách bài thi).
 * Chỉ trả về các exam đã xuất bản (status = 'OPEN' trong exam_db).
 * exam_db status: DRAFT, SCHEDULED, OPEN, CLOSED, CANCELLED
 */
async function getAllQuizzes() {
  const quizzes = await db.Quiz.findAll({
    where: {
      status: 'OPEN'
    },
    attributes: ['id', 'title', 'description', 'durationMinutes', 'passScore',
      'startAt', 'endAt', 'totalQuestions', 'createdAt'],
    order: [['id', 'ASC']],
  });

  const quizzesWithStats = await Promise.all(
    quizzes.map(async (quiz) => {
      const participantCount = await db.QuizSubmission.count({
        where: { quizId: quiz.id },
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
 * Lấy chi tiết quiz (không tạo submission).
 */
async function getQuizDetails(quizId) {
  const quiz = await db.Quiz.findByPk(quizId, {
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

  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  return quiz;
}

/**
 * Lấy tất cả submissions của một student.
 * studentId từ JWT (UUID).
 */
async function getStudentSubmissions(studentId) {
  const submissions = await db.QuizSubmission.findAll({
    where: { studentId },
    order: [['id', 'DESC']],
  });
  return submissions;
}

/**
 * Lấy kết quả chi tiết của một submission.
 * userId từ JWT (UUID) → so sánh với studentId trong exam_db (UUID).
 */
async function getSubmissionResult(submissionId, userId) {
  const submission = await db.QuizSubmission.findOne({
    where: {
      id: submissionId,
      studentId: userId
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
        as: 'answersDetail',
      },
      {
        model: db.QuizRanking,
        as: 'ranking',
        required: false,
      }
    ],
  });

  if (!submission) {
    throw new Error('Không tìm thấy bài thi hoặc bạn không có quyền xem kết quả này');
  }

  if (!submission.submittedAt) {
    throw new Error('Bài thi này chưa nộp bài');
  }

  const totalQuestions = submission.totalQuestions || submission.quiz.questions.length;
  const correctAnswers = submission.correctAnswers || 0;
  const wrongAnswers = submission.wrongAnswers || 0;
  const score = submission.score || 0;
  const passed = score >= 70;

  const questionResults = [];
  for (const question of submission.quiz.questions) {
    const studentAnswer = submission.answersDetail.find(a => a.questionId === question.id);

    let isCorrect = false;
    let correctOptionIds = [];
    let studentSelectedOptionId = null;
    let studentAnswerText = null;
    let optionsArray = [];

    if (studentAnswer && studentAnswer.selectedAnswer) {
      studentSelectedOptionId = studentAnswer.selectedAnswer;
    }

    // Options từ JSONB content
    if (question.content && typeof question.content === 'object' && Array.isArray(question.content.options)) {
      optionsArray = question.content.options.map((optText, idx) => ({
        id: `${question.id}-opt-${idx}`,
        text: optText,
        isCorrect: idx === question.content.correctAnswer,
      }));
    } else if (question.options && question.options.length > 0) {
      optionsArray = question.options.map(opt => ({
        id: opt.id,
        text: opt.optionText,
        isCorrect: opt.isCorrect,
      }));
    }

    correctOptionIds = optionsArray.filter(opt => opt.isCorrect).map(opt => opt.id);

    const normalizedType = (question.type || '').toLowerCase();

    if (normalizedType === 'multiple_choice' || normalizedType === 'single_choice'
      || normalizedType === 'true_false' || normalizedType.includes('choice')) {
      if (studentSelectedOptionId) {
        isCorrect = correctOptionIds.includes(studentSelectedOptionId);
      }
    } else if (normalizedType === 'essay') {
      if (studentAnswer) {
        studentAnswerText = studentAnswer.selectedAnswer;
        isCorrect = studentAnswer.score > 0;
      }
    }

    let questionText = question.text || '';
    if (!questionText && question.content) {
      if (typeof question.content === 'object') {
        questionText = question.content.question || question.content.text
          || question.content.questionText || '';
      } else if (typeof question.content === 'string') {
        try {
          const parsed = JSON.parse(question.content);
          questionText = parsed.question || parsed.text || parsed.questionText || question.content;
        } catch {
          questionText = question.content;
        }
      }
    }

    if (!questionText) {
      questionText = `Question ${question.id}`;
    }

    questionResults.push({
      questionId: question.id,
      questionText,
      questionType: question.type,
      isCorrect,
      correctOptionIds,
      studentSelectedOptionId,
      studentAnswerText,
      earnedPoints: studentAnswer?.score || 0,
      maxPoints: question.score || question.points || 1,
      options: optionsArray,
    });
  }

  return {
    submissionId: submission.id,
    examId: submission.quizId,
    examTitle: submission.quiz.title,
    score: Math.round(score * 10) / 10,
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    passed,
    submittedAt: submission.submittedAt,
    timeSpentSeconds: submission.timeSpentSeconds,
    questionResults,
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

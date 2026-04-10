// file: src/services/quiz.service.js

const db = require('../models');
const gradingService = require('./grading.service');
const proctoringIntegrationService = require('./proctoring.integration');

// ==========================================
// 1. IMPORT KAFKA PRODUCER ĐỂ GỬI THÔNG BÁO
// ==========================================
const notificationProducer = require('./notification.producer');

/**
 * Tính toán và lưu ranking/percentile cho submission.
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
 */
async function startQuiz(userId, quizId, authToken) {
  const quiz = await db.Quiz.findByPk(quizId);
  if (!quiz) {
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  // Kiểm tra submission chưa nộp
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

  if (authToken) {
    try {
      await proctoringIntegrationService.startMonitoringSession(userId, quizId, authToken);
    } catch (proctoringError) {
      console.warn('Cảnh báo proctoring:', proctoringError.message);
    }
  }

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
 * Xử lý nộp bài
 */
async function submitQuiz(submissionId, answers, authHeader) {
  const submission = await db.QuizSubmission.findByPk(submissionId);

  if (!submission) {
    throw new Error(`Không tìm thấy bài làm với ID: ${submissionId}`);
  }

  if (submission.submittedAt) {
    throw new Error('Bài thi này đã được nộp trước đó.');
  }

  let proctoringSessionId = null;
  try {
    const activeSessions = await proctoringIntegrationService.getActiveSessions(authHeader || undefined);
    const sessions = Array.isArray(activeSessions) ? activeSessions : (activeSessions?.data || []);

    const matchingSession = sessions.find(s => {
      return String(s.examId || s.exam_id || '') === String(submission.quizId)
        && String(s.userId || s.user_id || '') === String(submission.studentId)
        && (String(s.status).toLowerCase() === 'in_progress');
    });

    if (matchingSession) {
      proctoringSessionId = matchingSession.id || matchingSession.sessionId;
    }
  } catch (error) {
    console.warn('[QUIZ SERVICE] Lỗi lấy session proctoring:', error.message);
  }

  await db.Answer.destroy({ where: { submissionId: submission.id } });

  // -------------------------------------------------------------
  // ĐÃ SỬA LỖI DATABASE Ở ĐÂY: Hỗ trợ cả 2 tên biến từ Frontend gửi lên
  // -------------------------------------------------------------
  const answerRecords = answers.map(answer => ({
    submissionId: submission.id,
    questionId: answer.questionId,
    selectedAnswer: answer.selectedOptionId || answer.selectedAnswer, 
    score: null,
    isCorrect: null,
  }));

  await db.Answer.bulkCreate(answerRecords);

  const submittedAt = new Date();
  submission.answers = JSON.stringify(answers);
  submission.submittedAt = submittedAt;
  submission.isFinal = true;

  if (submission.startedAt) {
    submission.timeSpentSeconds = Math.round((submittedAt - submission.startedAt) / 1000);
  }

  await submission.save();

  const gradingResult = await gradingService.autoGrade(submissionId);
  const finalScore = gradingResult.score;

  await db.QuizSubmission.update(
    {
      correctAnswers: gradingResult.correctAnswers,
      wrongAnswers: gradingResult.wrongAnswers,
      totalQuestions: gradingResult.totalQuestions,
      score: finalScore
    },
    { where: { id: submissionId } }
  );

  try {
    await calculateAndStoreRanking(submission.quizId, submissionId, submission.studentId, finalScore);
  } catch (error) {
    console.error('Lỗi tính ranking:', error.message);
  }

  if (proctoringSessionId) {
    try {
      await proctoringIntegrationService.completeMonitoringSession(proctoringSessionId, authHeader || undefined);
    } catch (error) {
      console.warn('Lỗi kết thúc giám sát:', error.message);
    }
  }

  // ==============================================================
  // 2. LOGIC BẮN THÔNG BÁO LÊN KAFKA KHI NỘP BÀI XONG
  // ==============================================================
  try {
    const quiz = await db.Quiz.findByPk(submission.quizId);
    const quizTitle = quiz ? quiz.title : 'Bài thi';

    const notificationPayload = {
      recipientUserId: submission.studentId.toString(),
      title: "Nộp bài thành công!",
      content: `Hệ thống đã ghi nhận bài làm của bạn cho bài thi: "${quizTitle}". Bạn đạt ${finalScore} điểm.`,
      type: "INFO",
      severity: "low",
      extraData: {
        submissionId: submissionId.toString(),
        quizId: submission.quizId.toString()
      }
    };

    // Gọi Kafka Producer (Fire and forget, không dùng await)
    notificationProducer.sendNotification(notificationPayload);
  } catch (notifyError) {
    console.error('[QUIZ SERVICE] Lỗi khi chuẩn bị gửi thông báo nộp bài:', notifyError);
  }
  // ==============================================================

  return {
    submissionId,
    score: finalScore,
    message: "Nộp bài thành công!",
  };
}

/**
 * Lấy danh sách Quiz
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

  return await Promise.all(
    quizzes.map(async (quiz) => {
      const participantCount = await db.QuizSubmission.count({
        where: { quizId: quiz.id },
      });
      return { ...quiz.toJSON(), participantCount };
    })
  );
}

/**
 * Lấy chi tiết Quiz
 */
async function getQuizDetails(quizId) {
  console.log(`[QUIZ SERVICE] Truy vấn chi tiết ID: ${quizId}`);

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
    console.error(`[QUIZ SERVICE] Không tìm thấy bản ghi ID ${quizId} trong bảng exams`);
    throw new Error(`Không tìm thấy bài quiz với ID: ${quizId}`);
  }

  return quiz;
}

/**
 * Submissions của một student
 */
async function getStudentSubmissions(studentId) {
  return await db.QuizSubmission.findAll({
    where: { studentId },
    order: [['id', 'DESC']],
  });
}

/**
 * Kết quả chi tiết submission
 */
async function getSubmissionResult(submissionId, userId) {
  const submission = await db.QuizSubmission.findOne({
    where: { id: submissionId, studentId: userId },
    include: [
      {
        model: db.Quiz,
        as: 'quiz',
        include: {
          model: db.Question,
          as: 'questions',
          include: { model: db.QuestionOption, as: 'options' },
        },
      },
      { model: db.Answer, as: 'answersDetail' },
      { model: db.QuizRanking, as: 'ranking', required: false }
    ],
  });

  if (!submission) throw new Error('Không tìm thấy bài thi hoặc thiếu quyền truy cập');
  if (!submission.submittedAt) throw new Error('Bài thi này chưa được nộp');

  const totalQuestions = submission.totalQuestions || submission.quiz.questions.length;
  const score = submission.score || 0;
  const passed = score >= (submission.quiz.passScore || 70);

  const questionResults = submission.quiz.questions.map(question => {
    const studentAnswer = submission.answersDetail.find(a => a.questionId === question.id);
    let isCorrect = studentAnswer?.isCorrect || false;
    let studentSelectedOptionId = studentAnswer?.selectedAnswer || null;

    let optionsArray = (question.options || []).map(opt => ({
      id: opt.id,
      text: opt.optionText || opt.content,
      isCorrect: opt.isCorrect,
    }));

    return {
      questionId: question.id,
      questionText: question.text || question.content?.question || 'Câu hỏi',
      questionType: question.type,
      isCorrect,
      studentSelectedOptionId,
      earnedPoints: studentAnswer?.score || 0,
      maxPoints: question.score || 1,
      options: optionsArray,
    };
  });

  return {
    submissionId: submission.id,
    examTitle: submission.quiz.title,
    score: Math.round(score * 10) / 10,
    totalQuestions,
    passed,
    submittedAt: submission.submittedAt,
    questionResults,
    rank: submission.ranking?.rank || null,
  };
}

/**
 * NHẬN DỮ LIỆU TỪ JAVA: LƯU QUIZ + QUESTIONS + OPTIONS
 */
async function syncQuizFromCourseService(data) {
  console.log('[SYNC] Nhận yêu cầu đồng bộ FULL Quiz từ Java:', data.id);
  
  const transaction = await db.sequelize.transaction();

  try {
    // 1. Lưu thông complexity Quiz (bảng exams)
    await db.Quiz.upsert({
      id: data.id,
      title: data.title,
      description: data.description,
      durationMinutes: data.timeLimitMinutes || 60,
      createdBy: data.createdBy || '00000000-0000-0000-0000-000000000000',
      status: data.status || 'DRAFT',
      passScore: 50, 
      totalQuestions: data.questions ? data.questions.length : 0,
    }, { transaction });

    // 2. Lưu Câu hỏi và Đáp án
    if (data.questions && Array.isArray(data.questions)) {
      for (const q of data.questions) {
        
        // --- BỘ CHUYỂN ĐỔI TYPE TỪ JAVA SANG DB ---
        let javaType = q.type ? q.type.toUpperCase() : '';
        let dbQuestionType = 'MULTIPLE_CHOICE'; // Mặc định an toàn
        
        // Ánh xạ các loại của Java sang đúng 4 chữ mà DB cho phép
        if (javaType === 'SINGLE_CHOICE' || javaType === 'MULTIPLE_CHOICE') {
            dbQuestionType = 'MULTIPLE_CHOICE';
        } else if (javaType === 'TRUE_FALSE') {
            dbQuestionType = 'TRUE_FALSE';
        } else if (javaType === 'SHORT_ANSWER') {
            dbQuestionType = 'SHORT_ANSWER';
        } else if (javaType === 'ESSAY') {
            dbQuestionType = 'ESSAY';
        }

        // 2.1. Lưu câu hỏi (bảng questions)
        await db.Question.upsert({
          id: q.id,
          type: dbQuestionType,
          content: q.content,
          text: q.content, 
          difficulty: 1,
          score: 1 
        }, { transaction });

        // 2.2. Lưu quan hệ Quiz - Question (bảng exam_questions)
        await db.ExamQuestion.findOrCreate({
          where: { 
            examId: data.id, 
            questionId: q.id 
          },
          defaults: {
            displayOrder: q.displayOrder || 1
          },
          transaction
        });

        // 2.3. Lưu đáp án (bảng question_options)
        if (q.options && Array.isArray(q.options)) {
          for (const opt of q.options) {
            await db.QuestionOption.findOrCreate({
              where: { id: opt.id }, 
              defaults: {
                questionId: q.id,
                content: opt.content,
                isCorrect: opt.correct 
              },
              transaction
            });
            await db.QuestionOption.update({
                content: opt.content,
                isCorrect: opt.correct 
            }, {
                where: { id: opt.id },
                transaction
            });
          }
        }
      }
    }

    await transaction.commit();
    console.log(`[SYNC] Đồng bộ FULL Quiz ${data.id} thành công!`);
    return { success: true, quizId: data.id };

  } catch (error) {
    await transaction.rollback();
    console.error(`[SYNC ERROR] Lỗi khi đồng bộ Quiz ${data.id}:`, error);
    throw error;
  }
}

module.exports = {
  startQuiz,
  submitQuiz,
  getAllQuizzes,
  getQuizDetails,
  getStudentSubmissions,
  getSubmissionResult,
  syncQuizFromCourseService
};
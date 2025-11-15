// file: src/services/proctoring.monitoring.service.js

const db = require('../models');
const proctoringIntegrationService = require('./proctoring.integration');

const { Op } = db.Sequelize;

const normalizeStudentIdForQuery = (value) => {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  const numericValue = Number(value);
  if (!Number.isNaN(numericValue)) {
    return numericValue;
  }

  return value;
};

const buildSubmissionLookupKey = (quizId, studentId) => `${quizId}::${studentId}`;

async function getActiveProctoredStudents(authHeader) {
  const sessions = await proctoringIntegrationService.getActiveSessions(authHeader);

  if (!Array.isArray(sessions) || sessions.length === 0) {
    return [];
  }

  const examIds = Array.from(
    new Set(
      sessions
        .map(session => session.examId)
        .filter(id => id !== null && id !== undefined)
    )
  );

  const studentIdsOriginal = sessions
    .map(session => session.userId)
    .filter(id => id !== null && id !== undefined);

  const studentIdsForQuery = Array.from(new Set(
    studentIdsOriginal
      .map(normalizeStudentIdForQuery)
      .filter(id => id !== null && id !== undefined)
  ));

  const [quizzes, submissions] = await Promise.all([
    examIds.length > 0
      ? db.Quiz.findAll({
          where: { id: { [Op.in]: examIds } },
          attributes: ['id', 'title', 'status', 'startAt', 'endAt'],
        })
      : Promise.resolve([]),
    examIds.length > 0 && studentIdsForQuery.length > 0
      ? db.QuizSubmission.findAll({
          where: {
            quizId: { [Op.in]: examIds },
            studentId: { [Op.in]: studentIdsForQuery },
            submittedAt: { [Op.is]: null },
          },
          attributes: ['id', 'quizId', 'studentId', 'startedAt', 'timeSpentSeconds', 'submittedAt'],
        })
      : Promise.resolve([]),
  ]);

  const quizMap = new Map(quizzes.map(quiz => [quiz.id, quiz]));
  const submissionMap = new Map(
    submissions.map(submission => [
      buildSubmissionLookupKey(submission.quizId, String(submission.studentId)),
      submission,
    ])
  );

  const now = Date.now();

  return sessions.map(session => {
    const quiz = quizMap.get(session.examId) || null;
    const hasStudentKey = session.examId && session.userId !== null && session.userId !== undefined;
    const studentKey = hasStudentKey
      ? buildSubmissionLookupKey(session.examId, String(session.userId))
      : null;
    const submission = studentKey ? submissionMap.get(studentKey) || null : null;

    const startedAt = submission?.startedAt || session.startTime || null;

    let calculatedTimeSpent = null;
    if (startedAt) {
      const startedTimeValue = new Date(startedAt).getTime();
      if (!Number.isNaN(startedTimeValue)) {
        calculatedTimeSpent = Math.max(0, Math.floor((now - startedTimeValue) / 1000));
      }
    }

    return {
      sessionId: session.id,
      sessionStatus: session.status,
      studentId: session.userId,
      examId: session.examId,
      examTitle: quiz?.title || null,
      examStatus: quiz?.status || null,
      examStartAt: quiz?.startAt || null,
      examEndAt: quiz?.endAt || null,
      submissionId: submission?.id || null,
      startedAt,
      timeSpentSeconds: submission?.timeSpentSeconds ?? calculatedTimeSpent,
      lastUpdatedAt: session.updatedAt || session.updated_at || null,
    };
  });
}

module.exports = {
  getActiveProctoredStudents,
};


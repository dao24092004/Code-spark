const gradingService = require('../services/grading.service');
const quizService = require('../services/quiz.service');
async function gradeAnswer(req, res) {
  try {
    const { answerId } = req.params;
    const { score, comment } = req.body;
    const updatedSubmission = await gradingService.manualGrade(answerId, score, comment);
    res.status(200).json({ success: true, data: updatedSubmission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}
async function syncQuiz(req, res) {
  try {
    const quizData = req.body; // Lấy body JSON từ Java gửi sang
    const syncedQuiz = await quizService.syncQuizFromCourseService(quizData);
    res.status(200).json({ success: true, data: syncedQuiz });
  } catch (error) {
    console.error('[SYNC ERROR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
}
module.exports = { gradeAnswer, syncQuiz };
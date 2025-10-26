const gradingService = require('../services/grading.service');

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
module.exports = { gradeAnswer };
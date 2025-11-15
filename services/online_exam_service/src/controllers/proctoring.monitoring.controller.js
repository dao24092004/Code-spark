// file: src/controllers/proctoring.monitoring.controller.js

const proctoringMonitoringService = require('../services/proctoring.monitoring.service');

async function getActiveProctoredStudents(req, res) {
  try {
    const authHeader = req.headers['authorization'];
    const activeStudents = await proctoringMonitoringService.getActiveProctoredStudents(authHeader);

    res.status(200).json({
      success: true,
      data: activeStudents,
    });
  } catch (error) {
    console.error('[ProctoringMonitoringController] Lỗi khi lấy danh sách sinh viên đang được giám sát:', error);

    res.status(500).json({
      success: false,
      message: error?.message || 'Không thể lấy danh sách sinh viên đang được giám sát.',
    });
  }
}

module.exports = {
  getActiveProctoredStudents,
};


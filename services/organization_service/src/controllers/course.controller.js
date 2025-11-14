const { Course } = require('../models');
const { Op } = require('sequelize');

exports.getCoursesByOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;
    const { status } = req.query;
    
    const where = { organization_id: orgId };
    if (status) where.status = status;

    const courses = await Course.findAll({ 
      where,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách khóa học:', error);
    res.status(500).json({
      success: false,
      message: 'Đã xảy ra lỗi khi lấy danh sách khóa học'
    });
  }
};
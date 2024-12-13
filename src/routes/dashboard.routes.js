const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats/student', protect, dashboardController.getStudentStats);
router.get('/stats/teacher', protect, dashboardController.getTeacherStats);
router.get('/stats/admin', protect, dashboardController.getAdminStats);
router.get('/course/:courseId/details', protect, dashboardController.getCourseDetails);

module.exports = router;
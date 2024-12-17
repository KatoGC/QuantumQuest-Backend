const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const ratingController = require('../controllers/ratingController');

router.post('/courses/:courseId/rate', protect, ratingController.rateCourse);
router.get('/courses/:courseId/ratings', ratingController.getCourseRating);

module.exports = router;
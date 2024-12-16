const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const progressController = require("../controllers/progressController");

router.get("/progress/stats", protect, progressController.getStudentStats);
router.get("/progress/courses", protect, progressController.getAllCoursesProgress);
router.get("/courses/:courseId/progress", protect, progressController.getCourseProgress);
router.post("/courses/:courseId/lessons/:lessonId/complete", protect, progressController.updateLessonProgress);

module.exports = router;
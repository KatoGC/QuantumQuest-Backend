const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const progressController = require("../controllers/progressController");

// Rutas para estadísticas y progreso general
router.get("/progress/stats", protect, progressController.getStudentStats);
router.get(
    "/progress/courses",
    protect,
    progressController.getAllCoursesProgress
);

// Rutas para progreso específico de cursos y lecciones
router.get(
    "/courses/:courseId/progress",
    protect,
    progressController.getCourseProgress
);
router.post(
    "/courses/:courseId/lessons/:lessonId/progress",
    protect,
    progressController.updateLessonProgress
);

router.get(
    "/courses/:courseId/progress",
    protect,
    progressController.getCourseProgress
);
module.exports = router;

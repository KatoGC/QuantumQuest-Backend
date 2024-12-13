const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");
const { checkCourseOwnership } = require("../middleware/courseAuth");

// Rutas públicas
router.get("/", courseController.getAllCourses);
router.get("/:id", courseController.getCourse);

// Rutas protegidas
router.post(
    "/",
    protect,
    authorize("teacher", "admin"),
    courseController.createCourse
);
router.put(
    "/:id",
    protect,
    authorize("teacher", "admin"),
    courseController.updateCourse
);
router.delete(
    "/:id",
    protect,
    authorize("teacher", "admin"),
    courseController.deleteCourse
);
router.post(
    "/:id/enroll",
    protect,
    authorize("student"),
    courseController.enrollCourse
);
router.put(
    "/:id",
    protect,
    authorize("teacher", "admin"),
    checkCourseOwnership,
    courseController.updateCourse
);


module.exports = router;

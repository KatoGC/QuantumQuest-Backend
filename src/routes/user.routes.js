const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect } = require("../middleware/auth");

router.get("/:id/enrolled-courses", protect, userController.getEnrolledCourses);
router.put('/profile', protect, userController.updateProfile);

module.exports = router;

const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
    createReview,
    getCourseReviews,
    updateReview,
    deleteReview,
} = require("../controllers/reviewController");

// Rutas para reviews de cursos
router.post("/courses/:courseId/reviews", protect, createReview);
router.get("/courses/:courseId/reviews", getCourseReviews);
router.put("/reviews/:reviewId", protect, updateReview);
router.delete("/reviews/:reviewId", protect, deleteReview);

module.exports = router;

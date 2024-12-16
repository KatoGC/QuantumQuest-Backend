const express = require("express");
const router = express.Router();
const commentController = require("../controllers/commentController");
const { protect } = require("../middleware/auth");

router.get("/courses/:courseId/comments", protect, commentController.getComments);
router.post("/courses/:courseId/comments", protect, commentController.createComment);

module.exports = router;
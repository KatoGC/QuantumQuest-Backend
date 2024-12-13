const express = require("express");
const router = express.Router();
const {
    register,
    login,
    getMe,
    verifyEmail,
    resendVerification,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/verify-email/:token", verifyEmail);
router.post("/resend-verification", resendVerification);
router.get("/me", protect, getMe);

module.exports = router;

import express from "express";
import rateLimit from "express-rate-limit";

import {
  signup,
  login,
  getMe,
  updateProfile,
  changePassword,
} from "../controllers/authController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import uploadProfile from "../middleware/uploadProfile.js";

const router = express.Router();

// =====================================================
// AUTH RATE LIMITERS
// =====================================================
//
// These limit only authentication-related requests.
// They do NOT affect songs, audio playback, covers,
// artists, albums, or playlists.
//

const signupLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many signup attempts. Please try again later.",
  },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 10,

  // Successful logins should not count toward the limit.
  skipSuccessfulRequests: true,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  message: {
    success: false,
    message: "Too many failed login attempts. Please try again later.",
  },
});

const passwordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many password change attempts. Please try again later.",
  },
});

// =====================================================
// PUBLIC AUTH
// =====================================================

// POST /api/auth/signup
router.post(
  "/signup",
  signupLimiter,
  (req, res, next) => {
    console.log("🔥 SIGNUP ROUTE HIT");
    console.log("SIGNUP BODY:", req.body);
    next();
  },
  signup
);

// POST /api/auth/login
router.post(
  "/login",
  loginLimiter,
  (req, res, next) => {
    console.log("AUTH LOGIN ROUTE HIT:", req.method, req.originalUrl);
    next();
  },
  login
);
// =====================================================
// CURRENT USER
// =====================================================

// GET /api/auth/me
router.get(
  "/me",
  authMiddleware,
  getMe
);

// =====================================================
// UPDATE PROFILE
// =====================================================

// PUT /api/auth/profile
// Supports name, email, and profileImage.
router.put(
  "/profile",
  authMiddleware,
  uploadProfile.single("profileImage"),
  uploadProfile.validateProfileImage,
  updateProfile
);

// =====================================================
// CHANGE PASSWORD
// =====================================================

// PUT /api/auth/change-password
router.put(
  "/change-password",
  authMiddleware,
  passwordLimiter,
  changePassword
);

export default router;
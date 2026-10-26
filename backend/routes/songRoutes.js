import express from "express";

import upload from "../middleware/upload.js";
import authMiddleware from "../middleware/authMiddleware.js";
import artistAccess from "../middleware/artistAccess.js";

import {
  createSong,
  getSongs,
  getMySongs,
  getMyArtist,
  getSongById,
  updateSong,
  deleteSong,
  getDashboardStats,
  getArtistAnalytics,
} from "../controllers/songController.js";

const router = express.Router();

// =====================================================
// PUBLIC
// =====================================================

router.get("/", getSongs);

// =====================================================
// ARTIST PROFILE
// =====================================================

router.get(
  "/my/artist",
  authMiddleware,
  artistAccess,
  getMyArtist
);

// =====================================================
// ARTIST SONGS
// =====================================================

router.get(
  "/my",
  authMiddleware,
  artistAccess,
  getMySongs
);

// =====================================================
// ARTIST DASHBOARD
// =====================================================

router.get(
  "/stats/dashboard",
  authMiddleware,
  artistAccess,
  getDashboardStats
);

// =====================================================
// ARTIST ANALYTICS
// =====================================================

router.get(
  "/stats/analytics",
  authMiddleware,
  artistAccess,
  getArtistAnalytics
);

// =====================================================
// CREATE SONG
// =====================================================

router.post(
  "/",
  authMiddleware,
  artistAccess,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
  ]),
  upload.validateUploadedFiles,
  createSong
);

// =====================================================
// GET SINGLE SONG
// =====================================================

router.get(
  "/:id",
  authMiddleware,
  artistAccess,
  getSongById
);

// =====================================================
// UPDATE SONG
// =====================================================

router.put(
  "/:id",
  authMiddleware,
  artistAccess,
  upload.fields([
    { name: "coverImage", maxCount: 1 },
    { name: "audioFile", maxCount: 1 },
  ]),
  updateSong
);

// =====================================================
// DELETE SONG
// =====================================================

router.delete(
  "/:id",
  authMiddleware,
  artistAccess,
  deleteSong
);

export default router;

import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  startListening,
  updateListening,
  getListeningHistory,
  deleteListeningHistoryEntry,
  clearListeningHistory,
} from "../controllers/listeningController.js";

import {
  getMyFavorites,
  addFavorite,
  removeFavorite,
} from "../controllers/favoriteController.js";

import {
  getFollowedArtists,
  followArtist,
  unfollowArtist,
  getFollowStatus,
} from "../controllers/followController.js";

const router = express.Router();

// =====================================================
// LISTENING HISTORY
// Base path: /api/profile
// =====================================================

router.post("/listening/start", authMiddleware, startListening);

router.get("/listening", authMiddleware, getListeningHistory);

router.patch("/listening/:id", authMiddleware, updateListening);

router.delete(
  "/listening/:id",
  authMiddleware,
  deleteListeningHistoryEntry
);

router.delete("/listening", authMiddleware, clearListeningHistory);

// =====================================================
// FAVORITES
// =====================================================

router.get("/favorites", authMiddleware, getMyFavorites);

router.post("/favorites", authMiddleware, addFavorite);

router.delete("/favorites/:songId", authMiddleware, removeFavorite);

// =====================================================
// FOLLOWED ARTISTS
// =====================================================

// Get all artists followed by the logged-in user
router.get("/followed-artists", authMiddleware, getFollowedArtists);

// Follow an artist
router.post(
  "/followed-artists/:artistId",
  authMiddleware,
  followArtist
);

// Unfollow an artist
router.delete(
  "/followed-artists/:artistId",
  authMiddleware,
  unfollowArtist
);

// Check whether the logged-in user follows a particular artist
router.get(
  "/followed-artists/:artistId/status",
  authMiddleware,
  getFollowStatus
);

export default router;

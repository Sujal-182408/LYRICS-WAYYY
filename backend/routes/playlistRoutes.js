
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";

import {
  getMyPlaylists,
  createPlaylist,
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
  addSongToPlaylist,
  removeSongFromPlaylist,
  reorderPlaylist,
} from "../controllers/playlistController.js";

const router = express.Router();

// =====================================================
// PLAYLIST ROUTES
// =====================================================

// Get the logged-in user's playlists
router.get("/", authMiddleware, getMyPlaylists);

// Create a playlist
router.post("/", authMiddleware, createPlaylist);

// Get a playlist by ID
router.get("/:id", authMiddleware, getPlaylistById);

// Update a playlist
router.put("/:id", authMiddleware, updatePlaylist);

// Delete a playlist
router.delete("/:id", authMiddleware, deletePlaylist);

// Add a song to a playlist
router.post("/:id/songs", authMiddleware, addSongToPlaylist);

// Remove a song from a playlist
router.delete("/:id/songs/:songId", authMiddleware, removeSongFromPlaylist);

// Reorder playlist songs
router.put("/:id/songs/reorder", authMiddleware, reorderPlaylist);

export default router;

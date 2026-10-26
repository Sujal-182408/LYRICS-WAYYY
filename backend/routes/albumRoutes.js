import express from "express";

import uploadAlbum from "../middleware/uploadAlbum.js";
import authMiddleware from "../middleware/authMiddleware.js";
import artistAccess from "../middleware/artistAccess.js";

import {
  createAlbum,
  getAlbums,
  getMyAlbums,
  getAlbumById,
  updateAlbum,
  deleteAlbum,
} from "../controllers/albumController.js";

const router = express.Router();

// =====================================================
// PUBLIC
// =====================================================

// Get all albums
router.get("/", getAlbums);

// =====================================================
// ARTIST / ADMIN
// =====================================================

// Get only my albums
router.get(
  "/my",
  authMiddleware,
  artistAccess,
  getMyAlbums
);

// Create album
router.post(
  "/",
  authMiddleware,
  artistAccess,
  uploadAlbum.single("coverImage"),
  createAlbum
);

// Get single album
router.get(
  "/:id",
  authMiddleware,
  artistAccess,
  getAlbumById
);

// Update album
router.put(
  "/:id",
  authMiddleware,
  artistAccess,
  uploadAlbum.single("coverImage"),
  updateAlbum
);

// Delete album
router.delete(
  "/:id",
  authMiddleware,
  artistAccess,
  deleteAlbum
);

export default router;
import express from "express";

import {
  createCollection,
  getCollections,
  getMyCollections,
  getCollectionById,
  getAvailableSongsForCollection,
  updateCollection,
  deleteCollection,
  addSongToCollection,
  removeSongFromCollection,
} from "../controllers/collectionController.js";

import authMiddleware from "../middleware/authMiddleware.js";
import artistAccess from "../middleware/artistAccess.js";

const router = express.Router();

/* =====================================================
   GET ALL PUBLIC COLLECTIONS
===================================================== */

router.get("/", getCollections);

/* =====================================================
   GET MY COLLECTIONS
   ARTIST / ADMIN ONLY

   IMPORTANT:
   Must be before /:id
===================================================== */

router.get(
  "/my",
  authMiddleware,
  artistAccess,
  getMyCollections
);

/* =====================================================
   CREATE COLLECTION
   ARTIST / ADMIN ONLY
===================================================== */

router.post(
  "/",
  authMiddleware,
  artistAccess,
  createCollection
);

/* =====================================================
   GET AVAILABLE SONGS
   OWNER ONLY

   IMPORTANT:
   Must be before /:id
===================================================== */

router.get(
  "/:collectionId/available-songs",
  authMiddleware,
  artistAccess,
  getAvailableSongsForCollection
);

/* =====================================================
   GET SINGLE COLLECTION
   OWNER ONLY
===================================================== */

router.get(
  "/:id",
  authMiddleware,
  artistAccess,
  getCollectionById
);

/* =====================================================
   UPDATE COLLECTION
   OWNER ONLY
===================================================== */

router.put(
  "/:id",
  authMiddleware,
  artistAccess,
  updateCollection
);

/* =====================================================
   DELETE COLLECTION
   OWNER ONLY
===================================================== */

router.delete(
  "/:id",
  authMiddleware,
  artistAccess,
  deleteCollection
);

/* =====================================================
   ADD SONG TO COLLECTION
   OWNER COLLECTION + OWNER SONG
===================================================== */

router.post(
  "/:collectionId/songs/:songId",
  authMiddleware,
  artistAccess,
  addSongToCollection
);

/* =====================================================
   REMOVE SONG FROM COLLECTION
   OWNER COLLECTION ONLY
===================================================== */

router.delete(
  "/:collectionId/songs/:songId",
  authMiddleware,
  artistAccess,
  removeSongFromCollection
);

export default router;
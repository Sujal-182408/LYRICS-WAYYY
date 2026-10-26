
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import artistAccess from "../middleware/artistAccess.js";
import upload from "../middleware/upload.js";

import {
  getArtists,
  getArtistById,
  getMyArtist,
  updateMyArtist,
} from "../controllers/artistController.js";

import {
  followArtist,
  unfollowArtist,
  getArtistFollowStatus,
} from "../controllers/artistFollowController.js";

const router = express.Router();

// Specific routes must come before the general /:artistId route.
router.get(
  "/:artistId/follow-status",
  authMiddleware,
  getArtistFollowStatus
);

router.post("/:artistId/follow", authMiddleware, followArtist);
router.post("/:artistId/unfollow", authMiddleware, unfollowArtist);

router.get("/me", authMiddleware, artistAccess, getMyArtist);

router.put(
  "/me",
  authMiddleware,
  artistAccess,
  upload.single("image"),
  upload.validateArtistImage,
  updateMyArtist
);

router.get("/", getArtists);

router.get("/:artistId", getArtistById);

export default router;
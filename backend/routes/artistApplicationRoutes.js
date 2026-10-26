
import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import artistApplicationUpload from "../middleware/artistApplicationUpload.js";

import {
  submitArtistApplication,
  getMyArtistApplication,
  getArtistApplicationsForSuperAdmin,
  getArtistApplicationForSuperAdmin,
  reviewArtistApplication,
  streamVerificationSong,
} from "../controllers/artistApplicationController.js";

const router = express.Router();

// =====================================================
// GET MY APPLICATION
// GET /api/artist-applications/my-application
// =====================================================

router.get(
  "/my-application",
  authMiddleware,
  getMyArtistApplication
);

// =====================================================
// SUBMIT APPLICATION
// POST /api/artist-applications
// =====================================================

router.post(
  "/",
  authMiddleware,
  artistApplicationUpload.fields([
    {
      name: "image",
      maxCount: 1,
    },
    {
      name: "verificationSong",
      maxCount: 1,
    },
  ]),
  submitArtistApplication
);

// =====================================================
// GET ARTIST APPLICATIONS FOR SUPERADMIN
// GET /api/artist-applications/superadmin
// =====================================================

router.get(
  "/superadmin",
  authMiddleware,
  getArtistApplicationsForSuperAdmin
);

// =====================================================
// GET ONE ARTIST APPLICATION FOR SUPERADMIN
// GET /api/artist-applications/superadmin/:id
// =====================================================

router.get(
  "/superadmin/:id",
  authMiddleware,
  getArtistApplicationForSuperAdmin
);

// =====================================================
// REVIEW ARTIST APPLICATION
// PATCH /api/artist-applications/superadmin/:id/review
// =====================================================

router.patch(
  "/superadmin/:id/review",
  authMiddleware,
  reviewArtistApplication
);

// =====================================================
// STREAM PRIVATE VERIFICATION SONG
// GET /api/artist-applications/:id/verification-song
// =====================================================

router.get(
  "/:id/verification-song",
  authMiddleware,
  streamVerificationSong
);

export default router;

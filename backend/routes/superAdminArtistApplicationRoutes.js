import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";

import {
  getArtistApplicationsForSuperAdmin,
  getArtistApplicationForSuperAdmin,
  reviewArtistApplication,
  streamVerificationSong,
} from "../controllers/artistApplicationController.js";

const router = express.Router();

// =====================================================
// SUPERADMIN AUTHENTICATION
//
// Every route requires:
// 1. Valid JWT
// 2. Active account
// 3. SuperAdmin role
// =====================================================

router.use(authMiddleware);
router.use(superAdminMiddleware);

// =====================================================
// GET ALL ARTIST APPLICATIONS
// GET /api/superadmin/artist-applications
//
// Optional query:
// ?status=pending
// ?status=approved
// ?status=rejected
// =====================================================

router.get(
  "/",
  getArtistApplicationsForSuperAdmin
);

// =====================================================
// STREAM VERIFICATION SONG
// GET /api/superadmin/artist-applications/song/:id/stream
//
// Keep before /:id.
// Supports HTTP Range requests when implemented by
// the streamVerificationSong controller.
// =====================================================

router.get(
  "/song/:id/stream",
  streamVerificationSong
);

// =====================================================
// GET SINGLE ARTIST APPLICATION
// GET /api/superadmin/artist-applications/:id
// =====================================================

router.get(
  "/:id",
  getArtistApplicationForSuperAdmin
);

// =====================================================
// APPROVE / REJECT ARTIST APPLICATION
// PATCH /api/superadmin/artist-applications/:id/review
//
// Approve body:
// {
//   "action": "approve",
//   "admin_note": "Verification completed successfully."
// }
//
// Reject body:
// {
//   "action": "reject",
//   "admin_note": "Verification song could not be verified."
// }
// =====================================================

router.patch(
  "/:id/review",
  reviewArtistApplication
);

export default router;
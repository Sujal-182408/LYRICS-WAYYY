import express from "express";
import mongoose from "mongoose";

import authMiddleware from "../middleware/authMiddleware.js";
import superAdminMiddleware from "../middleware/superAdminMiddleware.js";

import {
  getDashboardStats,
} from "../controllers/superadminController.js";

import {
  getArtistApplicationsForSuperAdmin,
  getArtistApplicationForSuperAdmin,
  reviewArtistApplication,
  streamVerificationSong,
} from "../controllers/artistApplicationController.js";

import User from "../models/User.js";

const router = express.Router();

/*
|--------------------------------------------------------------------------
| CONSTANTS
|--------------------------------------------------------------------------
*/

const ALLOWED_ROLES = new Set([
  "user",
  "artist",
  "superadmin",
]);

const ALLOWED_APPLICATION_STATUSES = new Set([
  "none",
  "pending",
  "approved",
  "rejected",
]);

/*
|--------------------------------------------------------------------------
| SUPERADMIN AUTHORIZATION
|--------------------------------------------------------------------------
*/

const superAdminOnly = [
  authMiddleware,
  superAdminMiddleware,
];

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

const isValidObjectId = (value) => {
  return (
    typeof value === "string" &&
    mongoose.Types.ObjectId.isValid(value)
  );
};

const invalidIdResponse = (res) => {
  return res.status(400).json({
    success: false,
    message: "Invalid resource ID.",
  });
};

const sanitizeUser = (user) => {
  const safeUser =
    typeof user?.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete safeUser.password;
  delete safeUser.passwordHash;
  delete safeUser.tokenVersion;
  delete safeUser.failedLoginAttempts;
  delete safeUser.lockUntil;
  delete safeUser.lastLoginIp;
  delete safeUser.passwordChangedAt;

  return safeUser;
};

/*
|--------------------------------------------------------------------------
| DASHBOARD
|--------------------------------------------------------------------------
| GET /api/superadmin/dashboard-stats
*/

router.get(
  "/dashboard-stats",
  ...superAdminOnly,
  getDashboardStats
);

/*
|--------------------------------------------------------------------------
| ARTIST APPLICATION MANAGEMENT
|--------------------------------------------------------------------------
| GET /api/superadmin/artist-applications
*/

router.get(
  "/artist-applications",
  ...superAdminOnly,
  getArtistApplicationsForSuperAdmin
);

/*
|--------------------------------------------------------------------------
| STREAM VERIFICATION SONG
|--------------------------------------------------------------------------
| GET /api/superadmin/artist-applications/song/:id/stream
|
| Keep this route before /artist-applications/:id.
*/

router.get(
  "/artist-applications/song/:id/stream",
  ...superAdminOnly,
  (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }

    return next();
  },
  streamVerificationSong
);

/*
|--------------------------------------------------------------------------
| GET SINGLE ARTIST APPLICATION
|--------------------------------------------------------------------------
| GET /api/superadmin/artist-applications/:id
*/

router.get(
  "/artist-applications/:id",
  ...superAdminOnly,
  (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }

    return next();
  },
  getArtistApplicationForSuperAdmin
);

/*
|--------------------------------------------------------------------------
| APPROVE / REJECT ARTIST APPLICATION
|--------------------------------------------------------------------------
| PATCH /api/superadmin/artist-applications/:id/review
*/

router.patch(
  "/artist-applications/:id/review",
  ...superAdminOnly,
  (req, res, next) => {
    if (!isValidObjectId(req.params.id)) {
      return invalidIdResponse(res);
    }

    return next();
  },
  reviewArtistApplication
);

/*
|--------------------------------------------------------------------------
| USER ROLE MANAGEMENT
|--------------------------------------------------------------------------
| PATCH /api/superadmin/users/:id/role
*/

router.patch(
  "/users/:id/role",
  ...superAdminOnly,
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return invalidIdResponse(res);
      }

      if (
        !req.body ||
        typeof req.body !== "object" ||
        Array.isArray(req.body)
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid request body.",
        });
      }

      const hasRole = Object.prototype.hasOwnProperty.call(
        req.body,
        "role"
      );

      const hasApprovalStatus =
        Object.prototype.hasOwnProperty.call(
          req.body,
          "approvalStatus"
        );

      if (!hasRole && !hasApprovalStatus) {
        return res.status(400).json({
          success: false,
          message: "No valid update was provided.",
        });
      }

      let requestedRole;

      if (hasRole) {
        if (typeof req.body.role !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid role.",
          });
        }

        requestedRole = req.body.role.trim().toLowerCase();

        if (!ALLOWED_ROLES.has(requestedRole)) {
          return res.status(400).json({
            success: false,
            message: "Invalid role.",
          });
        }
      }

      let requestedApprovalStatus;

      if (hasApprovalStatus) {
        if (typeof req.body.approvalStatus !== "string") {
          return res.status(400).json({
            success: false,
            message: "Invalid artist application status.",
          });
        }

        requestedApprovalStatus =
          req.body.approvalStatus.trim().toLowerCase();

        if (
          !ALLOWED_APPLICATION_STATUSES.has(
            requestedApprovalStatus
          )
        ) {
          return res.status(400).json({
            success: false,
            message: "Invalid artist application status.",
          });
        }
      }

      if (hasRole && hasApprovalStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Role changes and artist application review must be performed separately.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const currentAdminId =
        req.authUser?._id?.toString();

      if (
        currentAdminId &&
        user._id.toString() === currentAdminId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot modify your own SuperAdmin account from this endpoint.",
        });
      }

      const currentUserRole = String(user.role || "")
        .trim()
        .toLowerCase();

      if (currentUserRole === "superadmin") {
        return res.status(403).json({
          success: false,
          message:
            "SuperAdmin accounts cannot be modified through this endpoint.",
        });
      }

      if (hasRole) {
        if (requestedRole === "superadmin") {
          return res.status(403).json({
            success: false,
            message:
              "SuperAdmin promotion is not allowed through this endpoint.",
          });
        }

        if (requestedRole === "artist") {
          return res.status(400).json({
            success: false,
            message:
              "Artist promotion must be performed through the artist application review.",
          });
        }

        user.role = requestedRole;
      }

      if (hasApprovalStatus) {
        return res.status(400).json({
          success: false,
          message:
            "Artist application status must be changed through the application review endpoint.",
        });
      }

      await user.save();

      return res.status(200).json({
        success: true,
        message: "User role updated successfully.",
        user: sanitizeUser(user),
      });
    } catch (error) {
      console.error(
        "SUPERADMIN ROLE UPDATE ERROR:",
        error?.message || "Unknown error"
      );

      return res.status(500).json({
        success: false,
        message: "Failed to update user role.",
      });
    }
  }
);

/*
|--------------------------------------------------------------------------
| DELETE USER
|--------------------------------------------------------------------------
| DELETE /api/superadmin/users/:id
*/

router.delete(
  "/users/:id",
  ...superAdminOnly,
  async (req, res) => {
    try {
      if (!isValidObjectId(req.params.id)) {
        return invalidIdResponse(res);
      }

      const currentAdminId =
        req.authUser?._id?.toString();

      if (
        currentAdminId &&
        req.params.id === currentAdminId
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You cannot delete your own SuperAdmin account.",
        });
      }

      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const role = String(user.role || "")
        .trim()
        .toLowerCase();

      if (role === "superadmin") {
        return res.status(403).json({
          success: false,
          message:
            "SuperAdmin accounts cannot be deleted from this endpoint.",
        });
      }

      await User.deleteOne({
        _id: user._id,
      });

      return res.status(200).json({
        success: true,
        message: "User removed successfully.",
      });
    } catch (error) {
      console.error(
        "SUPERADMIN USER DELETE ERROR:",
        error?.message || "Unknown error"
      );

      return res.status(500).json({
        success: false,
        message: "Failed to delete user.",
      });
    }
  }
);

export default router;
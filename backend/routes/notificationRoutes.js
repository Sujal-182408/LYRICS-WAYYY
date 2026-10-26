import express from "express";

import authMiddleware from "../middleware/authMiddleware.js";

import {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../controllers/notificationController.js";

const router = express.Router();

/* =====================================================
   GET MY NOTIFICATIONS
===================================================== */

router.get(
  "/",
  authMiddleware,
  getMyNotifications
);

/* =====================================================
   GET UNREAD COUNT
===================================================== */

router.get(
  "/unread-count",
  authMiddleware,
  getUnreadCount
);

/* =====================================================
   MARK ONE NOTIFICATION AS READ
===================================================== */

router.patch(
  "/:id/read",
  authMiddleware,
  markAsRead
);

/* =====================================================
   MARK ALL NOTIFICATIONS AS READ
===================================================== */

router.patch(
  "/read-all",
  authMiddleware,
  markAllAsRead
);

/* =====================================================
   DELETE ONE NOTIFICATION
===================================================== */

router.delete(
  "/:id",
  authMiddleware,
  deleteNotification
);

/* =====================================================
   DELETE ALL NOTIFICATIONS
===================================================== */

router.delete(
  "/",
  authMiddleware,
  deleteAllNotifications
);

export default router;

import Notification from "../models/Notification.js";

// =====================================================
// GET USER ID
// =====================================================

const getUserId = (req) => {
  return req.user?.id || req.user?._id || req.user?.userId;
};

// =====================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// =====================================================

export const getMyNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      console.log("[Notifications] GET /api/notifications started");
    }

    const page = Math.max(
      Number.parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        Number.parseInt(req.query.limit, 10) || 20,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {
      user: userId,
    };

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Notification.countDocuments(filter),
    ]);

    const unreadCount = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("getMyNotifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load notifications",
    });
  }
};

// =====================================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// =====================================================

export const getUnreadCount = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const count = await Notification.countDocuments({
      user: userId,
      read: false,
    });

    return res.status(200).json({
      success: true,
      count,
      unreadCount: count,
    });
  } catch (error) {
    console.error("getUnreadCount error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get unread notification count",
    });
  }
};

// =====================================================
// MARK ONE AS READ
// PATCH /api/notifications/:id/read
// =====================================================

export const markAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notification = await Notification.findOneAndUpdate(
      {
        _id: notificationId,
        user: userId,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      },
      {
        new: true,
      }
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error("markAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};

// =====================================================
// MARK ALL AS READ
// PATCH /api/notifications/read-all
// =====================================================

export const markAllAsRead = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await Notification.updateMany(
      {
        user: userId,
        read: false,
      },
      {
        $set: {
          read: true,
          readAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "All notifications marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("markAllAsRead error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark all notifications as read",
    });
  }
};

// =====================================================
// DELETE ONE
// DELETE /api/notifications/:id
// =====================================================

export const deleteNotification = async (req, res) => {
  try {
    const userId = getUserId(req);
    const notificationId = req.params.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted",
    });
  } catch (error) {
    console.error("deleteNotification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
    });
  }
};

// =====================================================
// DELETE ALL
// DELETE /api/notifications
// =====================================================

export const deleteAllNotifications = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const result = await Notification.deleteMany({
      user: userId,
    });

    return res.status(200).json({
      success: true,
      message: "All notifications deleted",
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error("deleteAllNotifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notifications",
    });
  }
};


import Notification from "../models/Notification.js";
import User from "../models/User.js";

import {
  emitNotificationToUser,
} from "./notificationSocket.js";

/*
|--------------------------------------------------------------------------
| CREATE NOTIFICATION
|--------------------------------------------------------------------------
| Save the notification first, then deliver it to the recipient's
| private Socket.IO room. MongoDB remains the persistent source of truth.
|--------------------------------------------------------------------------
*/

export const createNotification = async ({
  recipient,
  type = "system",
  title,
  message,
  icon = "bell",
  link = "",
  metadata = {},
}) => {
  try {
    if (!recipient) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      type,
      title,
      message,
      icon,
      link,
      metadata,
    });

    // A socket delivery failure must not undo the saved notification.
    try {
      emitNotificationToUser(recipient, notification);
    } catch (socketError) {
      console.error(
        "NOTIFICATION SOCKET DELIVERY ERROR:",
        socketError?.message || socketError
      );
    }

    return notification;
  } catch (error) {
    console.error(
      "CREATE NOTIFICATION ERROR:",
      error?.message || error
    );

    return null;
  }
};

/*
|--------------------------------------------------------------------------
| NOTIFY ALL USERS
|--------------------------------------------------------------------------
| Create persistent notifications for all supported account roles,
| optionally excluding the user who initiated the action.
|--------------------------------------------------------------------------
*/

export const notifyAllUsers = async ({
  type = "system",
  title,
  message,
  icon = "bell",
  link = "",
  metadata = {},
  excludeUser = null,
}) => {
  try {
    const filter = {
      role: {
        $in: ["user", "artist", "admin", "superadmin"],
      },
    };

    if (excludeUser) {
      filter._id = {
        $ne: excludeUser,
      };
    }

    const users = await User.find(filter)
      .select("_id")
      .lean();

    if (!users.length) {
      return [];
    }

    const notifications = users.map((user) => ({
      recipient: user._id,
      type,
      title,
      message,
      icon,
      link,
      metadata,
    }));

    // Persist first so offline users can receive notifications later.
    const savedNotifications =
      await Notification.insertMany(notifications);

    // Deliver each saved notification to its owner's private room.
    for (const notification of savedNotifications) {
      try {
        emitNotificationToUser(
          notification.recipient,
          notification
        );
      } catch (socketError) {
        console.error(
          "NOTIFICATION SOCKET DELIVERY ERROR:",
          socketError?.message || socketError
        );
      }
    }

    return savedNotifications;
  } catch (error) {
    console.error(
      "NOTIFY ALL USERS ERROR:",
      error?.message || error
    );

    return [];
  }
};

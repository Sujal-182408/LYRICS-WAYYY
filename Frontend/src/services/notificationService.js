import axios from "axios";
import { BASE_URL } from "../config/api";

// =====================================================
// CLOUDFLARE API CONFIGURATION
// =====================================================

const API_BASE_URL = String(BASE_URL || "").replace(/\/+$/, "");

if (!API_BASE_URL) {
  throw new Error("BASE_URL is missing in config/api.js");
}

const API_URL = `${API_BASE_URL}/api/notifications`;

const notificationAPI = axios.create({
  baseURL: API_URL,
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// AUTHENTICATION
// =====================================================

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Please sign in to access notifications.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// =====================================================
// ERROR HANDLING
// =====================================================

const handleNotificationError = (error, operation) => {
  if (!error.response) {
    console.error(
      `[Notifications] ${operation} failed`,
      {
        message: error.message,
        code: error.code,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
      }
    );

    if (
      error.code === "ECONNABORTED" ||
      error.code === "ETIMEDOUT"
    ) {
      throw new Error("Notification request timed out.");
    }

    throw new Error(
      "Cannot reach the notification API. Check the Cloudflare Tunnel and backend."
    );
  }

  const status = error.response.status;
  const message = error.response.data?.message;

  if (status === 401) {
    throw new Error(
      message || "Your session has expired. Please sign in again."
    );
  }

  if (status === 403) {
    throw new Error(
      message || "You do not have permission to access notifications."
    );
  }

  throw new Error(
    message || `Notification API error (${status}).`
  );
};

// =====================================================
// REQUEST WRAPPER
// =====================================================

const executeRequest = async (request, operation) => {
  try {
    const response = await request();
    return response.data;
  } catch (error) {
    handleNotificationError(error, operation);
  }
};

// =====================================================
// GET NOTIFICATIONS
// GET /api/notifications
// =====================================================

export const getNotifications = () =>
  executeRequest(
    () => notificationAPI.get("/", getAuthConfig()),
    "Fetch notifications"
  );

// =====================================================
// GET UNREAD COUNT
// GET /api/notifications/unread-count
// =====================================================

export const getUnreadCount = () =>
  executeRequest(
    () =>
      notificationAPI.get(
        "/unread-count",
        getAuthConfig()
      ),
    "Fetch unread count"
  );

// =====================================================
// MARK ONE NOTIFICATION AS READ
// PATCH /api/notifications/:id/read
// =====================================================

export const markNotificationAsRead = (id) => {
  if (!id) {
    return Promise.reject(
      new Error("Notification ID is required.")
    );
  }

  return executeRequest(
    () =>
      notificationAPI.patch(
        `/${encodeURIComponent(id)}/read`,
        {},
        getAuthConfig()
      ),
    "Mark notification as read"
  );
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// PATCH /api/notifications/read-all
// =====================================================

export const markAllNotificationsAsRead = () =>
  executeRequest(
    () =>
      notificationAPI.patch(
        "/read-all",
        {},
        getAuthConfig()
      ),
    "Mark all notifications as read"
  );

// =====================================================
// DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================

export const deleteNotification = (id) => {
  if (!id) {
    return Promise.reject(
      new Error("Notification ID is required.")
    );
  }

  return executeRequest(
    () =>
      notificationAPI.delete(
        `/${encodeURIComponent(id)}`,
        getAuthConfig()
      ),
    "Delete notification"
  );
};

// =====================================================
// DELETE ALL NOTIFICATIONS
// DELETE /api/notifications
// =====================================================

export const deleteAllNotifications = () =>
  executeRequest(
    () => notificationAPI.delete("/", getAuthConfig()),
    "Delete all notifications"
  );
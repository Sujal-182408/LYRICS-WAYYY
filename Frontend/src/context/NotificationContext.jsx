
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io } from "socket.io-client";

import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from "../services/notificationService";

import { BASE_URL } from "../config/api";

const NotificationContext = createContext(null);

const POLLING_INTERVAL = 60 * 1000;
const INITIAL_FETCH_DELAY = 300;

const getNotificationId = (notification) =>
  notification?._id || notification?.id || null;

const normalizeNotification = (notification) => ({
  ...notification,
  read: Boolean(notification?.read),
});

const mergeNotifications = (existing, incoming) => {
  const byId = new Map();

  [...existing, ...incoming].forEach((notification) => {
    const id = getNotificationId(notification);

    if (id) {
      byId.set(id, normalizeNotification(notification));
    }
  });

  return [...byId.values()].sort(
    (a, b) =>
      new Date(b.createdAt || 0).getTime() -
      new Date(a.createdAt || 0).getTime()
  );
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const mountedRef = useRef(false);
  const authenticatedRef = useRef(false);
  const requestInProgressRef = useRef(false);
  const refreshQueuedRef = useRef(false);

  const intervalRef = useRef(null);
  const initialFetchTimerRef = useRef(null);
  const socketRef = useRef(null);

  // Prevent duplicate socket events.
  const receivedEventIdsRef = useRef(new Set());

  // Track the latest notification list for event deduplication.
  const notificationsRef = useRef([]);
  const unreadCountRef = useRef(0);

  const hasValidToken = useCallback(() => {
    const token = localStorage.getItem("token");

    return Boolean(
      token &&
        token !== "[object Object]" &&
        token !== "undefined" &&
        token !== "null"
    );
  }, []);

  const updateNotifications = useCallback((updater) => {
    setNotifications((previous) => {
      const next =
        typeof updater === "function" ? updater(previous) : updater;

      notificationsRef.current = next;
      return next;
    });
  }, []);

  const updateUnreadCount = useCallback((updater) => {
    setUnreadCount((previous) => {
      const next =
        typeof updater === "function" ? updater(previous) : updater;

      unreadCountRef.current = next;
      return next;
    });
  }, []);

  const resetNotifications = useCallback(() => {
    notificationsRef.current = [];
    unreadCountRef.current = 0;

    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }, []);

  // =====================================================
  // STOP POLLING — declared before refreshNotifications
  // =====================================================

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (initialFetchTimerRef.current) {
      clearTimeout(initialFetchTimerRef.current);
      initialFetchTimerRef.current = null;
    }
  }, []);

  // =====================================================
  // DISCONNECT SOCKET — declared before refreshNotifications
  // =====================================================

  const disconnectSocket = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    if (mountedRef.current) {
      setSocketConnected(false);
    }
  }, []);

  // =====================================================
  // FETCH / SYNC NOTIFICATIONS
  // =====================================================

  const refreshNotifications = useCallback(
    async ({ silent = false } = {}) => {
      if (!hasValidToken()) {
        authenticatedRef.current = false;
        resetNotifications();
        return;
      }

      authenticatedRef.current = true;

      // Queue a follow-up refresh instead of losing refresh requests.
      if (requestInProgressRef.current) {
        refreshQueuedRef.current = true;
        return;
      }

      requestInProgressRef.current = true;

      if (!silent && mountedRef.current) {
        setLoading(true);
      }

      try {
        const data = await getNotifications();

        if (!mountedRef.current) return;

        // Never retain one user's data after logout.
        if (!hasValidToken()) {
          authenticatedRef.current = false;
          resetNotifications();
          return;
        }

        if (data?.success) {
          const list = Array.isArray(data.notifications)
            ? data.notifications.map(normalizeNotification)
            : [];

          notificationsRef.current = list;
          updateNotifications(list);

          const count =
            typeof data.unreadCount === "number"
              ? Math.max(0, data.unreadCount)
              : list.filter((item) => !item.read).length;

          unreadCountRef.current = count;
          updateUnreadCount(count);

          // Remember IDs already delivered by REST.
          list.forEach((item) => {
            const id = getNotificationId(item);
            if (id) receivedEventIdsRef.current.add(id);
          });

          // Keep the event cache bounded.
          while (receivedEventIdsRef.current.size > 500) {
            const oldestId =
              receivedEventIdsRef.current.values().next().value;
            receivedEventIdsRef.current.delete(oldestId);
          }
        }
      } catch (error) {
        if (error?.response?.status === 401) {
          authenticatedRef.current = false;
          resetNotifications();
          disconnectSocket();
          stopPolling();
          return;
        }

        console.error("NOTIFICATION FETCH ERROR:", error);
      } finally {
        requestInProgressRef.current = false;

        if (mountedRef.current && !silent) {
          setLoading(false);
        }

        if (refreshQueuedRef.current && mountedRef.current) {
          refreshQueuedRef.current = false;

          // Run the queued refresh after this request has settled.
          queueMicrotask(() => {
            if (mountedRef.current && hasValidToken()) {
              refreshNotifications({ silent: true });
            }
          });
        }
      }
    },
    [
      hasValidToken,
      resetNotifications,
      disconnectSocket,
      stopPolling,
      updateNotifications,
      updateUnreadCount,
    ]
  );

  // =====================================================
  // SOCKET CONNECTION
  // =====================================================

  const connectSocket = useCallback(() => {
    if (!hasValidToken()) return;

    const token = localStorage.getItem("token");

    if (socketRef.current) {
      if (socketRef.current.connected) return;

      socketRef.current.auth = { token };
      socketRef.current.connect();
      return;
    }

    const socket = io(BASE_URL, {
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      if (!mountedRef.current) return;

      setSocketConnected(true);
      refreshNotifications({ silent: true });
    });

    socket.on("disconnect", () => {
      if (mountedRef.current) {
        setSocketConnected(false);
      }
    });

    socket.on("connect_error", (error) => {
      if (mountedRef.current) {
        setSocketConnected(false);
      }

      console.warn(
        "Notification socket connection error:",
        error?.message || error
      );
    });

    socket.on("notification:new", (payload) => {
      if (!mountedRef.current || !hasValidToken()) return;

      const incoming = payload?.notification || payload;

      if (!incoming || !(incoming._id || incoming.id)) {
        refreshNotifications({ silent: true });
        return;
      }

      const eventId = getNotificationId(incoming);

      if (receivedEventIdsRef.current.has(eventId)) return;

      receivedEventIdsRef.current.add(eventId);

      while (receivedEventIdsRef.current.size > 500) {
        const oldestId =
          receivedEventIdsRef.current.values().next().value;
        receivedEventIdsRef.current.delete(oldestId);
      }

      const notification = normalizeNotification(incoming);

      // The ref prevents duplicate insertion and unread increments.
      const alreadyExists = notificationsRef.current.some(
        (item) => getNotificationId(item) === eventId
      );

      if (alreadyExists) {
        refreshNotifications({ silent: true });
        return;
      }

      const next = mergeNotifications(
        notificationsRef.current,
        [notification]
      );

      notificationsRef.current = next;
      updateNotifications(next);

      if (!notification.read) {
        const nextUnreadCount = unreadCountRef.current + 1;
        unreadCountRef.current = nextUnreadCount;
        updateUnreadCount(nextUnreadCount);
      }
    });

    socket.on("notification:updated", () => {
      refreshNotifications({ silent: true });
    });

    socket.on("notification:deleted", (payload = {}) => {
      if (!mountedRef.current) return;

      const notificationId = payload.notificationId;

      if (!notificationId) {
        refreshNotifications({ silent: true });
        return;
      }

      const existing = notificationsRef.current.find(
        (item) => getNotificationId(item) === notificationId
      );

      const next = notificationsRef.current.filter(
        (item) => getNotificationId(item) !== notificationId
      );

      notificationsRef.current = next;
      updateNotifications(next);

      if (existing && !existing.read) {
        const nextCount = Math.max(0, unreadCountRef.current - 1);
        unreadCountRef.current = nextCount;
        updateUnreadCount(nextCount);
      }
    });
  }, [
    hasValidToken,
    refreshNotifications,
    updateNotifications,
    updateUnreadCount,
  ]);

  // =====================================================
  // POLLING FALLBACK
  // =====================================================

  const startPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      if (!mountedRef.current) return;

      if (!hasValidToken()) {
        authenticatedRef.current = false;
        resetNotifications();
        disconnectSocket();
        stopPolling();
        return;
      }

      if (!socketRef.current?.connected) {
        refreshNotifications({ silent: true });
      }
    }, POLLING_INTERVAL);
  }, [
    disconnectSocket,
    hasValidToken,
    refreshNotifications,
    resetNotifications,
    stopPolling,
  ]);

  // =====================================================
  // AUTHENTICATION CHANGES
  // =====================================================

  const handleAuthenticationChange = useCallback(() => {
    if (!mountedRef.current) return;

    if (!hasValidToken()) {
      authenticatedRef.current = false;
      receivedEventIdsRef.current.clear();
      stopPolling();
      disconnectSocket();
      resetNotifications();
      return;
    }

    if (
      authenticatedRef.current &&
      (intervalRef.current || initialFetchTimerRef.current)
    ) {
      const token = localStorage.getItem("token");

      if (socketRef.current) {
        socketRef.current.auth = { token };

        if (socketRef.current.connected) {
          socketRef.current.disconnect();
        }

        socketRef.current.connect();
      } else {
        connectSocket();
      }

      refreshNotifications({ silent: true });
      return;
    }

    authenticatedRef.current = true;

    if (initialFetchTimerRef.current) {
      clearTimeout(initialFetchTimerRef.current);
    }

    initialFetchTimerRef.current = setTimeout(() => {
      initialFetchTimerRef.current = null;

      if (!mountedRef.current || !hasValidToken()) return;

      refreshNotifications();
      connectSocket();
      startPolling();
    }, INITIAL_FETCH_DELAY);
  }, [
    connectSocket,
    disconnectSocket,
    hasValidToken,
    refreshNotifications,
    resetNotifications,
    startPolling,
    stopPolling,
  ]);

  // =====================================================
  // INITIALIZATION / CLEANUP
  // =====================================================

  useEffect(() => {
    mountedRef.current = true;
    handleAuthenticationChange();

    const onAuthChanged = () => handleAuthenticationChange();

    const onStorage = (event) => {
      if (event.key === "token" || event.key === null) {
        handleAuthenticationChange();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") return;

      if (hasValidToken()) {
        refreshNotifications({ silent: true });

        if (!socketRef.current) {
          connectSocket();
        } else if (!socketRef.current.connected) {
          socketRef.current.connect();
        }
      } else {
        handleAuthenticationChange();
      }
    };

    window.addEventListener("auth-changed", onAuthChanged);
    window.addEventListener("storage", onStorage);

    document.addEventListener(
      "visibilitychange",
      onVisibilityChange
    );

    return () => {
      mountedRef.current = false;

      window.removeEventListener("auth-changed", onAuthChanged);
      window.removeEventListener("storage", onStorage);

      document.removeEventListener(
        "visibilitychange",
        onVisibilityChange
      );

      stopPolling();

      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }

      requestInProgressRef.current = false;
      refreshQueuedRef.current = false;
    };
  }, [
    connectSocket,
    handleAuthenticationChange,
    hasValidToken,
    refreshNotifications,
    stopPolling,
  ]);

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markAsRead = useCallback(
    async (id) => {
      if (!id) return;

      if (!hasValidToken()) {
        resetNotifications();
        return;
      }

      const existing = notificationsRef.current.find(
        (item) => getNotificationId(item) === id
      );

      if (!existing || existing.read) return;

      try {
        await markNotificationAsRead(id);

        if (!mountedRef.current) return;

        const next = notificationsRef.current.map((item) =>
          getNotificationId(item) === id
            ? {
                ...item,
                read: true,
                readAt: new Date().toISOString(),
              }
            : item
        );

        notificationsRef.current = next;
        updateNotifications(next);

        if (!existing.read) {
          const nextCount = Math.max(0, unreadCountRef.current - 1);
          unreadCountRef.current = nextCount;
          updateUnreadCount(nextCount);
        }
      } catch (error) {
        console.error("MARK READ ERROR:", error);

        if (error?.response?.status === 401) {
          handleAuthenticationChange();
        }
      }
    },
    [
      hasValidToken,
      resetNotifications,
      updateNotifications,
      updateUnreadCount,
      handleAuthenticationChange,
    ]
  );

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = useCallback(async () => {
    if (!hasValidToken()) {
      resetNotifications();
      return;
    }

    if (unreadCountRef.current === 0) return;

    try {
      await markAllNotificationsAsRead();

      if (!mountedRef.current) return;

      const now = new Date().toISOString();

      const next = notificationsRef.current.map((item) => ({
        ...item,
        read: true,
        readAt: item.readAt || now,
      }));

      notificationsRef.current = next;
      updateNotifications(next);
      unreadCountRef.current = 0;
      updateUnreadCount(0);
    } catch (error) {
      console.error("MARK ALL READ ERROR:", error);

      if (error?.response?.status === 401) {
        handleAuthenticationChange();
      }
    }
  }, [
    hasValidToken,
    resetNotifications,
    updateNotifications,
    updateUnreadCount,
    handleAuthenticationChange,
  ]);

  // =====================================================
  // DELETE ONE
  // =====================================================

  const removeNotification = useCallback(
    async (id) => {
      if (!id) return;

      if (!hasValidToken()) {
        resetNotifications();
        return;
      }

      const existing = notificationsRef.current.find(
        (item) => getNotificationId(item) === id
      );

      try {
        await deleteNotification(id);

        if (!mountedRef.current) return;

        const next = notificationsRef.current.filter(
          (item) => getNotificationId(item) !== id
        );

        notificationsRef.current = next;
        updateNotifications(next);

        if (existing && !existing.read) {
          const nextCount = Math.max(0, unreadCountRef.current - 1);
          unreadCountRef.current = nextCount;
          updateUnreadCount(nextCount);
        }
      } catch (error) {
        console.error("DELETE NOTIFICATION ERROR:", error);

        if (error?.response?.status === 401) {
          handleAuthenticationChange();
        }
      }
    },
    [
      hasValidToken,
      resetNotifications,
      updateNotifications,
      updateUnreadCount,
      handleAuthenticationChange,
    ]
  );

  // =====================================================
  // DELETE ALL
  // =====================================================

  const clearAll = useCallback(async () => {
    if (!hasValidToken()) {
      resetNotifications();
      return;
    }

    if (notificationsRef.current.length === 0) return;

    try {
      await deleteAllNotifications();

      if (!mountedRef.current) return;

      notificationsRef.current = [];
      unreadCountRef.current = 0;

      updateNotifications([]);
      updateUnreadCount(0);
    } catch (error) {
      console.error("CLEAR NOTIFICATIONS ERROR:", error);

      if (error?.response?.status === 401) {
        handleAuthenticationChange();
      }
    }
  }, [
    hasValidToken,
    resetNotifications,
    updateNotifications,
    updateUnreadCount,
    handleAuthenticationChange,
  ]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        socketConnected,
        refreshNotifications,
        markAsRead,
        markAllAsRead,
        removeNotification,
        clearAll,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error(
      "useNotifications must be used inside NotificationProvider"
    );
  }

  return context;
};

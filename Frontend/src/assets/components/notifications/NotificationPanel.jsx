
import {
  Bell,
  Music2,
  Disc3,
  Folder,
  UserCheck,
  ShieldCheck,
  UserRound,
  Settings,
  Megaphone,
  CheckCheck,
  Trash2,
  X,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useNotifications } from "../../../context/NotificationContext";

const ICONS = {
  song: Music2,
  album: Disc3,
  collection: Folder,
  artist: UserCheck,
  profile: UserRound,
  security: ShieldCheck,
  system: Settings,
  announcement: Megaphone,
};

const NotificationPanel = ({ onClose }) => {
  const navigate = useNavigate();

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  // =====================================================
  // NOTIFICATION CLICK
  // =====================================================

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification) return;

      if (!notification.read) {
        await markAsRead(notification._id);
      }

      if (notification.link) {
        navigate(notification.link);
        onClose?.();
      }
    } catch (error) {
      console.error("NOTIFICATION CLICK ERROR:", error);
    }
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (date) => {
    if (!date) return "";

    const now = new Date();
    const created = new Date(date);

    if (Number.isNaN(created.getTime())) return "";

    const diff = Math.floor(
      (now.getTime() - created.getTime()) / 1000
    );

    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;

    return created.toLocaleDateString();
  };

  // =====================================================
  // DELETE NOTIFICATION
  // =====================================================

  const handleDelete = async (event, id) => {
    event.stopPropagation();

    try {
      await removeNotification(id);
    } catch (error) {
      console.error("DELETE NOTIFICATION ERROR:", error);
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const handleMarkAll = async () => {
    if (unreadCount === 0) return;

    try {
      await markAllAsRead();
    } catch (error) {
      console.error("MARK ALL AS READ ERROR:", error);
    }
  };

  // =====================================================
  // CLEAR ALL NOTIFICATIONS
  // =====================================================

  const handleClearAll = async () => {
    if (notifications.length === 0) return;

    try {
      await clearAll();
    } catch (error) {
      console.error("CLEAR NOTIFICATIONS ERROR:", error);
    }
  };

  return (
    <div
      className="
        fixed
        right-5
        top-19
        z-[10000]
        w-[390px]
        max-w-[calc(100vw-24px)]
      "
    >
      {/* =================================================
          MAIN PANEL
      ================================================= */}

      <div
        className="
          overflow-hidden
          rounded-[28px]
          border
          border-[var(--theme-border)]
          bg-[var(--theme-surface)]
          text-[var(--theme-text)]
          shadow-[10px_10px_25px_var(--theme-shadowDark),-10px_-10px_25px_var(--theme-shadowLight)]
        "
      >
        {/* =================================================
            HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            border-b
            border-[var(--theme-border)]
            px-5
            py-4
          "
        >
          <div className="flex min-w-0 items-center gap-3">
            {/* Bell */}
            <div
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-2xl
                border
                border-[var(--theme-border)]
                bg-[var(--theme-surface)]
                shadow-[inset_4px_4px_9px_var(--theme-shadowDark),inset_-4px_-4px_9px_var(--theme-shadowLight)]
              "
            >
              <Bell
                size={19}
                className="text-[var(--theme-primary)]"
              />
            </div>

            {/* Title */}
            <div className="min-w-0">
              <h3
                className="
                  text-[15px]
                  font-bold
                  text-[var(--theme-text)]
                "
              >
                Notifications
              </h3>

              <p
                className="
                  mt-0.5
                  text-[11px]
                  text-[var(--theme-textMuted)]
                "
              >
                {unreadCount > 0
                  ? `${unreadCount} unread`
                  : "You're all caught up"}
              </p>
            </div>
          </div>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            title="Close notifications"
            aria-label="Close notifications"
            className="
              flex
              h-9
              w-9
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              border-[var(--theme-border)]
              bg-[var(--theme-surface)]
              text-[var(--theme-textMuted)]
              shadow-[5px_5px_10px_var(--theme-shadowDark),-4px_-4px_9px_var(--theme-shadowLight)]
              transition-all
              duration-200
              hover:text-[var(--theme-primary)]
              active:shadow-[inset_3px_3px_7px_var(--theme-shadowDark),inset_-3px_-3px_7px_var(--theme-shadowLight)]
            "
          >
            <X size={17} />
          </button>
        </div>

        {/* =================================================
            ACTION BAR
        ================================================= */}

        {notifications.length > 0 && (
          <div
            className="
              flex
              items-center
              justify-between
              gap-2
              border-b
              border-[var(--theme-border)]
              px-4
              py-3
            "
          >
            {/* Mark all */}
            <button
              type="button"
              onClick={handleMarkAll}
              disabled={unreadCount === 0}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-2
                py-2
                text-[11px]
                font-semibold
                text-[var(--theme-secondary)]
                transition
                hover:bg-[var(--theme-surfaceLight)]
                disabled:cursor-not-allowed
                disabled:opacity-30
              "
            >
              <CheckCheck size={14} />
              Mark all read
            </button>

            {/* Clear all */}
            <button
              type="button"
              onClick={handleClearAll}
              className="
                flex
                items-center
                gap-2
                rounded-xl
                px-2
                py-2
                text-[11px]
                font-semibold
                text-[var(--theme-danger)]
                transition
                hover:bg-[var(--theme-surfaceLight)]
              "
            >
              <Trash2 size={14} />
              Clear all
            </button>
          </div>
        )}

        {/* =================================================
            NOTIFICATION BODY
        ================================================= */}

        <div
          className="
            max-h-[480px]
            overflow-y-auto
            px-3
            pb-3
            [&::-webkit-scrollbar]:w-1
            [&::-webkit-scrollbar-track]:bg-transparent
            [&::-webkit-scrollbar-thumb]:rounded-full
            [&::-webkit-scrollbar-thumb]:bg-[var(--theme-primary)]
            [&::-webkit-scrollbar-thumb]:opacity-60
          "
        >
          {/* =================================================
              LOADING
          ================================================= */}

          {loading && notifications.length === 0 ? (
            <div className="py-14 text-center">
              <div
                className="
                  mx-auto
                  h-8
                  w-8
                  animate-spin
                  rounded-full
                  border-2
                  border-[var(--theme-border)]
                  border-t-[var(--theme-primary)]
                "
              />

              <p
                className="
                  mt-4
                  text-xs
                  text-[var(--theme-textMuted)]
                "
              >
                Loading notifications...
              </p>
            </div>
          ) : notifications.length === 0 ? (
            /* =================================================
               EMPTY STATE
            ================================================= */

            <div className="py-16 text-center">
              <div
                className="
                  mx-auto
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-[22px]
                  border
                  border-[var(--theme-border)]
                  bg-[var(--theme-surface)]
                  shadow-[inset_5px_5px_11px_var(--theme-shadowDark),inset_-5px_-5px_11px_var(--theme-shadowLight)]
                "
              >
                <Bell
                  size={25}
                  className="text-[var(--theme-textMuted)]"
                />
              </div>

              <h4
                className="
                  mt-5
                  text-sm
                  font-semibold
                  text-[var(--theme-text)]
                "
              >
                No notifications
              </h4>

              <p
                className="
                  mt-1
                  px-8
                  text-xs
                  leading-5
                  text-[var(--theme-textMuted)]
                "
              >
                New music, updates and important account activity
                will appear here.
              </p>
            </div>
          ) : (
            /* =================================================
               NOTIFICATION LIST
            ================================================= */

            <div className="space-y-2 pt-3">
              {notifications.map((notification) => {
                const Icon = ICONS[notification.type] || Bell;
                const isUnread = !notification.read;

                return (
                  <div
                    key={notification._id}
                    className={`
                      group
                      relative
                      flex
                      gap-3
                      rounded-[20px]
                      border
                      border-[var(--theme-border)]
                      p-3
                      transition-all
                      duration-200
                      ${
                        isUnread
                          ? `
                            bg-[var(--theme-surface)]
                            shadow-[inset_3px_3px_7px_var(--theme-shadowDark),inset_-3px_-3px_7px_var(--theme-shadowLight)]
                          `
                          : `
                            bg-[var(--theme-surface)]
                            opacity-75
                            hover:opacity-100
                          `
                      }
                    `}
                  >
                    {/* =================================================
                        ICON
                    ================================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      title="Open notification"
                      aria-label={`Open ${notification.title || "notification"}`}
                      className="
                        flex
                        h-11
                        w-11
                        shrink-0
                        items-center
                        justify-center
                        rounded-2xl
                        border
                        border-[var(--theme-border)]
                        bg-[var(--theme-surface)]
                        text-[var(--theme-primary)]
                        shadow-[5px_5px_10px_var(--theme-shadowDark),-4px_-4px_9px_var(--theme-shadowLight)]
                        transition-all
                        duration-200
                        hover:text-[var(--theme-secondary)]
                        active:shadow-[inset_3px_3px_7px_var(--theme-shadowDark),inset_-3px_-3px_7px_var(--theme-shadowLight)]
                      "
                    >
                      <Icon size={18} />
                    </button>

                    {/* =================================================
                        CONTENT
                    ================================================= */}

                    <button
                      type="button"
                      onClick={() =>
                        handleNotificationClick(notification)
                      }
                      className="
                        min-w-0
                        flex-1
                        rounded-lg
                        text-left
                        outline-none
                        focus-visible:ring-2
                        focus-visible:ring-[var(--theme-primary)]
                      "
                    >
                      {/* Title */}
                      <div className="flex items-start gap-2 pr-5">
                        <h4
                          className="
                            min-w-0
                            flex-1
                            truncate
                            text-[12px]
                            font-bold
                            text-[var(--theme-text)]
                          "
                        >
                          {notification.title}
                        </h4>

                        {/* Unread indicator */}
                        {isUnread && (
                          <span
                            className="
                              mt-1
                              h-2
                              w-2
                              shrink-0
                              rounded-full
                              bg-[var(--theme-secondary)]
                              shadow-[0_0_10px_var(--theme-secondary)]
                            "
                            aria-label="Unread"
                          />
                        )}
                      </div>

                      {/* Message */}
                      <p
                        className="
                          mt-1
                          line-clamp-2
                          text-[11px]
                          leading-4
                          text-[var(--theme-textMuted)]
                        "
                      >
                        {notification.message}
                      </p>

                      {/* Time */}
                      <span
                        className="
                          mt-1.5
                          block
                          text-[9px]
                          font-medium
                          text-[var(--theme-textMuted)]
                        "
                      >
                        {formatTime(notification.createdAt)}
                      </span>
                    </button>

                    {/* =================================================
                        DELETE
                    ================================================= */}

                    <button
                      type="button"
                      onClick={(event) =>
                        handleDelete(event, notification._id)
                      }
                      title="Delete notification"
                      aria-label="Delete notification"
                      className="
                        absolute
                        right-2
                        top-2
                        flex
                        h-7
                        w-7
                        items-center
                        justify-center
                        rounded-lg
                        border
                        border-[var(--theme-border)]
                        bg-[var(--theme-surface)]
                        text-[var(--theme-textMuted)]
                        opacity-100
                        shadow-[3px_3px_6px_var(--theme-shadowDark),-2px_-2px_5px_var(--theme-shadowLight)]
                        transition-all
                        duration-200
                        hover:text-[var(--theme-danger)]
                        active:shadow-[inset_2px_2px_5px_var(--theme-shadowDark),inset_-2px_-2px_5px_var(--theme-shadowLight)]
                        sm:opacity-0
                        sm:group-hover:opacity-100
                        sm:group-focus-within:opacity-100
                      "
                    >
                      <X size={12} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;

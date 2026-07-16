import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, CheckCheck } from "lucide-react";
import useNotificationStore from "../../store/useNotificationStore.js";
import { timeAgo } from "../../utils/timeAgo.js";

const TYPE_DOT_COLORS = {
  status_change: "#8b5cf6",
  assignment: "#f59e0b",
  escalation: "#ef4444",
  comment: "#0284c7",
  admin_action: "#64748b",
};

const NotificationBell = () => {
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    fetchAll,
    refreshUnreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, 30_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (open) void fetchAll({ limit: 10 }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) markAsRead(notification._id);
    setOpen(false);
    if (notification.link) navigate(notification.link);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-9 h-9 rounded-lg hover:bg-[#f8fafc] text-[#475569]
          flex items-center justify-center transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span
            className="absolute top-1 right-1 min-w-3.75 h-3.75 px-0.75
            bg-red-500 text-white text-[9px] font-bold rounded-full
            flex items-center justify-center border border-white"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-2 w-80 bg-white rounded-xl border
          border-[#e2e8f0] shadow-lg z-50 max-h-105 flex flex-col"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#f1f5f9] shrink-0">
            <p className="text-sm font-semibold text-[#0f172a]">
              Notifications
            </p>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-[#16a34a] hover:underline font-medium"
              >
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="text-[#e2e8f0] mx-auto mb-2" />
                <p className="text-xs text-[#94a3b8]">No notifications yet</p>
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left flex items-start gap-2.5 px-4 py-3
                    border-b border-[#f8fafc] last:border-0 hover:bg-[#f8fafc]
                    transition-colors ${!n.isRead ? "bg-[#f0fdf4]/40" : ""}`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                    style={{
                      backgroundColor: n.isRead
                        ? "#e2e8f0"
                        : TYPE_DOT_COLORS[n.type] || "#16a34a",
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs ${n.isRead ? "text-[#64748b]" : "text-[#0f172a] font-medium"}`}
                    >
                      {n.message}
                    </p>
                    <p className="text-[10px] text-[#94a3b8] mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;

import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { notificationAPI } from "../api/notification";
import { Bell, CheckCheck, RefreshCw, User } from "lucide-react";
import { toast } from "sonner";

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

const statusColors = {
  closed: { bg: "#dcfce7", color: "#16a34a" },
  open: { bg: "#dbeafe", color: "#2563eb" },
  pending: { bg: "#fef9c3", color: "#ca8a04" },
};

export default function Notifications() {
  const { themeColors: c } = useTheme();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationAPI.getAll();
      setNotifications(res?.data?.notifications || []);
    } catch {
      toast.error("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id);
      setNotifications(prev =>
        prev.map(n => n._id === id ? { ...n, read: true } : n)
      );
    } catch {}
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.read);
      await Promise.all(unread.map(n => notificationAPI.markRead(n._id)));
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success("All notifications marked as read.");
    } catch {
      toast.error("Failed to mark all read.");
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-10 h-10 rounded-full border-4 border-t-transparent animate-spin"
        style={{ borderColor: c.border, borderTopColor: c.primary }} />
    </div>
  );

  return (
    <div className="w-full pb-20 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ color: c.text }}>
            <Bell size={24} style={{ color: c.primary }} />
            Notifications
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-black text-white"
                style={{ backgroundColor: c.danger }}>
                {unreadCount}
              </span>
            )}
          </h1>
          <p className="text-sm mt-1" style={{ color: c.textSecondary }}>
            {notifications.length} total · {unreadCount} unread
          </p>
        </div>

        <div className="flex items-center gap-2">

          <button onClick={fetchNotifications}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition hover:opacity-80"
            style={{ backgroundColor: c.surface, borderColor: c.border, color: c.text }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ backgroundColor: `${c.primary}15`, color: c.primary }}>
            <Bell size={28} />
          </div>
          <p className="font-bold" style={{ color: c.text }}>No notifications yet</p>
          <p className="text-sm" style={{ color: c.textSecondary }}>Aapke liye koi notification nahi hai abhi.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((n) => {
            const status = n.lead?.status || "";
            const sc = statusColors[status] || { bg: "#f3f4f6", color: "#6b7280" };
            return (
              <div key={n._id}
                onClick={() => !n.read && handleMarkRead(n._id)}
                className="flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-md"
                style={{
                  backgroundColor: n.read ? c.surface : `${c.primary}08`,
                  borderColor: n.read ? c.border : `${c.primary}30`,
                }}>

                {/* Icon */}
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${c.primary}18`, color: c.primary }}>
                  <Bell size={18} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold truncate" style={{ color: c.text }}>{n.title}</p>
                    <span className="text-[11px] shrink-0" style={{ color: c.textSecondary }}>
                      {timeAgo(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs mt-1" style={{ color: c.textSecondary }}>{n.message}</p>

                  {/* Lead info */}
                  {n.lead && (
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-semibold"
                        style={{ backgroundColor: `${c.primary}12`, color: c.primary }}>
                        <User size={10} /> {n.lead.name}
                      </div>
                      <span className="text-[11px]" style={{ color: c.textSecondary }}>
                        📞 {n.lead.phone}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[11px] font-bold capitalize"
                        style={{ backgroundColor: sc.bg, color: sc.color }}>
                        {status}
                      </span>
                    </div>
                  )}
                </div>

                {/* Unread dot */}
                {!n.read && (
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: c.primary }} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

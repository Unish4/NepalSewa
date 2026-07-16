import { create } from "zustand";
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService.js";

const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  pagination: null,
  isLoading: false,

  fetchAll: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await fetchNotifications(params);
      set({
        notifications: res.notifications,
        unreadCount: res.unreadCount,
        pagination: res.pagination,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  // The lightweight poll target — hits the tiny unread-count endpoint
  // only, never re-fetches the full notification list on every tick.
  refreshUnreadCount: async () => {
    try {
      const res = await fetchUnreadCount();
      set({ unreadCount: res.unreadCount });
    } catch {
      // Silent — a failed poll tick shouldn't surface an error to the
      // user; the next tick 30s later will just try again.
    }
  },

  markAsRead: async (id) => {
    const previousNotification = get().notifications.find((n) => n._id === id);
    if (!previousNotification || previousNotification.isRead) return;

    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    }));
    try {
      await markNotificationRead(id);
    } catch {
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? previousNotification : n,
        ),
      }));
      void get().refreshUnreadCount();
    }
  },

  markAllAsRead: async () => {
    const previousNotifications = get().notifications;
    const previousUnreadCount = get().unreadCount;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await markAllNotificationsRead();
    } catch {
      set({
        notifications: previousNotifications,
        unreadCount: previousUnreadCount,
      });
    }
  },
}));

export default useNotificationStore;

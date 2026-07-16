import api from "../lib/axios.js";

export const fetchNotifications = async (params = {}) => {
  const response = await api.get("/api/notifications", { params });
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await api.get("/api/notifications/unread-count");
  return response.data;
};

export const markNotificationRead = async (id) => {
  const response = await api.patch(`/api/notifications/${id}/read`);
  return response.data;
};

export const markAllNotificationsRead = async () => {
  const response = await api.patch("/api/notifications/read-all");
  return response.data;
};

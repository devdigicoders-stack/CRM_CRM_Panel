import axiosInstance from "./axiosInstance";

export const notificationAPI = {
  getAll: async () => {
    const res = await axiosInstance.get("/notifications");
    return res.data;
  },
  markRead: async (id) => {
    const res = await axiosInstance.patch(`/notifications/${id}/read`);
    return res.data;
  },
  markAllRead: async () => {
    const res = await axiosInstance.patch("/notifications/read-all");
    return res.data;
  },
};

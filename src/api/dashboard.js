import axiosInstance from "./axiosInstance";

export const dashboardAPI = {
  /**
   * Fetch Dashboard Statistics
   * @returns Promise
   */
  getDashboardStats: async () => {
    const response = await axiosInstance.get("/dashboard/stats");
    return response.data;
  },

  /**
   * Fetch Missed Follow-ups
   * @returns Promise
   */
  getMissedFollowups: async () => {
    const response = await axiosInstance.get("/dashboard/reminders/missed");
    return response.data;
  },

  /**
   * Fetch Today's Reminders
   * @returns Promise
   */
  getTodayReminders: async () => {
    const response = await axiosInstance.get("/dashboard/reminders/today");
    return response.data;
  },
};

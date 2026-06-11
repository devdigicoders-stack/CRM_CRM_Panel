import axiosInstance from "./axiosInstance";

export const authAPI = {
  /**
   * User login function
   * @param {string} email 
   * @param {string} password 
   * @returns Promise
   */
  login: async (email, password) => {
    const response = await axiosInstance.post("/auth/login", { email, password });
    return response.data;
  },

  /**
   * Change user password
   * @param {string} currentPassword 
   * @param {string} newPassword 
   * @returns Promise
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await axiosInstance.post("/auth/change-password", {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  saveFCMToken: async (fcmToken) => {
    const response = await axiosInstance.post("/auth/fcm-token", { fcmToken });
    return response.data;
  },
};

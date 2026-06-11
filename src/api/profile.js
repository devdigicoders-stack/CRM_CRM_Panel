import axiosInstance from "./axiosInstance";

export const profileAPI = {
  /**
   * Get current user's profile
   * @returns Promise with profile data
   */
  getProfile: async () => {
    const response = await axiosInstance.get("/profile");
    return response.data;
  },

  /**
   * Update current user's profile
   * @param {Object} data - Profile updates (name, email, phone)
   * @returns Promise with updated profile data
   */
  updateProfile: async (data) => {
    const response = await axiosInstance.put("/profile", data);
    return response.data;
  },
};

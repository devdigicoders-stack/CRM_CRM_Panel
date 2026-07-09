import axiosInstance from "./axiosInstance";

export const userAPI = {
  /**
   * Create a new CRM user
   * @param {Object} userData - User details like name, email, password, role, phone
   * @returns Promise with user data
   */
  createUser: async (userData) => {
    const response = await axiosInstance.post("/users", userData);
    return response.data;
  },

  /**
   * Get list of all sales users (kept for backward compat)
   * @returns Promise with sales list
   */
  getSalesList: async () => {
    const response = await axiosInstance.get("/users/sales-list");
    return response.data;
  },

  /**
   * Get list of ALL active users across all roles
   * @returns Promise with users list
   */
  getAllActiveUsers: async () => {
    const response = await axiosInstance.get("/users?active=true&limit=200");
    return response.data;
  },
};
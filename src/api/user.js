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
   * Get list of all sales users
   * @returns Promise with sales list
   */
  getSalesList: async () => {
    const response = await axiosInstance.get("/users/sales-list");
    return response.data;
  },
};

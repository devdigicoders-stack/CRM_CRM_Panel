import axiosInstance from "./axiosInstance";

export const leadAPI = {
  /**
   * Create a new lead
   * @param {Object} leadData - Lead details like name, phone, email, source, priority, remark
   * @returns Promise with lead data
   */
  createLead: async (leadData) => {
    const response = await axiosInstance.post("/leads", leadData);
    return response.data;
  },
  
  /**
   * Fetch all leads
   * @param {Object} params - Query parameters like search, tag
   * @returns Promise with leads list
   */
  getAllLeads: async (params = {}) => {
    const response = await axiosInstance.get("/leads", { params });
    return response.data;
  },

  /**
   * Fetch a single lead by ID
   * @param {string} id - Lead ID
   * @returns Promise with lead details
   */
  getLeadById: async (id) => {
    const response = await axiosInstance.get(`/leads/${id}`);
    return response.data;
  },

  /**
   * Update an existing lead
   * @param {string} id - Lead ID
   * @param {Object} data - Updated lead data
   * @returns Promise with updated lead data
   */
  updateLead: async (id, data) => {
    const response = await axiosInstance.put(`/leads/${id}`, data);
    return response.data;
  },

  /**
   * Add a remark to a lead
   * @param {string} id - Lead ID
   * @param {string} note - The remark content
   * @returns Promise with updated lead data
   */
  addLeadRemark: async (id, data) => {
    const response = await axiosInstance.post(`/leads/${id}/remarks`, data);
    return response.data;
  },

  /**
   * Assign a lead to a user
   * @param {string} id - Lead ID
   * @param {string} userId - ID of the user to assign
   * @returns Promise with updated lead data
   */
  assignLead: async (id, userId) => {
    const response = await axiosInstance.put(`/leads/${id}/assign`, { userId });
    return response.data;
  },

  /**
   * Check if a phone number already exists in leads
   * @param {string} phone - Phone number to check
   * @returns Promise with check-phone details
   */
  checkPhone: async (phone) => {
    const response = await axiosInstance.get('/leads/check-phone', { params: { phone } });
    return response.data;
  },
};

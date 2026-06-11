import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// Yahan pe aage chalkar interceptors bhi add kiye ja sakte hain (e.g. token bhejne ke liye)
axiosInstance.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem("admin-data");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (e) {
        console.error("Token parse error", e);
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;

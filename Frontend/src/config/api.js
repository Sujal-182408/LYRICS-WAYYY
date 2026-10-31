
import axios from "axios";

// =====================================================
// BACKEND BASE URL
// =====================================================

// Local development → localhost
// Production → Render

export const BASE_URL = import.meta.env.DEV
  ? "http://localhost:5001"
  : "https://lyrics-wayyy-backend.onrender.com";

// =====================================================
// API BASE URL
// =====================================================

export const API_BASE_URL = `${BASE_URL}/api`;

// =====================================================
// AXIOS API INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => response,

  (error) => {
    if (error.response) {
      const status = error.response.status;
      const responseData = error.response.data;

      console.error("API ERROR:", status, responseData);

      if (status === 401) {
        console.warn("AUTHENTICATION FAILED: JWT rejected by server.");

        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("isAuthenticated");

        window.dispatchEvent(
          new CustomEvent("auth:unauthorized", {
            detail: {
              status,
              data: responseData,
            },
          })
        );
      }

      if (status === 403) {
        console.warn("AUTHORIZATION FAILED.");
      }

      if (status === 429) {
        console.warn("REQUEST RATE LIMITED.");
      }
    } else if (error.request) {
      console.error("API SERVER NOT REACHABLE:", error.message);
    } else {
      console.error("API REQUEST ERROR:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;


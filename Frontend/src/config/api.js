
import axios from "axios";

// =====================================================
// BACKEND BASE URL
// =====================================================

export const BASE_URL = 
"https://barbie-title-capable-testament.trycloudflare.com";
// =====================================================
// API BASE URL
// =====================================================

export const API_BASE_URL =
  `${BASE_URL}/api`;

// =====================================================
// AXIOS API INSTANCE
// =====================================================

const api = axios.create({
  baseURL: API_BASE_URL,

  timeout: 15000,

  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// =====================================================
// REQUEST INTERCEPTOR
// =====================================================
//
// Automatically attaches the current JWT.
//
// Authorization:
// Bearer <token>
// =====================================================

api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem("token");

    if (token) {
      config.headers =
        config.headers || {};

      config.headers.Authorization =
        `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    return Promise.reject(error);
  }
);

// =====================================================
// RESPONSE INTERCEPTOR
// =====================================================

api.interceptors.response.use(
  (response) => {
    return response;
  },

  (error) => {
    // -------------------------------------------------
    // SERVER RESPONSE
    // -------------------------------------------------

    if (error.response) {
      const status =
        error.response.status;

      const responseData =
        error.response.data;

      console.error(
        "API ERROR:",
        status,
        responseData
      );

      // ------------------------------------------------
      // UNAUTHORIZED
      // ------------------------------------------------
      //
      // Do NOT immediately redirect here.
      //
      // Some components may intentionally handle 401
      // themselves.
      //
      // We only mark the token as invalid.
      // ------------------------------------------------

      if (status === 401) {
        console.warn(
          "AUTHENTICATION FAILED: JWT rejected by server."
        );

        // Remove only the authentication token.
        //
        // Do NOT remove arbitrary application data.
        localStorage.removeItem("token");

        // Keep compatibility if older code uses this.
        localStorage.removeItem("accessToken");

        localStorage.removeItem(
          "isAuthenticated"
        );

        // Tell the application that authentication
        // has expired.
        window.dispatchEvent(
          new CustomEvent(
            "auth:unauthorized",
            {
              detail: {
                status,
                data: responseData,
              },
            }
          )
        );
      }

      // ------------------------------------------------
      // FORBIDDEN
      // ------------------------------------------------

      if (status === 403) {
        console.warn(
          "AUTHORIZATION FAILED: user does not have permission."
        );
      }

      // ------------------------------------------------
      // RATE LIMITED
      // ------------------------------------------------

      if (status === 429) {
        console.warn(
          "REQUEST RATE LIMITED."
        );
      }
    }

    // =================================================
    // REQUEST SENT BUT NO RESPONSE
    // =================================================

    else if (error.request) {
      console.error(
        "API SERVER NOT REACHABLE:",
        error.message
      );
    }

    // =================================================
    // REQUEST CONFIGURATION ERROR
    // =================================================

    else {
      console.error(
        "API REQUEST ERROR:",
        error.message
      );
    }

    return Promise.reject(error);
  }
);

// =====================================================
// EXPORT
// =====================================================

export default api;
import axios from "axios";
import { BASE_URL } from "../../config/api";

const DASHBOARD_API = `${BASE_URL}/api/superadmin`;

const getAuthConfig = () => {
  const token = localStorage.getItem("token");

  if (!token) {
    throw new Error("Authentication token not found.");
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// ============================================================
// DASHBOARD STATS
// ============================================================

export const getDashboardStats = async () => {
  const response = await axios.get(
    `${DASHBOARD_API}/dashboard-stats`,
    getAuthConfig()
  );

  return response.data;
};

// ============================================================
// RECENT SONGS
// ============================================================

export const getRecentSongs = async ({
  page = 1,
  limit = 8,
  search = "",
} = {}) => {
  const response = await axios.get(
    `${BASE_URL}/api/songs`,
    {
      ...getAuthConfig(),
      params: {
        page,
        limit,
        search,
      },
    }
  );

  return response.data;
};

// ============================================================
// ARTIST APPLICATIONS
// ============================================================

export const getRecentArtistApplications = async ({
  page = 1,
  limit = 8,
  status = "",
  search = "",
} = {}) => {
  const response = await axios.get(
    `${DASHBOARD_API}/artist-applications`,
    {
      ...getAuthConfig(),
      params: {
        page,
        limit,
        status,
        search,
      },
    }
  );

  return response.data;
};

// ============================================================
// APPROVE / REJECT ARTIST
// ============================================================

export const reviewArtistApplication = async ({
  id,
  action,
  admin_note = "",
}) => {
  if (!id) {
    throw new Error("Artist application ID is required.");
  }

  if (!["approve", "reject"].includes(action)) {
    throw new Error(
      "Review action must be approve or reject."
    );
  }

  const response = await axios.patch(
    `${DASHBOARD_API}/artist-applications/${id}/review`,
    {
      action,
      admin_note,
    },
    getAuthConfig()
  );

  return response.data;
};
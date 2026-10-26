
import axios from "axios";
import { BASE_URL } from "../config/api";

const API_URL = `${BASE_URL.replace(/\/+$/, "")}/api/profile`;

// =====================================================
// AUTH CONFIGURATION
// =====================================================

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("authToken");

  if (!token) {
    throw new Error(
      "Authentication token not found. Please sign in again."
    );
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// =====================================================
// ERROR HANDLING
// =====================================================

const getErrorMessage = (error, fallback) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
};

// =====================================================
// GET CURRENT USER PROFILE
// GET /api/profile/me
// =====================================================

export const getMyProfile = async () => {
  try {
    const response = await axios.get(
      `${API_URL}/me`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error("getMyProfile:", error);

    throw new Error(
      getErrorMessage(error, "Unable to load your profile.")
    );
  }
};

// =====================================================
// START LISTENING SESSION
// POST /api/profile/listening/start
// =====================================================

export const startListening = async (
  songId,
  position = 0,
  duration = 0
) => {
  if (!songId) {
    throw new Error("Song ID is required.");
  }

  try {
    const response = await axios.post(
      `${API_URL}/listening/start`,
      { songId, position, duration },
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "startListening:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to start listening session."
      )
    );
  }
};

// =====================================================
// UPDATE LISTENING SESSION
// PATCH /api/profile/listening/:historyId
// =====================================================

export const updateListening = async (
  historyId,
  data = {}
) => {
  if (!historyId) {
    throw new Error("Listening history ID is required.");
  }

  const payload = {};

  if (data.listenedSeconds !== undefined) {
    const seconds = Number(data.listenedSeconds);

    if (
      !Number.isFinite(seconds) ||
      seconds < 0
    ) {
      throw new Error(
        "Listening duration must be a finite, nonnegative number."
      );
    }

    payload.listenedSeconds = Math.floor(seconds);
  }

  if (data.position !== undefined) {
    const position = Number(data.position);

    if (!Number.isFinite(position) || position < 0) {
      throw new Error(
        "Playback position must be nonnegative."
      );
    }

    payload.position = position;
  }

  if (data.duration !== undefined) {
    const duration = Number(data.duration);

    if (!Number.isFinite(duration) || duration < 0) {
      throw new Error(
        "Song duration must be nonnegative."
      );
    }

    payload.duration = duration;
  }

  if (data.completed !== undefined) {
    if (typeof data.completed !== "boolean") {
      throw new Error(
        "Completed must be a boolean."
      );
    }

    payload.completed = data.completed;
  }

  try {
    const response = await axios.patch(
      `${API_URL}/listening/${historyId}`,
      payload,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "updateListening:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to update listening session."
      )
    );
  }
};

// =====================================================
// GET LISTENING HISTORY AND ANALYTICS
// GET /api/profile/listening
// =====================================================

export const getListeningHistory = async (
  params = {}
) => {
  try {
    const response = await axios.get(
      `${API_URL}/listening`,
      {
        ...getAuthConfig(),
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
        },
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "getListeningHistory:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to load listening history."
      )
    );
  }
};

// =====================================================
// GET FAVORITES
// GET /api/profile/favorites
// =====================================================

export const getMyFavorites = async (
  params = {}
) => {
  try {
    const response = await axios.get(
      `${API_URL}/favorites`,
      {
        ...getAuthConfig(),
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "getMyFavorites:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to load favorites."
      )
    );
  }
};

// =====================================================
// ADD FAVORITE
// POST /api/profile/favorites
// =====================================================

export const addFavorite = async (songId) => {
  if (!songId) {
    throw new Error("Song ID is required.");
  }

  try {
    const response = await axios.post(
      `${API_URL}/favorites`,
      { songId },
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "addFavorite:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to add song to favorites."
      )
    );
  }
};

// =====================================================
// REMOVE FAVORITE
// DELETE /api/profile/favorites/:songId
// =====================================================

export const removeFavorite = async (songId) => {
  if (!songId) {
    throw new Error("Song ID is required.");
  }

  try {
    const response = await axios.delete(
      `${API_URL}/favorites/${encodeURIComponent(songId)}`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "removeFavorite:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to remove song from favorites."
      )
    );
  }
};

// =====================================================
// GET FOLLOWED ARTISTS
// GET /api/profile/following
// =====================================================

export const getMyFollowedArtists = async (
  params = {}
) => {
  try {
    const response = await axios.get(
      `${API_URL}/following`,
      {
        ...getAuthConfig(),
        params,
      }
    );

    return response.data;
  } catch (error) {
    console.error(
      "getMyFollowedArtists:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(
        error,
        "Unable to load followed artists."
      )
    );
  }
};


// =====================================================
// DELETE ONE LISTENING HISTORY ENTRY
// DELETE /api/profile/listening/:id
// =====================================================

export const deleteListeningHistoryEntry = async (historyId) => {
  if (!historyId) {
    throw new Error("Listening history ID is required.");
  }

  try {
    const response = await axios.delete(
      `${API_URL}/listening/${encodeURIComponent(historyId)}`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "deleteListeningHistoryEntry:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(error, "Unable to delete history entry.")
    );
  }
};

// =====================================================
// CLEAR ALL LISTENING HISTORY
// DELETE /api/profile/listening
// =====================================================

export const clearListeningHistory = async () => {
  try {
    const response = await axios.delete(
      `${API_URL}/listening`,
      getAuthConfig()
    );

    return response.data;
  } catch (error) {
    console.error(
      "clearListeningHistory:",
      error.response?.data || error.message
    );

    throw new Error(
      getErrorMessage(error, "Unable to clear listening history.")
    );
  }
};
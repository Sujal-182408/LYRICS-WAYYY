
import axios from "axios";
import { BASE_URL } from "../config/api";

// =====================================================
// API CONFIGURATION
// =====================================================

const API_URL = `${String(BASE_URL || "").replace(/\/+$/, "")}/api/playlists`;

// =====================================================
// AUTH CONFIG
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
// ERROR LOGGER
// =====================================================

const logApiError = (action, error) => {
  console.error(`${action} FAILED:`, {
    message: error?.message,
    status: error?.response?.status,
    response: error?.response?.data,
    endpoint: error?.config?.url,
    method: error?.config?.method,
  });
};

// =====================================================
// SHARED REQUEST HANDLER
// =====================================================

const request = async (action, callback) => {
  try {
    const response = await callback();
    return response.data;
  } catch (error) {
    logApiError(action, error);
    throw error;
  }
};

// =====================================================
// GET MY PLAYLISTS
// GET /api/playlists
// =====================================================

export const getMyPlaylists = async () =>
  request("GET MY PLAYLISTS", () =>
    axios.get(API_URL, getAuthConfig())
  );

// =====================================================
// GET SINGLE PLAYLIST
// GET /api/playlists/:id
// =====================================================

export const getPlaylistById = async (playlistId) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required.");
  }

  return request("GET PLAYLIST", () =>
    axios.get(`${API_URL}/${playlistId}`, getAuthConfig())
  );
};

// =====================================================
// CREATE PLAYLIST
// POST /api/playlists
// =====================================================

export const createPlaylist = async ({
  name,
  description = "",
  coverImage = "",
  visibility = "private",
} = {}) => {
  const playlistName = String(name || "").trim();
  const playlistDescription = String(description || "").trim();

  if (!playlistName) {
    throw new Error("Playlist name is required.");
  }

  if (playlistName.length > 100) {
    throw new Error("Playlist name cannot exceed 100 characters.");
  }

  if (playlistDescription.length > 500) {
    throw new Error(
      "Playlist description cannot exceed 500 characters."
    );
  }

  if (!["private", "public"].includes(visibility)) {
    throw new Error(
      'Visibility must be either "private" or "public".'
    );
  }

  const playlistData = {
    name: playlistName,
    description: playlistDescription,
    coverImage: String(coverImage || "").trim(),
    visibility,
  };

  return request("CREATE PLAYLIST", () =>
    axios.post(API_URL, playlistData, getAuthConfig())
  );
};

// =====================================================
// UPDATE PLAYLIST
// PUT /api/playlists/:id
// =====================================================

export const updatePlaylist = async (playlistId, data = {}) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required.");
  }

  const payload = { ...data };

  if (payload.isPublic !== undefined) {
    payload.visibility = payload.isPublic ? "public" : "private";
    delete payload.isPublic;
  }

  if (payload.visible !== undefined) {
    payload.visibility = payload.visible ? "public" : "private";
    delete payload.visible;
  }

  return request("UPDATE PLAYLIST", () =>
    axios.put(
      `${API_URL}/${playlistId}`,
      payload,
      getAuthConfig()
    )
  );
};

// =====================================================
// DELETE PLAYLIST
// DELETE /api/playlists/:id
// =====================================================

export const deletePlaylist = async (playlistId) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required.");
  }

  return request("DELETE PLAYLIST", () =>
    axios.delete(`${API_URL}/${playlistId}`, getAuthConfig())
  );
};

// =====================================================
// ADD SONG TO PLAYLIST
// POST /api/playlists/:id/songs
// =====================================================

export const addSongToPlaylist = async (playlistId, songId) => {
  if (!playlistId || !songId) {
    throw new Error(
      "Both playlist ID and song ID are required."
    );
  }

  return request("ADD SONG TO PLAYLIST", () =>
    axios.post(
      `${API_URL}/${playlistId}/songs`,
      { songId },
      getAuthConfig()
    )
  );
};

// =====================================================
// REMOVE SONG FROM PLAYLIST
// DELETE /api/playlists/:id/songs/:songId
// =====================================================

export const removeSongFromPlaylist = async (
  playlistId,
  songId
) => {
  if (!playlistId || !songId) {
    throw new Error(
      "Both playlist ID and song ID are required."
    );
  }

  return request("REMOVE SONG FROM PLAYLIST", () =>
    axios.delete(
      `${API_URL}/${playlistId}/songs/${songId}`,
      getAuthConfig()
    )
  );
};

// =====================================================
// REORDER PLAYLIST SONGS
// PUT /api/playlists/:id/songs/reorder
// Matches the provided playlistRoutes.js
// =====================================================

export const reorderPlaylist = async (playlistId, songIds) => {
  if (!playlistId) {
    throw new Error("Playlist ID is required.");
  }

  if (!Array.isArray(songIds)) {
    throw new Error("songIds must be an array.");
  }

  return request("REORDER PLAYLIST", () =>
    axios.put(
      `${API_URL}/${playlistId}/songs/reorder`,
      { songIds },
      getAuthConfig()
    )
  );
};

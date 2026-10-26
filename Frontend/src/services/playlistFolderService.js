import axios from "axios";
import { BASE_URL } from "../config/api";

const API_URL =
  `${BASE_URL}/api/playlist-folders`;

const getAuthConfig = () => {
  const token =
    localStorage.getItem("token");

  if (!token) {
    throw new Error(
      "Authentication token not found"
    );
  }

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

// GET MY FOLDERS
export const getMyPlaylistFolders =
  async () => {
    const response = await axios.get(
      API_URL,
      getAuthConfig()
    );

    return response.data;
  };

// CREATE FOLDER
export const createPlaylistFolder =
  async ({
    name,
    description = "",
    parentFolder = null,
  }) => {
    if (!name?.trim()) {
      throw new Error(
        "Folder name is required"
      );
    }

    const response = await axios.post(
      API_URL,
      {
        name: name.trim(),
        description:
          description.trim(),
        parentFolder,
      },
      getAuthConfig()
    );

    return response.data;
  };

// GET FOLDER
export const getPlaylistFolder =
  async (folderId) => {
    const response = await axios.get(
      `${API_URL}/${folderId}`,
      getAuthConfig()
    );

    return response.data;
  };

// UPDATE FOLDER
export const updatePlaylistFolder =
  async (folderId, data) => {
    const response = await axios.put(
      `${API_URL}/${folderId}`,
      data,
      getAuthConfig()
    );

    return response.data;
  };

// DELETE FOLDER
export const deletePlaylistFolder =
  async (folderId) => {
    const response = await axios.delete(
      `${API_URL}/${folderId}`,
      getAuthConfig()
    );

    return response.data;
  };
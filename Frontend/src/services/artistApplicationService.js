import axios from "axios";
import { BASE_URL } from "../config/api";

const API_URL = `${BASE_URL}/api/artist-applications`;

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

export const submitArtistApplication = async (formData) => {
  if (!(formData instanceof FormData)) {
    throw new Error(
      "Artist application must be submitted as FormData."
    );
  }

  const response = await axios.post(
    API_URL,
    formData,
    {
      ...getAuthConfig(),

      // Do NOT manually set Content-Type.
      // Axios/browser will generate the multipart boundary.
    }
  );

  return response.data;
};

export const getMyArtistApplication = async () => {
  const response = await axios.get(
    `${API_URL}/my-application`,
    getAuthConfig()
  );

  return response.data;
};
import axios from "axios";
import { BASE_URL } from "../config/api";

const API_URL = `${BASE_URL}/api/songs`;

export const getSongs = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const getSongById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

export const createSong = async (formData) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(API_URL, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const updateSong = async (id, formData) => {
  const token = localStorage.getItem("token");

  const response = await axios.put(`${API_URL}/${id}`, formData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};

export const deleteSong = async (id) => {
  const token = localStorage.getItem("token");

  const response = await axios.delete(`${API_URL}/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
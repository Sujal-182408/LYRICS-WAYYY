import axios from "axios";
import { BASE_URL } from "../config/api";

const API_URL = `${BASE_URL}/api/albums`;


// CREATE ALBUM
export const createAlbum = async (formData) => {
  const response = await axios.post(
    API_URL,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};


// GET ALL ALBUMS
export const getAlbums = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};


// GET SINGLE ALBUM
export const getAlbumById = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};


// UPDATE ALBUM
export const updateAlbum = async (id, formData) => {
  const response = await axios.put(
    `${API_URL}/${id}`,
    formData,
    {
      headers:{
        "Content-Type":"multipart/form-data",
      },
    }
  );

  return response.data;
};


// DELETE ALBUM
export const deleteAlbum = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
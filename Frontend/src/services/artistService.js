import axios from "axios";

const API = "http://localhost:5001/api/artists";

// CREATE
export const createArtist = async (data) => {
  const res = await axios.post(API, data);
  return res.data;
};

// GET ALL
export const getArtists = async () => {
  const res = await axios.get(API);
  return res.data;
};

// GET ONE
export const getArtistById = async (id) => {
  const res = await axios.get(`${API}/${id}`);
  return res.data;
};

// UPDATE
export const updateArtist = async (id, data) => {
  const res = await axios.put(`${API}/${id}`, data);
  return res.data;
};

// DELETE
export const deleteArtist = async (id) => {
  const res = await axios.delete(`${API}/${id}`);
  return res.data;
};
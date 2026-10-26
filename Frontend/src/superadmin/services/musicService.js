
import axios from "axios";
import { BASE_URL } from "../../config/api";

const API_URL = `${BASE_URL}/api/songs`;

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

export const getSongs = async ({
  page = 1,
  limit = 50,
  search = "",
} = {}) => {
  const response = await axios.get(API_URL, {
    ...getAuthConfig(),
    params: {
      page,
      limit,
      search,
    },
  });

  return response.data;
};

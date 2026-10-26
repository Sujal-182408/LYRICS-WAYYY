import axios from "axios";

 const API_URL = "http://192.168.1.7:5001/api/auth";

// Signup
export const signup = async (userData) => {
  return await axios.post(`${API_URL}/signup`, userData);
};

// Login
export const login = async (userData) => {
  return await axios.post(`${API_URL}/login`, userData);
};
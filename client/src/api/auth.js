// src/api/auth.js
import axios from 'axios';

// Set up a base URL for all API requests
const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api', // Your backend URL
});

export const loginUser = (userData) => {
  return apiClient.post('/auth/login', userData);
};

export const registerUser = (userData) => {
  return apiClient.post('/auth/register', userData);
};
// src/api/auth.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

// --- This is the new, important part ---
// Use an interceptor to add the token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['x-auth-token'] = token;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// ----------------------------------------

// Auth functions
export const loginUser = (userData) => apiClient.post('/auth/login', userData);
export const registerUser = (userData) => apiClient.post('/auth/register', userData);

// Board functions
export const getUserBoards = () => apiClient.get('/boards');
export const createBoard = (boardData) => apiClient.post('/boards', boardData);
export const getBoardDetails = (id) => apiClient.get(`/boards/${id}`);
export const deleteBoard = (id) => apiClient.delete(`/boards/${id}`);
export const updateListOrder = (boardId, listIds) => apiClient.put(`/boards/${boardId}/lists`, { listIds });

// List functions
export const createList = (listData) => apiClient.post('/lists', listData);
export const deleteList = (id) => apiClient.delete(`/lists/${id}`);
export const updateCardOrder = (listId, cardIds) => apiClient.put(`/lists/${listId}/cards`, { cardIds });

// Card functions
export const createCard = (cardData) => apiClient.post('/cards', cardData);
export const updateCard = (id, cardData) => apiClient.put(`/cards/${id}`, cardData);
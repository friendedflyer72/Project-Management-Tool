// src/api/auth.js
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

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
export const inviteUserToBoard = (boardId, email) => apiClient.post(`/boards/${boardId}/invite`, { email });

// List functions
export const createList = (listData) => apiClient.post('/lists', listData);
export const deleteList = (id) => apiClient.delete(`/lists/${id}`);
export const updateCardOrder = (listId, cardIds) => apiClient.put(`/lists/${listId}/cards`, { cardIds });

// Card functions
export const createCard = (cardData) => apiClient.post('/cards', cardData);
export const updateCard = (id, cardData) => apiClient.put(`/cards/${id}`, cardData);
export const deleteCard = (id) => apiClient.delete(`/cards/${id}`);
export const duplicateCard = (id) => apiClient.post(`/cards/${id}/duplicate`);

// Profile functions
export const getMe = () => apiClient.get('/auth/me');
export const updateMe = (userData) => apiClient.put('/auth/me', userData);
export const changePassword = (passwordData) => apiClient.post('/auth/change-password', passwordData);
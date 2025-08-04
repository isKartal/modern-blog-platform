import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Axios instance oluştur
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token varsa header'a ekle
const token = localStorage.getItem('access_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

// API functions
export const apiClient = {
  // Authentication
  async login(username, password) {
    const response = await api.post('/auth/login/', { username, password });
    if (response.data.access) {
      localStorage.setItem('access_token', response.data.access);
      localStorage.setItem('refresh_token', response.data.refresh);
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
    }
    return response.data;
  },

  async register(userData) {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },

  logout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    delete api.defaults.headers.common['Authorization'];
  },

  // Posts
  async getPosts(params = {}) {
    const response = await api.get('/posts/', { params });
    return response.data;
  },

  async getPost(id) {
    const response = await api.get(`/posts/${id}/`);
    return response.data;
  },

  async createPost(postData) {
    const response = await api.post('/posts/', postData);
    return response.data;
  },

  async getMyPosts() {
    const response = await api.get('/posts/my_posts/');
    return response.data;
  },

  async getPopularPosts() {
    const response = await api.get('/posts/popular/');
    return response.data;
  },

  // Categories
  async getCategories() {
    const response = await api.get('/categories/');
    return response.data;
  },

  // Comments
  async addComment(postId, content) {
    const response = await api.post(`/posts/${postId}/add_comment/`, { content });
    return response.data;
  },

  async getComments(postId) {
    const response = await api.get(`/posts/${postId}/comments/`);
    return response.data;
  },
};

export default api;
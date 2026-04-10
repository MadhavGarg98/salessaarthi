import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Analytics API
export const getAnalytics = async () => {
  const response = await api.get('/api/analytics');
  return response.data;
};

// Orders API
export const getOrders = async () => {
  const response = await api.get('/api/orders');
  return response.data.data || [];
};

export const getOrderStats = async () => {
  const response = await api.get('/api/orders/stats');
  return response.data.data;
};

export const updateOrderStatus = async (id: string, status: any) => {
  const response = await api.put(`/api/orders/${id}`, status);
  return response.data;
};

// Payment Settings API
export const getPaymentSettings = async () => {
  const response = await api.get('/api/payment/settings');
  return response.data;
};

export const updatePaymentSettings = async (upiId: string) => {
  const response = await api.put('/api/payment/settings', { upiId });
  return response.data;
};

// Products API
export const getProducts = async () => {
  const response = await api.get('/api/products');
  return response.data.data || [];
};

export const addProduct = async (productData: any) => {
  const response = await api.post('/api/products', productData);
  return response.data;
};

export const updateProduct = async (id: string, productData: any) => {
  const response = await api.put(`/api/products/${id}`, productData);
  return response.data;
};

export const deleteProduct = async (id: string) => {
  const response = await api.delete(`/api/products/${id}`);
  return response.data;
};

// Chats API
export const getRecentChats = async () => {
  const response = await api.get('/api/chats');
  return response.data.recentChats;
};

export default api;

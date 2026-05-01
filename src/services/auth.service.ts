import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

export const authService = {
  async login(credentials: any) {
    const response = await api.post('/auth/login', credentials);
    const { user, accessToken } = response.data.data;
    useAuthStore.getState().setAuth(user, accessToken);
    return response.data;
  },

  async register(data: any) {
    const response = await api.post('/auth/register', data);
    const { user, accessToken } = response.data.data;
    useAuthStore.getState().setAuth(user, accessToken);
    return response.data;
  },

  async logout() {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error', err);
    } finally {
      useAuthStore.getState().logout();
    }
  }
};

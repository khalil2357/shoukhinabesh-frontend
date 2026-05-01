import api from '../api/axios';
import { useAuthStore } from '../store/useAuthStore';

interface Credentials { email: string; password: string; }
interface RegisterData { name: string; email: string; password: string; role?: string; }

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
}

const extractAuth = (data: unknown): { user: AuthUser; accessToken: string } | null => {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;

  // Try nested: { data: { user, accessToken } }
  if (d.data && typeof d.data === 'object') {
    const nested = d.data as Record<string, unknown>;
    if (nested.user && nested.accessToken) {
      return { user: nested.user as AuthUser, accessToken: nested.accessToken as string };
    }
    if (nested.user && nested.tokens) {
      const tokens = nested.tokens as Record<string, string>;
      return { user: nested.user as AuthUser, accessToken: tokens.accessToken ?? tokens.access };
    }
  }
  // Try flat: { user, accessToken }
  if (d.user && d.accessToken) {
    return { user: d.user as AuthUser, accessToken: d.accessToken as string };
  }
  if (d.user && d.tokens) {
    const tokens = d.tokens as Record<string, string>;
    return { user: d.user as AuthUser, accessToken: tokens.accessToken ?? tokens.access };
  }
  return null;
};

export const authService = {
  async login(credentials: Credentials) {
    const response = await api.post('/auth/login', credentials);
    const auth = extractAuth(response.data);
    if (auth) {
      useAuthStore.getState().setAuth(auth.user, auth.accessToken);
    }
    return response;
  },

  async register(data: RegisterData) {
    const response = await api.post('/auth/register', data);
    const auth = extractAuth(response.data);
    if (auth) {
      useAuthStore.getState().setAuth(auth.user, auth.accessToken);
    }
    return response;
  },

  async logout() {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    finally { useAuthStore.getState().logout(); }
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', { refreshToken });
    const auth = extractAuth(response.data);
    if (auth) {
      useAuthStore.getState().setAuth(auth.user, auth.accessToken);
    }
    return response;
  },
};

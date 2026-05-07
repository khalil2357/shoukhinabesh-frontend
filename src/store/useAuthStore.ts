import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { signOut } from 'firebase/auth';
import { firebaseAuth } from '../lib/firebase';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'CUSTOMER' | 'VENDOR' | 'ADMIN';
  avatar?: string;
  emailVerified?: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setHydrated: (hasHydrated: boolean) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      hasHydrated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true, hasHydrated: true }),
      clearAuth: () => set({ user: null, token: null, isAuthenticated: false, hasHydrated: true }),
      setHydrated: (hasHydrated) => set({ hasHydrated }),
      logout: async () => {
        await signOut(firebaseAuth);
        set({ user: null, token: null, isAuthenticated: false, hasHydrated: true });
      },
    }),
    {
      name: 'shoukhinabesh-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'OWNER' | 'PIC_BRAND';
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: (user: User, token: string) => {
    localStorage.setItem('zaneva_token', token);
    localStorage.setItem('zaneva_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('zaneva_token');
    localStorage.removeItem('zaneva_user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  loadFromStorage: () => {
    const token = localStorage.getItem('zaneva_token');
    const userStr = localStorage.getItem('zaneva_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ user, token, isAuthenticated: true });
      } catch {
        localStorage.removeItem('zaneva_token');
        localStorage.removeItem('zaneva_user');
      }
    }
  },
}));

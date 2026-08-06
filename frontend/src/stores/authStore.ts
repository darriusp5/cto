import { create } from 'zustand';

import { clearSession, getStoredSession, persistSession } from '@/lib/auth';
import type { User } from '@/types';

/**
 * Стор авторизации (каркас, этап 1).
 * Полная логика (телефон + SMS, админ-вход) — на этапе 2.
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setSession: (user: User | null, token: string | null) => void;
  logout: () => void;
}

const initial = getStoredSession();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  token: initial.token,
  isAuthenticated: Boolean(initial.token && initial.user),
  setSession: (user, token) => {
    persistSession({ user, token });
    set({ user, token, isAuthenticated: Boolean(token && user) });
  },
  logout: () => {
    clearSession();
    set({ user: null, token: null, isAuthenticated: false });
  },
}));

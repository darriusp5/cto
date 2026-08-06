import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { logoutRequest } from '@/lib/auth';
import type { User } from '@/types';

/**
 * Стор авторизации (этап 3).
 * JWT и пользователь хранятся в localStorage (zustand persist, ключ ekl.auth),
 * сессия восстанавливается при перезагрузке страницы.
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  /** Установить сессию после успешного POST /api/auth/verify. */
  setSession: (token: string, user: User) => void;
  /** Обновить данные пользователя (после PUT /api/users/me). */
  setUser: (user: User) => void;
  /** Выйти: POST /api/auth/logout (best effort) + очистка хранилища. */
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setSession: (token, user) => set({ token, user, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      logout: async () => {
        await logoutRequest();
        set({ token: null, user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ekl.auth',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

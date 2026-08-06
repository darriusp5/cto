import type { AuthSession, User } from '@/types';

/**
 * Работа с токеном авторизации (каркас, этап 1).
 * Реальная интеграция с API — на этапе 2.
 */

const TOKEN_STORAGE_KEY = 'ekl.token';
const USER_STORAGE_KEY = 'ekl.user';

export function getStoredSession(): AuthSession {
  try {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const rawUser = localStorage.getItem(USER_STORAGE_KEY);
    const user = rawUser ? (JSON.parse(rawUser) as User) : null;
    return { user, token };
  } catch {
    return { user: null, token: null };
  }
}

export function persistSession(session: AuthSession): void {
  if (session.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, session.token);
  } else {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
  if (session.user) {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(session.user));
  } else {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

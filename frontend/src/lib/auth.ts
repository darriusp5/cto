import type { Project, Template, User } from '@/types';

/**
 * Клиент API: fetch-обёртка с Bearer-токеном и типизированные эндпоинты (этап 3).
 * Токен хранится в localStorage через zustand persist (ключ ekl.auth).
 */

const PERSIST_KEY = 'ekl.auth';

/** Достаёт JWT из persist-хранилища authStore (без импорта стора). */
export function getStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    const token = parsed.state?.token;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/** Ошибка API с HTTP-статусом и сообщением от сервера. */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** fetch-обёртка: JSON по умолчанию, Bearer-заголовок, разбор ошибок {error}. */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  const isForm = options.body instanceof FormData;
  if (!isForm && options.body !== undefined) headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });
  if (!res.ok) {
    let message = `Ошибка запроса (${res.status})`;
    try {
      const body = (await res.json()) as { error?: string; reason?: string };
      if (typeof body.error === 'string' && body.error) {
        message = typeof body.reason === 'string' && body.reason ? `${body.error}: ${body.reason}` : body.error;
      }
    } catch {
      /* тело не JSON — оставляем общее сообщение */
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ── Авторизация ────────────────────────────────────────────────────────────

export function sendSmsCode(phone: string): Promise<{ message: string }> {
  return apiFetch('/api/auth/send-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });
}

export function verifySmsCode(phone: string, code: string): Promise<{ token: string; user: User }> {
  return apiFetch('/api/auth/verify', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });
}

/** Выход на сервере — best effort, ошибки игнорируем (токен чистится локально). */
export async function logoutRequest(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}

// ── Пользователь ───────────────────────────────────────────────────────────

export function fetchMe(): Promise<User> {
  return apiFetch('/api/users/me');
}

export function updateMe(name: string): Promise<User> {
  return apiFetch('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify({ name }),
  });
}

// ── Проекты ────────────────────────────────────────────────────────────────

export function fetchProjects(): Promise<Project[]> {
  return apiFetch('/api/projects');
}

export function createProject(title: string, data: string): Promise<Project> {
  return apiFetch('/api/projects', {
    method: 'POST',
    body: JSON.stringify({ title, data }),
  });
}

// ── Шаблоны ────────────────────────────────────────────────────────────────

export function fetchTemplates(): Promise<Template[]> {
  return apiFetch('/api/templates');
}

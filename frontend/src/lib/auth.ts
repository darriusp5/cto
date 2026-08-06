import type { Brand, Category, ComponentItem, Project, Template, User } from '@/types';

/**
 * Клиент API: fetch-обёртка с Bearer-токеном и типизированные эндпоинты (этапы 3–6).
 * Токен хранится в localStorage через zustand persist (ключ ekl.auth).
 */

const PERSIST_KEY = 'ekl.auth';
const ADMIN_KEY = 'ekl.admin';

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

export function getAdminToken(): string | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(ADMIN_KEY) ?? 'null') as { token?: string | null } | null;
    return parsed?.token ?? null;
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null): void {
  if (token) localStorage.setItem(ADMIN_KEY, JSON.stringify({ token }));
  else localStorage.removeItem(ADMIN_KEY);
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
export async function apiFetch<T>(path: string, options: RequestInit = {}, admin = false): Promise<T> {
  const token = admin ? getAdminToken() : getStoredToken();
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

export function refreshToken(): Promise<{ token: string }> {
  return apiFetch('/api/auth/refresh', { method: 'POST' });
}

export async function logoutRequest(): Promise<void> {
  await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
}

// ── Пользователь ───────────────────────────────────────────────────────────

export function fetchMe(): Promise<User> {
  return apiFetch('/api/users/me');
}

export function updateMe(name: string): Promise<User> {
  return apiFetch('/api/users/me', { method: 'PUT', body: JSON.stringify({ name }) });
}

// ── Проекты ────────────────────────────────────────────────────────────────

export function fetchProjects(): Promise<Project[]> {
  return apiFetch('/api/projects');
}

export function fetchRecentProjects(): Promise<Project[]> {
  return apiFetch('/api/projects/recent');
}

export function fetchProject(id: string): Promise<Project> {
  return apiFetch(`/api/projects/${id}`);
}

export function createProject(title: string, data: string): Promise<Project> {
  return apiFetch('/api/projects', { method: 'POST', body: JSON.stringify({ title, data }) });
}

export function updateProject(id: string, patch: { title?: string; data?: string }): Promise<Project> {
  return apiFetch(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
}

export function deleteProject(id: string): Promise<void> {
  return apiFetch(`/api/projects/${id}`, { method: 'DELETE' });
}

export function importProject(file: File): Promise<Project> {
  const form = new FormData();
  form.append('file', file);
  return apiFetch('/api/projects/import', { method: 'POST', body: form });
}

// ── Шаблоны ────────────────────────────────────────────────────────────────

export function fetchTemplates(): Promise<Template[]> {
  return apiFetch('/api/templates');
}

// ── Библиотека компонентов ─────────────────────────────────────────────────

export interface ComponentQuery {
  q?: string;
  brandId?: string;
  categoryId?: string;
  type?: string;
}

export function fetchComponents(query: ComponentQuery = {}): Promise<ComponentItem[]> {
  const qs = new URLSearchParams();
  Object.entries(query).forEach(([k, v]) => { if (v) qs.set(k, String(v)); });
  const s = qs.toString();
  return apiFetch(`/api/components${s ? `?${s}` : ''}`);
}

export function searchComponents(q: string): Promise<ComponentItem[]> {
  return apiFetch(`/api/components/search?q=${encodeURIComponent(q)}`);
}

export function fetchFavorites(): Promise<ComponentItem[]> {
  return apiFetch('/api/components/favorites');
}

export function addFavorite(componentId: string): Promise<{ favorite: boolean }> {
  return apiFetch(`/api/components/${componentId}/favorite`, { method: 'POST' });
}

export function removeFavorite(componentId: string): Promise<void> {
  return apiFetch(`/api/components/${componentId}/favorite`, { method: 'DELETE' });
}

// ── Админ-панель ───────────────────────────────────────────────────────────

export function adminLogin(email: string, password: string): Promise<{ token: string; user: User }> {
  return apiFetch('/api/admin/auth', { method: 'POST', body: JSON.stringify({ email, password }) });
}

export interface AdminStats {
  users: number;
  projects: number;
  components: number;
  templates: number;
  newUsersToday: number;
  newProjectsToday: number;
  activeProjectsToday: number;
  growth: { day: number; week: number; month: number; year: number };
}

export function fetchAdminStats(): Promise<AdminStats> {
  return apiFetch('/api/admin/stats', {}, true);
}

export function fetchOnlineUsers(): Promise<User[]> {
  return apiFetch('/api/admin/online', {}, true);
}

export interface AuditRecord {
  id: string;
  adminId: string;
  action: string;
  details: string | null;
  ip: string | null;
  createdAt: string;
  admin: { name: string | null; phone: string } | null;
}

export function fetchAudit(): Promise<AuditRecord[]> {
  return apiFetch('/api/admin/audit', {}, true);
}

export function adminComponents(): Promise<ComponentItem[]> {
  return apiFetch('/api/admin/components', {}, true);
}

export function adminCreateComponent(form: FormData): Promise<ComponentItem> {
  return apiFetch('/api/admin/components', { method: 'POST', body: form }, true);
}

export function adminUpdateComponent(id: string, form: FormData): Promise<ComponentItem> {
  return apiFetch(`/api/admin/components/${id}`, { method: 'PUT', body: form }, true);
}

export function adminDeleteComponent(id: string): Promise<void> {
  return apiFetch(`/api/admin/components/${id}`, { method: 'DELETE' }, true);
}

export function fetchBrands(): Promise<Brand[]> {
  return apiFetch('/api/admin/brands', {}, true);
}

export function createBrand(data: { name: string; website?: string }): Promise<Brand> {
  return apiFetch('/api/admin/brands', { method: 'POST', body: JSON.stringify(data) }, true);
}

export function deleteBrand(id: string): Promise<void> {
  return apiFetch(`/api/admin/brands/${id}`, { method: 'DELETE' }, true);
}

export function fetchCategories(): Promise<Category[]> {
  return apiFetch('/api/admin/categories', {}, true);
}

export function createCategory(data: { name: string; parentId?: string | null }): Promise<Category> {
  return apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify(data) }, true);
}

export function deleteCategory(id: string): Promise<void> {
  return apiFetch(`/api/admin/categories/${id}`, { method: 'DELETE' }, true);
}

export function fetchAdminTemplates(): Promise<Template[]> {
  return apiFetch('/api/admin/templates', {}, true);
}

export function createTemplate(data: { name: string; category?: string; data: string }): Promise<Template> {
  return apiFetch('/api/admin/templates', { method: 'POST', body: JSON.stringify(data) }, true);
}

export function deleteTemplate(id: string): Promise<void> {
  return apiFetch(`/api/admin/templates/${id}`, { method: 'DELETE' }, true);
}

export function fetchAdminUsers(): Promise<User[]> {
  return apiFetch('/api/users', {}, true);
}

export function banUser(id: string, reason: string): Promise<User> {
  return apiFetch(`/api/users/${id}/ban`, { method: 'PUT', body: JSON.stringify({ reason }) }, true);
}

export function unbanUser(id: string): Promise<User> {
  return apiFetch(`/api/users/${id}/unban`, { method: 'PUT' }, true);
}

export function setUserRole(id: string, role: 'user' | 'admin'): Promise<User> {
  return apiFetch(`/api/users/${id}/role`, { method: 'PUT', body: JSON.stringify({ role }) }, true);
}

// ── Dev-режим (раздел 4.1.2, 4.18.7) ───────────────────────────────────────

export function fetchDevAdmins(): Promise<User[]> {
  return apiFetch('/api/admin/dev/admins');
}

export function fetchDevUsers(): Promise<User[]> {
  return apiFetch('/api/admin/dev/users');
}

export function devLoginAdmin(userId: string): Promise<{ token: string; user: User }> {
  return apiFetch('/api/admin/dev/login-admin', { method: 'POST', body: JSON.stringify({ userId }) });
}

export function devLoginEditor(userId: string): Promise<{ token: string; user: User }> {
  return apiFetch('/api/admin/dev/login-editor', { method: 'POST', body: JSON.stringify({ userId }) });
}

/**
 * Типы предметной области (этап 3).
 * Согласованы с ответами backend API (см. backend/src/routes).
 */

export type Role = 'user' | 'admin' | 'dev';

/** Пользователь — ответ GET /api/users/me и POST /api/auth/verify. */
export interface User {
  id: string;
  phone: string;
  name: string | null;
  role: Role;
  banned: boolean;
}

/** Проект — ответ /api/projects (поле data — строка JSON, Prisma String). */
export interface Project {
  id: string;
  userId: string;
  title: string;
  data: string;
  thumbnail: string | null;
  lastOpened: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Шаблон — ответ GET /api/templates. */
export interface Template {
  id: string;
  name: string;
  category: string | null;
  thumbnail: string | null;
  data: string;
  isDefault: boolean;
  createdAt: string;
}

/** Узел библиотеки компонентов (категория или компонент). */
export interface LibraryNode {
  id: string;
  name: string;
  parentId: string | null;
  isFavorite: boolean;
  children?: LibraryNode[];
}

export interface AuthSession {
  user: User | null;
  token: string | null;
}

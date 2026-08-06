/**
 * Базовые типы предметной области (каркас).
 * Полные типы для всех сущностей — на этапе 2.
 */

export interface User {
  id: string;
  phone: string;
  name: string | null;
  isAdmin: boolean;
  isBanned: boolean;
}

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  data: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/** Узел библиотеки компонентов (категория или компонент). */
export interface LibraryNode {
  id: string;
  name: string;
  parentId: string | null;
  isFavorite: boolean;
  children?: LibraryNode[];
}

export type Role = 'user' | 'admin' | 'dev';

export interface AuthSession {
  user: User | null;
  token: string | null;
}

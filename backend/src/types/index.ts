/** Общие типы backend (каркас, этап 1). */

export type Role = 'user' | 'admin' | 'dev';

/** Полезная нагрузка JWT. */
export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}

/** Пользователь, подставленный в запрос middleware-ами. */
export interface AuthedUser {
  id: string;
  phone: string;
  role: Role;
}

import type { Role } from '../types';

/** Секрет подписи JWT (7-дневная сессия, раздел 4.1.1). */
export const JWT_SECRET = process.env.JWT_SECRET ?? 'dev_secret_key';

/** Срок жизни токена — 7 дней. */
export const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  sub: string;
  phone: string;
  role: Role;
}

// TODO(этап 2): signToken / verifyToken (jsonwebtoken)

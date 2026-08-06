import type { RequestHandler } from 'express';

// TODO(этап 2): проверка JWT-токена и подстановка пользователя в req
export const requireAuth: RequestHandler = (_req, _res, next) => {
  next();
};

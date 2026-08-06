import type { RequestHandler } from 'express';

// TODO(этап 2): rate-limit для отправки SMS и ввода кода (раздел 4.1.1)
export const rateLimiter: RequestHandler = (_req, _res, next) => {
  next();
};

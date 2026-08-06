import type { RequestHandler } from 'express';

// TODO(этап 2): доступ только для роли Dev (см. раздел 4.1.2 спецификации)
export const requireDev: RequestHandler = (_req, _res, next) => {
  next();
};

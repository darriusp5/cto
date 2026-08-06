import type { RequestHandler } from 'express';

// TODO(этап 2): доступ только для администраторов (isAdmin)
export const requireAdmin: RequestHandler = (_req, _res, next) => {
  next();
};

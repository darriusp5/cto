import type { RequestHandler } from 'express';
import { prisma } from '../lib/prisma';
import { verifyToken } from '../lib/jwt';
import type { AuthRequest } from '../types';

/** Обязательная авторизация по Bearer JWT + обновление lastActive (онлайн-мониторинг, раздел 4.16.2). */
export const requireAuth: RequestHandler = (req, res, next) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Требуется авторизация' }); return; }
  try {
    const payload = verifyToken(header.slice(7));
    (req as AuthRequest).user = payload;
    // Активность пользователя — fire-and-forget, не чаще раза в минуту
    void prisma.user.updateMany({
      where: { id: payload.sub, lastActive: { lt: new Date(Date.now() - 60_000) } },
      data: { lastActive: new Date() },
    }).catch(() => undefined);
    next();
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
};

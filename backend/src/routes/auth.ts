import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { sendSms } from '../lib/sms';
import { signToken, verifyToken } from '../lib/jwt';
import { rateLimit } from '../middleware/rateLimit';
import type { AuthRequest } from '../types';

/** Авторизация по телефону + SMS (разделы 4.1, 4.18.1). */
const router = Router();

const phoneOk = (p: unknown): p is string => typeof p === 'string' && /^\+375\s?\(?\d{2}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/.test(p);
const codeOk = (c: unknown): c is string => typeof c === 'string' && /^\d{6}$/.test(c);

/** Отправить SMS-код: повторная отправка через 60 с, код живёт 5 минут. */
router.post('/send-code', rateLimit(10, 60_000), async (req, res) => {
  const phone = req.body?.phone;
  if (!phoneOk(phone)) { res.status(400).json({ error: 'Некорректный телефон' }); return; }

  const last = await prisma.smsCode.findFirst({ where: { phone }, orderBy: { sentAt: 'desc' } });
  if (last && Date.now() - last.sentAt.getTime() < 60_000) {
    res.status(429).json({ error: 'Повторная отправка через 60 секунд' });
    return;
  }
  const code = process.env.NODE_ENV === 'production' ? String(Math.floor(100000 + Math.random() * 900000)) : '123456';
  await prisma.smsCode.create({ data: { phone, code, expiresAt: new Date(Date.now() + 300_000) } });
  await sendSms({ phone, code });
  res.json({ message: 'Код отправлен' });
});

/** Проверить код: максимум 5 попыток → блокировка на 5 минут, авторегистрация. */
router.post('/verify', async (req, res) => {
  const { phone, code } = req.body ?? {};
  if (!phoneOk(phone) || !codeOk(code)) { res.status(400).json({ error: 'Некорректные данные' }); return; }

  const rec = await prisma.smsCode.findFirst({ where: { phone }, orderBy: { sentAt: 'desc' } });
  if (!rec) { res.status(400).json({ error: 'Код не найден' }); return; }
  if (rec.blockedUntil && rec.blockedUntil.getTime() > Date.now()) {
    res.status(423).json({ error: 'Вход заблокирован на 5 минут' }); return;
  }
  if (rec.expiresAt.getTime() < Date.now()) { res.status(400).json({ error: 'Код истёк' }); return; }
  if (rec.code !== code) {
    const attempts = rec.attempts + 1;
    await prisma.smsCode.update({ where: { id: rec.id }, data: { attempts, blockedUntil: attempts >= 5 ? new Date(Date.now() + 300_000) : null } });
    res.status(401).json({ error: attempts >= 5 ? 'Вход заблокирован на 5 минут' : 'Неверный код' });
    return;
  }

  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) user = await prisma.user.create({ data: { phone } });
  if (user.banned) { res.status(403).json({ error: 'Аккаунт заблокирован', reason: user.banReason }); return; }
  await prisma.user.update({ where: { id: user.id }, data: { lastActive: new Date() } });
  res.json({ token: signToken({ sub: user.id, phone: user.phone, role: user.role === 'admin' ? 'admin' : 'user' }), user });
});

/** Обновить токен: принимает действующий JWT, выдаёт новый (сессия 7 дней). */
router.post('/refresh', (req, res) => {
  const header = req.header('authorization');
  if (!header?.startsWith('Bearer ')) { res.status(401).json({ error: 'Требуется авторизация' }); return; }
  try {
    const payload = verifyToken(header.slice(7));
    res.json({ token: signToken({ sub: payload.sub, phone: payload.phone, role: payload.role }) });
  } catch {
    res.status(401).json({ error: 'Недействительный токен' });
  }
});

router.post('/logout', (_req, res) => res.json({ message: 'Выход выполнен' }));

export default router;

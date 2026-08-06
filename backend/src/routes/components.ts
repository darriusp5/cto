import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../types';

/** Библиотека компонентов: список, фильтры, умный поиск, избранное (разделы 4.6, 4.18.3). */
const r = Router();
r.use(requireAuth);

const includeLib = { brand: true, category: true };

/** Фильтры из query: brandId, categoryId, type, q. */
function filters(query: Record<string, unknown>) {
  const where: Record<string, unknown> = { active: true };
  if (typeof query.brandId === 'string' && query.brandId) where.brandId = query.brandId;
  if (typeof query.categoryId === 'string' && query.categoryId) where.categoryId = query.categoryId;
  if (typeof query.type === 'string' && query.type) where.type = query.type;
  return where;
}

/** Список избранного текущего пользователя (до /:id!). */
r.get('/favorites', async (req, res) => {
  const userId = (req as AuthRequest).user!.sub;
  const favs = await prisma.userFavorite.findMany({
    where: { userId },
    orderBy: { sortOrder: 'asc' },
    include: { component: { include: includeLib } },
  });
  res.json(favs.map((f) => ({ ...f.component, favoriteSort: f.sortOrder })));
});

/** Умный поиск (название, бренд, артикул, категория, тип, ток, полюса) — раздел 4.6.1. */
r.get('/search', async (req, res) => {
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  const where: Record<string, unknown> = { active: true };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { article: { contains: q } },
      { type: { contains: q } },
      { brand: { is: { name: { contains: q } } } },
      { category: { is: { name: { contains: q } } } },
      { params: { contains: q } },
    ];
  }
  const items = await prisma.component.findMany({ where, include: includeLib, take: 50 });
  res.json(items);
});

r.get('/', async (req, res) => {
  const items = await prisma.component.findMany({
    where: filters(req.query as Record<string, unknown>),
    include: includeLib,
    orderBy: { name: 'asc' },
  });
  res.json(items);
});

r.get('/:id', async (req, res) => {
  const c = await prisma.component.findUnique({ where: { id: req.params.id }, include: includeLib });
  c ? res.json(c) : res.status(404).json({ error: 'Компонент не найден' });
});

// ── Избранное (привязано к пользователю, максимум 20 — раздел 4.6.2) ───────
r.post('/:id/favorite', async (req, res) => {
  const userId = (req as AuthRequest).user!.sub;
  const count = await prisma.userFavorite.count({ where: { userId } });
  if (count >= 20) {
    res.status(400).json({ error: 'Максимум 20 компонентов в избранном' });
    return;
  }
  const last = await prisma.userFavorite.findFirst({ where: { userId }, orderBy: { sortOrder: 'desc' } });
  await prisma.userFavorite.upsert({
    where: { userId_componentId: { userId, componentId: req.params.id } },
    create: { userId, componentId: req.params.id, sortOrder: (last?.sortOrder ?? 0) + 1 },
    update: {},
  });
  res.json({ favorite: true });
});

r.delete('/:id/favorite', async (req, res) => {
  await prisma.userFavorite.deleteMany({
    where: { userId: (req as AuthRequest).user!.sub, componentId: req.params.id },
  });
  res.status(204).send();
});

export default r;

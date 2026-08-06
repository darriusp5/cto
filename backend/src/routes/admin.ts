import { Router } from 'express';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'node:path';
import { prisma } from '../lib/prisma';
import { signToken } from '../lib/jwt';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import type { AuthRequest } from '../types';

/** Админ-панель: вход по email/паролю, статистика, онлайн, аудит, CRUD (разделы 4.16, 4.18.6). */
const r = Router();

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';
const upload = multer({ storage: multer.diskStorage({ destination: UPLOAD_DIR, filename: (_r, f, cb) => cb(null, `${Date.now()}-${f.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`) }), limits: { fileSize: 10 * 1024 * 1024 } });

/** Логировать действие администратора в admin_audit. */
async function audit(req: AuthRequest, action: string, details?: unknown): Promise<void> {
  try {
    await prisma.adminAudit.create({
      data: {
        adminId: req.user!.sub,
        action,
        details: details !== undefined ? JSON.stringify(details) : null,
        ip: req.ip ?? null,
      },
    });
  } catch {
    /* аудит не должен ронять запрос */
  }
}

/** Вход по email + паролю (НЕ по телефону) — раздел 4.16. */
r.post('/auth', async (req, res) => {
  const email = req.body?.email;
  const password = req.body?.password;
  if (typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Email и пароль обязательны' });
    return;
  }
  const a = await prisma.admin.findUnique({ where: { email }, include: { user: true } });
  if (!a || !(await bcrypt.compare(password, a.passwordHash)) || a.user.banned) {
    res.status(401).json({ error: 'Неверные данные' });
    return;
  }
  res.json({ token: signToken({ sub: a.user.id, phone: a.user.phone, role: 'admin' }), user: a.user });
});

r.use(requireAuth, requireAdmin);

// ── Статистика и онлайн ─────────────────────────────────────────────────────
r.get('/stats', async (_req, res) => {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 3600 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
  const year = new Date(now.getTime() - 365 * 24 * 3600 * 1000);
  const [users, projects, components, templates, newUsersDay, newProjectsDay, activeProjects] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.component.count(),
    prisma.template.count(),
    prisma.user.count({ where: { createdAt: { gte: day } } }),
    prisma.project.count({ where: { createdAt: { gte: day } } }),
    prisma.project.count({ where: { updatedAt: { gte: day } } }),
  ]);
  const counts = async (from: Date) => prisma.user.count({ where: { createdAt: { gte: from } } });
  res.json({
    users,
    projects,
    components,
    templates,
    newUsersToday: newUsersDay,
    newProjectsToday: newProjectsDay,
    activeProjectsToday: activeProjects,
    growth: {
      day: await counts(day),
      week: await counts(week),
      month: await counts(month),
      year: await counts(year),
    },
  });
});

r.get('/online', async (_req, res) => {
  const online = await prisma.user.findMany({
    where: { lastActive: { gte: new Date(Date.now() - 15 * 60_000) } },
    select: { id: true, phone: true, name: true, role: true, lastActive: true },
    orderBy: { lastActive: 'desc' },
  });
  res.json(online);
});

r.get('/audit', async (_req, res) => {
  res.json(await prisma.adminAudit.findMany({ orderBy: { createdAt: 'desc' }, take: 200, include: { admin: { select: { name: true, phone: true } } } }));
});

// ── Компоненты (CRUD) ───────────────────────────────────────────────────────
r.get('/components', async (_req, res) => {
  res.json(await prisma.component.findMany({ include: { brand: true, category: true }, orderBy: { name: 'asc' } }));
});

r.post('/components', upload.single('preview'), async (req, res) => {
  const d = req.body as Record<string, unknown>;
  const parse = (v: unknown, fallback: unknown) => {
    if (typeof v !== 'string') return fallback;
    try { return JSON.parse(v); } catch { return fallback; }
  };
  const component = await prisma.component.create({
    data: {
      name: String(d.name ?? ''),
      article: typeof d.article === 'string' && d.article ? d.article : null,
      type: typeof d.type === 'string' && d.type ? d.type : null,
      brandId: typeof d.brandId === 'string' && d.brandId ? d.brandId : null,
      categoryId: typeof d.categoryId === 'string' && d.categoryId ? d.categoryId : null,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : (typeof d.imageUrl === 'string' && d.imageUrl ? d.imageUrl : null),
      terminals: JSON.stringify(parse(d.terminals, [])),
      params: d.params ? JSON.stringify(parse(d.params, {})) : null,
    },
  });
  await audit(req as AuthRequest, 'component.create', { id: component.id, name: component.name });
  res.status(201).json(component);
});

r.put('/components/:id', upload.single('preview'), async (req, res) => {
  const d = req.body as Record<string, unknown>;
  const update: Record<string, unknown> = {};
  if (typeof d.name === 'string') update.name = d.name;
  if (d.article !== undefined) update.article = d.article || null;
  if (d.type !== undefined) update.type = d.type || null;
  if (d.brandId !== undefined) update.brandId = d.brandId || null;
  if (d.categoryId !== undefined) update.categoryId = d.categoryId || null;
  if (d.active !== undefined) update.active = d.active === true || d.active === 'true';
  if (typeof d.terminals === 'string') update.terminals = d.terminals;
  if (typeof d.params === 'string') update.params = d.params;
  if (req.file) update.imageUrl = `/uploads/${req.file.filename}`;
  const component = await prisma.component.update({ where: { id: req.params.id }, data: update });
  await audit(req as AuthRequest, 'component.update', { id: component.id });
  res.json(component);
});

r.delete('/components/:id', async (req, res) => {
  await prisma.component.delete({ where: { id: req.params.id } }).catch(() => undefined);
  await audit(req as AuthRequest, 'component.delete', { id: req.params.id });
  res.status(204).send();
});

// ── Категории (CRUD) ────────────────────────────────────────────────────────
r.get('/categories', async (_req, res) => {
  res.json(await prisma.category.findMany({ include: { children: true }, orderBy: { sortOrder: 'asc' } }));
});

r.post('/categories', async (req, res) => {
  const c = await prisma.category.create({
    data: { name: String(req.body?.name ?? ''), parentId: typeof req.body?.parentId === 'string' && req.body.parentId ? req.body.parentId : null },
  });
  await audit(req as AuthRequest, 'category.create', { id: c.id, name: c.name });
  res.status(201).json(c);
});

r.put('/categories/:id', async (req, res) => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.name === 'string') update.name = req.body.name;
  if (req.body?.parentId !== undefined) update.parentId = req.body.parentId || null;
  if (typeof req.body?.sortOrder === 'number') update.sortOrder = req.body.sortOrder;
  const c = await prisma.category.update({ where: { id: req.params.id }, data: update });
  await audit(req as AuthRequest, 'category.update', { id: c.id });
  res.json(c);
});

r.delete('/categories/:id', async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } }).catch(() => undefined);
  await audit(req as AuthRequest, 'category.delete', { id: req.params.id });
  res.status(204).send();
});

// ── Бренды (CRUD) ───────────────────────────────────────────────────────────
r.get('/brands', async (_req, res) => {
  res.json(await prisma.brand.findMany({ orderBy: { name: 'asc' } }));
});

r.post('/brands', async (req, res) => {
  const b = await prisma.brand.create({
    data: {
      name: String(req.body?.name ?? ''),
      logoUrl: typeof req.body?.logoUrl === 'string' ? req.body.logoUrl : null,
      website: typeof req.body?.website === 'string' ? req.body.website : null,
    },
  });
  await audit(req as AuthRequest, 'brand.create', { id: b.id, name: b.name });
  res.status(201).json(b);
});

r.put('/brands/:id', async (req, res) => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.name === 'string') update.name = req.body.name;
  if (req.body?.logoUrl !== undefined) update.logoUrl = req.body.logoUrl || null;
  if (req.body?.website !== undefined) update.website = req.body.website || null;
  if (req.body?.active !== undefined) update.active = req.body.active === true;
  const b = await prisma.brand.update({ where: { id: req.params.id }, data: update });
  await audit(req as AuthRequest, 'brand.update', { id: b.id });
  res.json(b);
});

r.delete('/brands/:id', async (req, res) => {
  await prisma.brand.delete({ where: { id: req.params.id } }).catch(() => undefined);
  await audit(req as AuthRequest, 'brand.delete', { id: req.params.id });
  res.status(204).send();
});

// ── Шаблоны (CRUD) ──────────────────────────────────────────────────────────
r.get('/templates', async (_req, res) => {
  res.json(await prisma.template.findMany({ orderBy: { createdAt: 'desc' } }));
});

r.post('/templates', async (req, res) => {
  const t = await prisma.template.create({
    data: {
      name: String(req.body?.name ?? ''),
      category: typeof req.body?.category === 'string' ? req.body.category : null,
      thumbnail: typeof req.body?.thumbnail === 'string' ? req.body.thumbnail : null,
      data: typeof req.body?.data === 'string' ? req.body.data : JSON.stringify(req.body?.data ?? {}),
      isDefault: req.body?.isDefault === true,
    },
  });
  await audit(req as AuthRequest, 'template.create', { id: t.id, name: t.name });
  res.status(201).json(t);
});

r.put('/templates/:id', async (req, res) => {
  const update: Record<string, unknown> = {};
  if (typeof req.body?.name === 'string') update.name = req.body.name;
  if (typeof req.body?.category === 'string') update.category = req.body.category;
  if (typeof req.body?.thumbnail === 'string') update.thumbnail = req.body.thumbnail;
  if (typeof req.body?.data === 'string') update.data = req.body.data;
  if (req.body?.isDefault !== undefined) update.isDefault = req.body.isDefault === true;
  const t = await prisma.template.update({ where: { id: req.params.id }, data: update });
  await audit(req as AuthRequest, 'template.update', { id: t.id });
  res.json(t);
});

r.delete('/templates/:id', async (req, res) => {
  await prisma.template.delete({ where: { id: req.params.id } }).catch(() => undefined);
  await audit(req as AuthRequest, 'template.delete', { id: req.params.id });
  res.status(204).send();
});

export default r;

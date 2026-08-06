import { Router } from 'express';
import multer from 'multer';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../middleware/auth';
import type { AuthRequest } from '../types';
import { asRecord } from '../types';

/** Проекты: CRUD, последние, импорт .kul (разделы 4.2, 4.18.2). */
const r = Router();
r.use(requireAuth);

const uid = (req: AuthRequest): string => req.user!.sub;

async function owned(id: string, userId: string) {
  return prisma.project.findFirst({ where: { id, userId } });
}

r.get('/', async (req, res) => {
  res.json(await prisma.project.findMany({ where: { userId: uid(req as AuthRequest) }, orderBy: { updatedAt: 'desc' } }));
});

r.get('/recent', async (req, res) => {
  res.json(await prisma.project.findMany({ where: { userId: uid(req as AuthRequest) }, orderBy: { lastOpened: 'desc' }, take: 5 }));
});

r.get('/:id', async (req, res) => {
  const p = await owned(req.params.id, uid(req as AuthRequest));
  if (!p) { res.status(404).json({ error: 'Проект не найден' }); return; }
  await prisma.project.update({ where: { id: p.id }, data: { lastOpened: new Date() } });
  res.json(p);
});

r.post('/', async (req, res) => {
  const title = req.body?.title;
  if (typeof title !== 'string' || title.length < 3 || title.length > 20) {
    res.status(400).json({ error: 'Название: 3–20 символов' });
    return;
  }
  const data = typeof req.body?.data === 'string' ? req.body.data : JSON.stringify(req.body?.data ?? {});
  res.status(201).json(await prisma.project.create({ data: { title, userId: uid(req as AuthRequest), data } }));
});

r.put('/:id', async (req, res) => {
  const p = await owned(req.params.id, uid(req as AuthRequest));
  if (!p) { res.status(404).json({ error: 'Проект не найден' }); return; }
  const d = asRecord(req.body);
  const update: Record<string, unknown> = {};
  if (typeof d.title === 'string') update.title = d.title;
  if (typeof d.data === 'string') update.data = d.data;
  if (typeof d.thumbnail === 'string') update.thumbnail = d.thumbnail;
  res.json(await prisma.project.update({ where: { id: p.id }, data: update }));
});

r.delete('/:id', async (req, res) => {
  const p = await owned(req.params.id, uid(req as AuthRequest));
  if (!p) { res.status(404).json({ error: 'Проект не найден' }); return; }
  await prisma.project.delete({ where: { id: p.id } });
  res.status(204).send();
});

/** Импорт .kul файла (POST /api/projects/import, multipart/form-data) — раздел 4.2.2. */
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
r.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'Файл .kul обязателен (поле file)' });
      return;
    }
    const raw = req.file.buffer.toString('utf-8');
    const doc = JSON.parse(raw) as { metadata?: { title?: unknown }; page?: unknown; pages?: unknown };
    if (!doc || typeof doc !== 'object' || !doc.metadata || !doc.pages) {
      res.status(400).json({ error: 'Некорректный .kul файл' });
      return;
    }
    const title = typeof doc.metadata?.title === 'string' ? doc.metadata.title : 'Импортированный проект';
    const safeTitle = title.length >= 3 && title.length <= 20 ? title : 'Импорт ' + title.slice(0, 12);
    const project = await prisma.project.create({
      data: { title: safeTitle, userId: uid(req as AuthRequest), data: raw },
    });
    res.status(201).json(project);
  } catch {
    res.status(400).json({ error: 'Не удалось разобрать .kul файл' });
  }
});

export default r;

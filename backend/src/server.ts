import 'dotenv/config';

import cors from 'cors';
import express from 'express';
import path from 'node:path';

import adminRouter from './routes/admin';
import authRouter from './routes/auth';
import componentsRouter from './routes/components';
import devRouter from './routes/dev';
import projectsRouter from './routes/projects';
import templatesRouter from './routes/templates';
import usersRouter from './routes/users';

const app = express();
const PORT = Number(process.env.PORT ?? 3000);
const UPLOAD_DIR = process.env.UPLOAD_DIR ?? 'uploads';

app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Статика загруженных файлов (этап 2: изображения компонентов)
app.use('/uploads', express.static(path.join(__dirname, '..', UPLOAD_DIR)));

// Health-check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', service: 'ekl-backend', time: new Date().toISOString() });
});

// Маршруты (наполняются на этапе 2)
// ВАЖНО: /api/admin/dev монтируется ДО /api/admin, чтобы не перехватываться им.
app.use('/api/admin/dev', devRouter);
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/components', componentsRouter);
app.use('/api/templates', templatesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/users', usersRouter);

// 404 для неизвестных API-путей
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`📱 ekl.by backend listening on http://localhost:${PORT}`);
});

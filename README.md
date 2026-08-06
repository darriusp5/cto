# ekl.by

SaaS-приложение для проектирования монтажных электрических схем: создание, редактирование
и экспорт электрических схем с возможностью трассировки проводов.

> ⚙️ Статус: **этап 2 — backend API реализован**. Frontend и расширенные функции редактора развиваются по этапам спецификации.

## Технологический стек

| Слой | Технологии |
|------|-----------|
| Frontend | React 18, TypeScript 5, Vite 5, TailwindCSS 3, shadcn/ui, Zustand 4, JointJS 3, React Hook Form 7, Zod 3, html-to-image 1 |
| Backend | Node.js 20, Express 4, Prisma 5, PostgreSQL 15 (prod) / SQLite (dev), JWT, Multer, bcrypt |
| Инфраструктура | Docker Compose, Nginx, GitHub Actions |

## Структура проекта

```
├── frontend/          # Vite + React приложение
│   ├── src/
│   │   ├── components/{auth,canvas,library,inspector,toolbar,menu,start-screen,admin,ui}
│   │   ├── stores/    # Zustand: authStore, projectStore, editorStore, libraryStore
│   │   ├── hooks/     # Кастомные хуки
│   │   ├── lib/       # jointConfig, fileParser, export, auth, validation, constants
│   │   ├── types/
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── public/jointjs # JointJS, отдаётся локально (без CDN)
├── backend/           # Express + Prisma API
│   ├── src/{routes,controllers,services,middleware,lib,types}
│   ├── prisma/schema.prisma
│   └── uploads/
├── docker-compose.yml
├── .env.example
└── .github/workflows/ci.yml
```

## Локальная разработка

Требования: Node.js 20+ (проверено на 22), npm 10+.

### Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173 (API проксируется на :3000)
```

### Backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma generate
npm run dev          # http://localhost:3000 (health: /api/health)
```

> **База данных (dev):** по умолчанию схема Prisma настроена на PostgreSQL (совпадает с
> docker-compose и production). Для локальной разработки без Docker переключите в
> `backend/prisma/schema.prisma` `provider = "postgresql"` → `provider = "sqlite"` и задайте
> в `.env` `DATABASE_URL=sqlite:./dev.db`, затем `npx prisma db push`. Полноценное
> двухсхемное решение (dev/prod) появится на этапе 2 вместе с полными моделями.

### Проверка сборки

```bash
# frontend
cd frontend && npm run build        # tsc -b && vite build

# backend
cd backend && npx prisma generate && npm run typecheck
```

## Запуск через Docker (production-конфигурация)

```bash
cp .env.example .env   # задайте DB_PASSWORD, JWT_SECRET
docker-compose -f docker-compose.yml up -d --build
```

- Frontend (Nginx + SPA): http://localhost:80
- Backend API: http://localhost:3000 (`/api/health`)
- PostgreSQL 15: localhost:5432

Nginx в frontend-контейнере проксирует `/api/*` и `/uploads/*` на backend-контейнер.

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) на push в `main` и pull-request:

- **frontend**: `npm ci` → `npm run build` (tsc + vite);
- **backend**: `npm ci` → `prisma validate && prisma generate` → `npm run typecheck`.

## Спецификация

Полный промт проекта — [`ekl.by_promt.md`](./ekl.by_promt.md) (в корне репозитория).

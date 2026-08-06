# ekl.by

SaaS-приложение для проектирования монтажных электрических схем: создание, редактирование
и экспорт электрических схем с возможностью трассировки проводов.

> ⚙️ Статус: **этап 6 — backend API и frontend foundation завершены; редакторский UI остаётся следующим coding stage**. Frontend и расширенные функции редактора развиваются по этапам спецификации.

## Handoff для следующего разработчика (статус на 2026-08-06)

### Текущий этап и что завершено

- Backend stages 2 и 6: Express/Prisma API, авторизация по телефону/SMS и refresh, проекты (CRUD, импорт `.kul`, thumbnail), библиотека компонентов с избранным и поиском, шаблоны, users/dev/admin endpoints, admin CRUD/audit/stats/online, rate limiting, Prisma seed-данные.
- Frontend stage 3: auth/start screen/header/create-project flow и базовые экраны.
- Frontend stages 4–6 foundation (commit `2e046f6`): доменные типы, `.kul` serialize/parse, импорт файлов, PNG/SVG/JPEG/KUL/PDF-print export, API client, imperative editor bridge, toast helper, editor/library/project stores; импорт `.kul` подключён в StartScreen.
- Рабочая ветка на момент handoff: `main`, локально два коммита впереди `origin/main`; этот handoff должен быть отдельным documentation-only commit.

### Точные файлы и модули

- Frontend entry/routing shell: `frontend/src/App.tsx`, `frontend/src/main.tsx`.
- Editor UI modules: `frontend/src/components/editor/EditorScreen.tsx`, `frontend/src/components/canvas/Canvas.tsx`, `frontend/src/components/toolbar/Toolbar.tsx`, `frontend/src/components/library/LibraryPanel.tsx`, `frontend/src/components/inspector/InspectorPanel.tsx`, `frontend/src/components/menu/MenuBar.tsx`.
- Foundation modules changed in stage 4–6: `frontend/src/lib/kul.ts`, `frontend/src/lib/fileParser.ts`, `frontend/src/lib/export.ts`, `frontend/src/lib/auth.ts`, `frontend/src/lib/constants.ts`, `frontend/src/lib/editorBridge.ts`, `frontend/src/lib/toast.ts`, `frontend/src/stores/editorStore.ts`, `frontend/src/stores/libraryStore.ts`, `frontend/src/stores/projectStore.ts`, `frontend/src/types/index.ts`.
- Backend API modules: `backend/src/server.ts`; routes `backend/src/routes/{auth,projects,components,templates,users,admin,dev}.ts`; middleware `backend/src/middleware/{auth,admin,isDev,rateLimit}.ts`; Prisma schema/seed `backend/prisma/{schema.prisma,seed.ts}`.

### Verification status

- PASS: `cd frontend && npm run build` (`tsc -b && vite build`; Vite build completed successfully).
- PASS: `cd backend && npx tsc --noEmit`.
- Not yet verified: browser end-to-end flows, live API/database integration, and production Docker/CI run.

### Blockers / known gaps

- No compile blocker is known. The editor is still a visible placeholder: `EditorScreen`, `Canvas`, and `Toolbar` do not mount a real JointJS graph or wire the editor bridge/actions; library/inspector/menu/admin UI integration is incomplete. Autosave is only foundation-ready.
- The backend requires configured environment/database for live integration verification; no automated test suite is present in the repository.

### Precise first next coding step

Replace the placeholder in `frontend/src/components/editor/EditorScreen.tsx` with the real editor layout and mount `Canvas` in it. Then implement `frontend/src/components/canvas/Canvas.tsx` as a JointJS paper/graph with the existing `editorStore` document and `editorBridge` action registry, before adding toolbar/library/inspector event wiring. Preserve the `.kul` document model and export/import contracts in `frontend/src/lib/kul.ts` and `frontend/src/lib/export.ts`.

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

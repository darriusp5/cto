FROM node:20-alpine AS builder

WORKDIR /app

# PostgreSQL-URL нужен только для prisma generate (подключение не выполняется)
ENV DATABASE_URL=postgresql://ekl:ekl@postgres:5432/ekl

COPY package*.json ./
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --no-audit --no-fund

COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
COPY uploads ./uploads

EXPOSE 3000
CMD ["node", "dist/server.js"]

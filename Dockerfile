# ---- 基底：Node 22 + Prisma 需要的 openssl ----
FROM node:22-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- 安裝相依套件（含 devDependencies，build/seed 會用到）----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- 建置 ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# 產生 Prisma Client（引擎與 runner 同基底，平台相容）
RUN npx prisma generate
# Next.js 正式版建置
RUN npm run build

# ---- 執行 ----
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/src/generated ./src/generated
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000
# 啟動時先跑 migration + seed，再啟動伺服器
CMD ["./docker-entrypoint.sh"]

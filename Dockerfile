# syntax=docker/dockerfile:1
#
# Klinik Pratama Sahaduta — prototype app
# Multi-stage, non-root, production-grade image.
#
# Build:  docker build -t sahaduta-app -f prototype/Dockerfile prototype/
# Verify: (LazyDocker) ... ; docker compose up --build
#
# Required runtime env:
#   DATABASE_URL        PostgreSQL DSN (host: `db` when run via compose)
#   SECRET              secret key for signed session cookies (fallback: dev secret)

# ------------------------------------------------------------------
# Stage 1: dependencies (cache layer — only invalidated by dep changes)
# ------------------------------------------------------------------
FROM node:22-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund --loglevel=error

# ------------------------------------------------------------------
# Stage 2: build — generate Prisma client + compile the app
# ------------------------------------------------------------------
FROM deps AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Prisma CLI needs DATABASE_URL present at generate time; a placeholder is enough
# because the real connection string is only used at runtime via the pg adapter.
ARG DATABASE_URL_BUILD=postgresql://build:build@localhost:5432/build?schema=public
ENV DATABASE_URL=$DATABASE_URL_BUILD

COPY . .
RUN npx prisma generate \
  && npm run build

# ------------------------------------------------------------------
# Stage 3: runtime — minimal image, non-root user
# ------------------------------------------------------------------
FROM node:22-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    NEXT_TELEMETRY_DISABLED=1 \
    NODE_PATH=/usr/local/lib/node_modules

# tini: proper signal/pid-1 handling. openssl: required by Prisma engines.
# The Prisma CLI (for `migrate deploy`) + dotenv (required by prisma7.config.ts)
# are installed globally so they are resolvable from the standalone runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates openssl tini \
  && rm -rf /var/lib/apt/lists/* \
  && npm install -g --no-audit --no-fund --loglevel=error "prisma@7.10.0" dotenv \
  && npm cache clean --force

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs --create-home --shell /bin/sh nextjs

# Next.js standalone server (self-contained: server.js + traced node_modules)
COPY --from=builder /app/.next/standalone ./
# Static assets (serve via CDN in real prod; here bundled for a single container)
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
# Prisma sources for `prisma migrate deploy` at container start
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma7.config.ts ./prisma7.config.ts

COPY docker-entrypoint.sh /app/docker-entrypoint.sh

RUN chmod +x /app/docker-entrypoint.sh \
  && mkdir -p /app/.next/cache \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/usr/bin/tini", "--", "/app/docker-entrypoint.sh"]
CMD ["node", "server.js"]
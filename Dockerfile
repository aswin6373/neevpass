# NeevPass production image — the prebuilt standalone Next.js server.
#
# Multi-stage: install/build run with the full workspace, then a minimal
# runtime copies ONLY apps/web/.next/standalone (Next has already assembled
# server dependencies and pruned everything else inside it).
#
# Build:   docker build --build-arg NEXT_PUBLIC_APP_URL="https://your-domain" -t neevpass .
# Run:     docker run --rm -p 3000:3000 \
#            -e DATABASE_URL="postgresql://user:pass@db-host:5432/neevpass?schema=public" \
#            -e AUTH_SECRET="$(openssl rand -base64 32)" \
#            -e AUTH_URL="https://your-domain" \
#            -e NEXT_PUBLIC_APP_URL="https://your-domain" \
#            neevpass
#
# Environment variables only — no .env file is baked into the image.

# --- Stage 1: dependencies ---------------------------------------------------
FROM node:22-alpine AS deps
WORKDIR /repo
COPY package.json package-lock.json .npmrc ./
COPY packages/config/package.json packages/config/
COPY packages/db/package.json packages/db/
COPY packages/docgen/package.json packages/docgen/
COPY packages/domain/package.json packages/domain/
COPY packages/ui/package.json packages/ui/
COPY apps/web/package.json apps/web/
# `npm ci` runs the db package's postinstall (`prisma generate`), so the schema
# and config must be present before dependencies are installed.
COPY packages/db/prisma.config.ts packages/db/
COPY packages/db/prisma packages/db/prisma
RUN npm ci

# --- Stage 2: full workspace build -------------------------------------------
FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
# The build collects server configuration, so it needs syntactically valid
# environment values even though no database is contacted. These are scoped to
# this build stage and never reach the runtime image.
ARG NEXT_PUBLIC_APP_URL="http://localhost:3000"
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" \
    AUTH_SECRET="build-only-placeholder-secret-not-used-at-runtime" \
    AUTH_URL="${NEXT_PUBLIC_APP_URL}" \
    AUTH_TRUST_HOST="true" \
    sh -c 'npm run db:generate && npm run build'

# --- Stage 3: runtime ---------------------------------------------------------
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Non-root user for the server process.
RUN addgroup -S neevpass && adduser -S neevpass -G neevpass

COPY --from=build --chown=neevpass:neevpass /repo/apps/web/.next/standalone/apps/web ./
# Static assets Next intentionally excludes from the standalone bundle.
COPY --from=build --chown=neevpass:neevpass /repo/apps/web/.next/static ./.next/static
COPY --from=build --chown=neevpass:neevpass /repo/apps/web/public ./public

# Uploaded profile photos live on disk. Mount a volume here in production so a
# container restart does not orphan the database's FileAsset rows.
RUN mkdir -p /app/.uploads && chown neevpass:neevpass /app/.uploads
ENV UPLOAD_DIR=/app/.uploads

USER neevpass
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then((r) => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"]

# The generated server.js reads DATABASE_URL / AUTH_SECRET / AUTH_URL from the
# environment at runtime. The app also validates every variable on boot and
# exits with a clear message when something is missing.
CMD ["node", "server.js"]

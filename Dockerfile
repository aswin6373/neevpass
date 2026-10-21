# NeevPass production image — the prebuilt standalone Next.js server.
#
# Multi-stage: install/build run with the full workspace, then a minimal
# runtime copies ONLY apps/web/.next/standalone (Next has already assembled
# server dependencies and pruned everything else inside it).
#
# Build:   docker build -t neevpass .
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
# `npm ci` triggers the db package's prepare-less prisma generate? None exists;
# generation happens during the build stage where sources are present.
RUN npm ci

# --- Stage 2: full workspace build -------------------------------------------
FROM node:22-alpine AS build
WORKDIR /repo
COPY --from=deps /repo/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.base.json ./
COPY packages ./packages
COPY apps ./apps
RUN npm run db:generate && npm run build

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

USER neevpass
EXPOSE 3000

# The generated server.js reads DATABASE_URL / AUTH_SECRET / AUTH_URL from the
# environment at runtime. The app also validates every variable on boot and
# exits with a clear message when something is missing.
CMD ["node", "server.js"]

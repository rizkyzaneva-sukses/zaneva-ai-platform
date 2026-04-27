# ============================================================
# Stage 1: Build Frontend (Vite React)
# ============================================================
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ============================================================
# Stage 2: Build Backend (TypeScript)
# ============================================================
FROM node:20-alpine AS backend-builder

# Install OpenSSL untuk Prisma engine
RUN apk add --no-cache openssl

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================================
# Stage 3: Production runner
# ============================================================
FROM node:20-alpine AS runner

# Install OpenSSL untuk Prisma engine di runtime
RUN apk add --no-cache openssl

WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

# Copy built backend
COPY --from=backend-builder --chown=appuser:nodejs /app/dist ./dist
COPY --from=backend-builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=backend-builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=backend-builder --chown=appuser:nodejs /app/package.json ./package.json

# Copy built frontend into backend's serving dir
COPY --from=frontend-builder --chown=appuser:nodejs /frontend/dist ./frontend-dist

USER appuser

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

# Resolve failed migration (jika ada) lalu jalankan migration + server
CMD ["sh", "-c", "npx prisma migrate resolve --rolled-back 20240101000000_init 2>/dev/null || true && npx prisma migrate deploy && node dist/server.js"]

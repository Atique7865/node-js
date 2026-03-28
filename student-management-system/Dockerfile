# ─── Stage 1: Build dependencies ─────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --omit=dev

# ─── Stage 2: Final image ─────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy backend source
COPY backend/package.json ./
COPY backend/src           ./src

# Copy frontend static files (served by Express)
COPY frontend              ./frontend

# Non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["node", "src/server.js"]

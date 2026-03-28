# ──────────────────────────────────────────────────────────────
# Backend Dockerfile  (Node.js + Express + PostgreSQL driver)
# ──────────────────────────────────────────────────────────────
#
# HOW IT WORKS:
#   Stage 1 (deps)  – install only production npm packages
#   Stage 2 (final) – copy app source + pre-built node_modules
#
# Two stages keep the final image small: build tools used in
# Stage 1 are NOT included in the image that actually runs.
# ──────────────────────────────────────────────────────────────

# ── Stage 1: Install dependencies ─────────────────────────────
FROM node:20-alpine AS deps

# Set a working directory inside the container
WORKDIR /app

# Copy only package files first.
# Docker caches this layer – npm install only re-runs when
# package.json / package-lock.json actually change.
COPY package*.json ./

# Install production dependencies only (skip devDependencies)
RUN npm install --omit=dev


# ── Stage 2: Final runtime image ──────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Copy the pre-built node_modules from Stage 1
COPY --from=deps /app/node_modules ./node_modules

# Copy application source code
COPY package.json ./
COPY src          ./src

# Create a non-root user for security (best practice)
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Document which port this container listens on
EXPOSE 3000

# Health check – Docker will mark container "unhealthy" if this fails
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

# Start the Node.js server
CMD ["node", "src/server.js"]

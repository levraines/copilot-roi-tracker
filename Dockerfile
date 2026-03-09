# ============================================================
# Copilot Agent ROI Tracker — Multi-stage Docker build
# Produces a single container that serves the React SPA + API
# ============================================================

# ---- Stage 1: Build the React frontend ----
FROM node:20-alpine AS client-build
WORKDIR /app
COPY shared/ ./shared/
COPY client/package*.json ./client/
RUN cd client && npm ci
COPY client/ ./client/
RUN cd client && npm run build

# ---- Stage 2: Build the Express server ----
FROM node:20-alpine AS server-build
WORKDIR /app
COPY shared/ ./shared/
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
RUN cd server && npm run build

# ---- Stage 3: Production image ----
FROM node:20-alpine AS production
WORKDIR /app

# Install only production dependencies
COPY server/package*.json ./
RUN npm ci --omit=dev

# Copy compiled server (rootDir=".." produces dist/server/src and dist/shared)
COPY --from=server-build /app/server/dist ./dist

# Copy built React SPA into public/
COPY --from=client-build /app/client/dist ./public

# Create data directory for SQLite
RUN mkdir -p /app/data

# Environment
ENV NODE_ENV=production
ENV PORT=8080
ENV STATIC_DIR=/app/public
ENV DB_DIR=/app/data

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:8080/api/health || exit 1

CMD ["node", "dist/server/src/index.js"]

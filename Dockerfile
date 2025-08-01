# Multi-stage build for React + Node.js app (v2)
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy root package files (for concurrently)
COPY package*.json ./

# Install root dependencies
RUN npm ci --only=production

# Build frontend
WORKDIR /app/frontend
COPY react-dashboard/frontend/package*.json ./
RUN npm ci --only=production
COPY react-dashboard/frontend/ ./
RUN npm run build

# Build backend (install dependencies)
WORKDIR /app/backend
COPY react-dashboard/backend/package*.json ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy backend files
COPY --from=build /app/backend ./backend
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY react-dashboard/backend/ ./backend/

# Copy frontend build
COPY --from=build /app/frontend/build ./frontend/build

# Copy root package.json
COPY --from=build /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]# Cache buster Fri Aug  1 06:56:50 CEST 2025

# FINAL VERSION - React Dashboard Production Build
# This Dockerfile builds the lecture-final React dashboard application
FROM node:20-alpine AS build_stage

# Create app directory  
WORKDIR /application

# Install root dependencies first (if any)
COPY package*.json ./
RUN npm ci --only=production || true

# Build Frontend (React)
WORKDIR /application/frontend
COPY react-dashboard/frontend/package*.json react-dashboard/frontend/package-lock.json* ./
RUN npm ci --only=production
COPY react-dashboard/frontend/ ./
RUN npm run build

# Setup Backend
WORKDIR /application/backend  
COPY react-dashboard/backend/package*.json react-dashboard/backend/package-lock.json* ./
RUN npm ci --only=production

# Production stage
FROM node:20-alpine AS runtime

WORKDIR /application

# Copy built frontend
COPY --from=build_stage /application/frontend/build ./frontend/build

# Copy backend
COPY --from=build_stage /application/backend ./backend
COPY react-dashboard/backend/ ./backend/

# Create user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Set ownership
RUN chown -R nodejs:nodejs /application
USER nodejs

# Expose port
EXPOSE 5000

# Start backend server
WORKDIR /application/backend
CMD ["node", "server.js"] Build timestamp: Fri Aug  1 07:02:15 CEST 2025

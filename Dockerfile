# Multi-stage build for production optimization
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S trading -u 1001

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=trading:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=trading:nodejs /app/package*.json ./
COPY --from=builder --chown=trading:nodejs /app/server ./server
COPY --from=builder --chown=trading:nodejs /app/client ./client
COPY --from=builder --chown=trading:nodejs /app/shared ./shared
COPY --from=builder --chown=trading:nodejs /app/*.config.* ./
COPY --from=builder --chown=trading:nodejs /app/*.json ./

# Install Python dependencies for trading engine
RUN apk add --no-cache python3 py3-pip
COPY requirements.txt ./
RUN pip3 install --no-cache-dir -r requirements.txt

# Create logs directory
RUN mkdir -p /app/logs && chown trading:nodejs /app/logs

# Switch to non-root user
USER trading

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/system/health || exit 1

# Start the application
CMD ["npm", "start"]
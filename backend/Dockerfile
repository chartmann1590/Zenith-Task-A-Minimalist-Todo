# Backend Dockerfile for Node.js/Express Todo App
FROM node:18-alpine

# Install wget for health checks
RUN apk add --no-cache wget

# Create app directory
WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Make health check script executable
RUN chmod +x health-check.js

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Create data directory for SQLite database
RUN mkdir -p /app/data

# Change ownership of the app directory and data directory
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
  CMD node health-check.js

# Start the application
CMD ["npm", "start"]
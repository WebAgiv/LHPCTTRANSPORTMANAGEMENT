# AITRC Transport ERP — Node.js Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (Docker cache optimization)
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY src/ ./src/

# Create directories
RUN mkdir -p uploads/bills logs

# Non-root user for security
RUN addgroup -g 1001 -S nodejs && adduser -S aitrc -u 1001
RUN chown -R aitrc:nodejs /app
USER aitrc

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

CMD ["node", "src/server.js"]

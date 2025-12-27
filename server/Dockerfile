# Dockerfile for Fly.io deployment
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (including optional dependencies like better-sqlite3)
RUN npm ci --include=optional

# Copy application files
COPY . .

# Create data directory for database
RUN mkdir -p /data

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]


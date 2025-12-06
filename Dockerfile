# Use official Node LTS image
FROM node:22-alpine

# Create app directory
WORKDIR /app

# Install OS deps needed by node-gyp (if any packages require)
RUN apk add --no-cache python3 make g++

# Copy package manifests first for better caching
COPY package.json package-lock.json* ./

# Install production dependencies
RUN npm ci --omit=dev || npm install --omit=dev

# Copy source code
COPY . .

# Ensure uploads directory exists (for multer)
RUN mkdir -p /app/uploads

# Environment
ENV NODE_ENV=production
ENV PORT=5050

# Expose service port
EXPOSE 5050

# Healthcheck (optional): checks server port is listening
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
 CMD wget -qO- http://localhost:${PORT}/ || exit 1

# Run the app
CMD ["node", "src/index.js"]

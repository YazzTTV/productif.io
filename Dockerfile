# Dockerfile for scheduler service
FROM node:22

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY .npmrc ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3002

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Start the scheduler service
CMD ["npm", "run", "start:scheduler"] 
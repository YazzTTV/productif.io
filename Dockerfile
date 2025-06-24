# Dockerfile
FROM node:18

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY prisma ./prisma/

# Install pnpm
RUN npm install -g pnpm

# Install dependencies
RUN pnpm install

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application
COPY . .

# Expose the port the app runs on
EXPOSE 3001

# Add healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl

# Start the WhatsApp server
CMD ["pnpm", "start:whatsapp"] 
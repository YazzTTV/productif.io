# Dockerfile
FROM node:18

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./

# Installer PNPM
RUN npm install -g pnpm

# Installer les dépendances
RUN pnpm install

# Copier le reste des fichiers du projet
COPY . .

# Générer les types Prisma
RUN npx prisma generate

# Exposer le port
EXPOSE 3000

# Commande de démarrage
CMD ["pnpm", "run", "dev"] 
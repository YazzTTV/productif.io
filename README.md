# Productif.io - Environnement de développement Docker

Ce projet est configuré pour fonctionner avec Docker, ce qui permet de développer facilement sur n'importe quel ordinateur.

## Prérequis

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Git](https://git-scm.com/downloads)
- [Vercel CLI](https://vercel.com/docs/cli) (pour la gestion des variables d'environnement)

## Configuration rapide

### Utilisation des scripts automatiques

Des scripts sont fournis pour configurer automatiquement l'environnement Docker :

**Sur Windows :**
```bash
scripts\setup-docker-env.bat
```

**Sur Linux/Mac :**
```bash
scripts/setup-docker-env.sh
```

Ces scripts vont :
1. Vérifier que Docker et Docker Compose sont installés
2. Installer Vercel CLI si nécessaire
3. Récupérer les variables d'environnement depuis Vercel
4. Construire et démarrer les conteneurs Docker

### Configuration manuelle

Si vous préférez configurer manuellement, suivez les étapes ci-dessous.

#### 1. Clone du projet

```bash
git clone <votre-repo-github>
cd <dossier-du-projet>
```

#### 2. Configuration des variables d'environnement

Installez Vercel CLI et connectez-vous à votre compte :

```bash
npm i -g vercel
vercel login
```

Récupérez les variables d'environnement depuis Vercel :

```bash
vercel env pull .env.local
```

Cela créera automatiquement un fichier `.env.local` avec toutes les variables d'environnement configurées dans Vercel.

#### 3. Variables d'environnement requises

Assurez-vous que votre fichier `.env.local` contient les variables suivantes :

```
# Base de données
DATABASE_URL=

# NextAuth
NEXTAUTH_SECRET=
NEXTAUTH_URL=

# JWT
JWT_SECRET=

# Google OAuth (si utilisé)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Stripe (si utilisé)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

#### 4. Démarrage avec Docker

Construction et démarrage des conteneurs :

```bash
docker compose up
```

Pour reconstruire les images (par exemple, après avoir modifié le Dockerfile) :

```bash
docker compose up --build
```

Pour exécuter en arrière-plan :

```bash
docker compose up -d
```

L'application sera accessible à l'adresse : http://localhost:3000

### 5. Commandes utiles

Arrêter les conteneurs :

```bash
docker compose down
```

Voir les logs :

```bash
docker compose logs -f
```

Accéder au shell dans le conteneur :

```bash
docker compose exec app bash
```

## Développement

Tous les changements dans le code source seront automatiquement reflétés dans l'application en cours d'exécution grâce au volume monté et au mode de développement de Next.js.

## Déploiement

Le déploiement sur Vercel se fait automatiquement à partir de votre dépôt Git. 
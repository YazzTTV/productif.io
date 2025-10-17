# Productif.io - Environnement de développement Docker

Ce projet est configuré pour fonctionner avec Docker, ce qui permet de développer facilement sur n'importe quel ordinateur.

## 🚀 Nouveautés - Mai 2025

### API pour Agents IA
- **Documentation complète** : Guide détaillé pour l'intégration d'agents IA
- **Endpoints optimisés** : API `/habits/agent` avec performances améliorées
- **Authentification clarifiée** : Résolution des problèmes de tokens API
- **Sauvegarde automatique** : Scripts de backup de base de données

📖 **[Consultez la documentation API complète](docs/api-tokens.md)**

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

## Déploiement Railway (Scheduler et Agent IA)

### Basculer la config Railway
Utilisez le script pour pointer `railway.toml` sur le bon service:

```powershell
./scripts/railway-switch-config.ps1 -target scheduler   # ou -target ai
```

### Scheduler
1) `./scripts/railway-switch-config.ps1 -target scheduler`
2) `railway link` (choisir le projet et service scheduler)
3) `railway up`

### Agent IA
1) `./scripts/railway-switch-config.ps1 -target ai`
2) `railway link` (choisir le projet et créer/choisir service IA)
3) `railway up`

Variables requises (dans Railway): `DATABASE_URL`, `OPENAI_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_VERIFY_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`. Optionnel: `AI_PORT` (3001 par défaut), `NEXT_PUBLIC_APP_URL`.

Accéder au shell dans le conteneur :

```bash
docker compose exec app bash
```

## 🤖 API pour Agents IA

### Authentification
Utilisez les tokens API pour connecter vos agents IA :

```bash
curl -X GET "https://productif.io/api/habits/agent" \
  -H "Authorization: Bearer {votre_token}"
```

### Endpoints principaux
- **`/api/habits/agent`** - Gestion des habitudes (GET/POST)
- **`/api/tasks/agent`** - Gestion des tâches
- **`/api/test-token`** - Test de votre token API

### Documentation complète
📖 **[Guide complet des APIs](docs/api-tokens.md)** - Exemples, authentification, résolution des problèmes

## 🛠️ Scripts utiles

### Sauvegarde de la base de données
```bash
node scripts/backup-database.js
```

### Déploiement
```bash
# Commit et push
git add .
git commit -m "Votre message"
git push origin main

# Déploiement Vercel
vercel --prod
```

## Développement

Tous les changements dans le code source seront automatiquement reflétés dans l'application en cours d'exécution grâce au volume monté et au mode de développement de Next.js.

## 📚 Documentation

- **[API Tokens](docs/api-tokens.md)** - Guide complet pour les intégrations d'agents IA
- **[Changelog](CHANGELOG.md)** - Historique des modifications

## Déploiement

Le déploiement sur Vercel se fait automatiquement à partir de votre dépôt Git. 
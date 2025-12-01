# Déploiement du Scheduler sur Railway

## 📋 Prérequis

- Un projet Railway existant avec une base de données Postgres
- Les secrets WhatsApp et OpenAI configurés dans Railway

## 🚀 Étapes de déploiement

### Option 1 : Nouveau service dans le même projet Railway

1. **Créer un nouveau service dans Railway**
   - Dans votre projet Railway, cliquez sur "New Service"
   - Sélectionnez "GitHub Repo" et connectez le même repository

2. **Configurer le service**
   - Dans les paramètres du service, configurez :
     - **Root Directory** : `/` (racine du projet)
     - **Build Command** : (laissé vide, Dockerfile gère tout)
     - **Start Command** : (laissé vide, Dockerfile gère tout)

3. **Configurer le railway.toml**
   - Renommez `railway.toml.scheduler` en `railway.toml` dans le service scheduler
   - Ou configurez manuellement dans Railway :
     - **Dockerfile Path** : `Dockerfile.scheduler`
     - **Healthcheck Path** : `/health`

4. **Configurer les variables d'environnement**
   - Railway utilisera automatiquement les secrets partagés du projet
   - Vérifiez que toutes les variables suivantes sont configurées :
     - `DATABASE_URL` (depuis Postgres service)
     - `OPENAI_API_KEY`
     - `WHATSAPP_ACCESS_TOKEN`
     - `WHATSAPP_VERIFY_TOKEN`
     - `WHATSAPP_PHONE_NUMBER_ID`
     - `WHATSAPP_APP_ID`
     - `WHATSAPP_APP_SECRET`
     - `WHATSAPP_BUSINESS_ACCOUNT_ID`
     - `WHATSAPP_API_URL`
     - `NEXT_PUBLIC_APP_URL`

5. **Déployer**
   - Railway détectera automatiquement le Dockerfile.scheduler
   - Le service démarrera sur le port fourni par Railway (variable `PORT`)

### Option 2 : Utiliser railway.toml.scheduler directement

Si Railway supporte plusieurs fichiers de configuration :

1. Dans le service scheduler, spécifiez :
   - **Config File** : `railway.toml.scheduler`
   - Ou renommez temporairement `railway.toml.scheduler` en `railway.toml`

## 🔍 Vérification

Une fois déployé, vérifiez que le service fonctionne :

1. **Healthcheck** : `https://votre-service.railway.app/health`
   - Devrait retourner : `{"status":"healthy","service":"scheduler",...}`

2. **Status** : `https://votre-service.railway.app/status`
   - Affiche le statut complet du scheduler

## 📝 Notes importantes

- Le scheduler utilise le port fourni automatiquement par Railway via `process.env.PORT`
- Le timezone est configuré sur `Europe/Paris` dans le Dockerfile
- Les migrations Prisma sont exécutées automatiquement au démarrage
- Le service redémarre automatiquement en cas d'échec (max 10 tentatives)

## 🔧 Troubleshooting

### Le service ne démarre pas
- Vérifiez les logs Railway pour les erreurs
- Assurez-vous que toutes les variables d'environnement sont configurées
- Vérifiez que la base de données est accessible

### Healthcheck échoue
- Vérifiez que le port est correctement exposé
- Vérifiez que le endpoint `/health` répond correctement
- Consultez les logs pour voir si le serveur Express démarre

### Migrations Prisma échouent
- Vérifiez que `DATABASE_URL` est correctement configuré
- Vérifiez que la base de données est accessible depuis Railway
- Consultez les logs pour les erreurs spécifiques de migration


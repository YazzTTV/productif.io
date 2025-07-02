# 🚀 Guide de Déploiement Railway - Agent IA et Planificateur

## 📋 Prérequis

1. **Railway CLI installé**
   ```bash
   npm install -g @railway/cli
   ```

2. **Connexion à Railway**
   ```bash
   railway login
   ```

3. **Base de données PostgreSQL Railway** configurée avec les variables d'environnement

## 🎯 Déploiement Automatisé

### Option 1: Script automatisé (Recommandé)
```bash
./deploy-railway-cli.sh
```

Le script vous propose 4 options :
- `1` : Déployer l'Agent IA uniquement
- `2` : Déployer le Planificateur uniquement  
- `3` : Déployer les deux services séquentiellement
- `4` : Afficher les commandes manuelles

### Option 2: Commandes manuelles

#### Pour l'Agent IA
```bash
cp railway.ai.toml railway.toml
railway up
```

#### Pour le Planificateur
```bash
cp railway.scheduler.toml railway.toml
railway up
```

## 🔧 Variables d'Environnement Requises

Configurez ces variables dans Railway Dashboard :

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
OPENAI_API_KEY=sk-...
WHATSAPP_ACCESS_TOKEN=EAAx...
WHATSAPP_VERIFY_TOKEN=votre_token_verify
WHATSAPP_PHONE_NUMBER_ID=123456789
```

## 🏗️ Architecture des Services

### 🤖 Agent IA (Port 3001)
- **Dockerfile**: `Dockerfile.ai`
- **Script**: `npm run start:ai`
- **Health Check**: `GET /health`
- **Webhook WhatsApp**: `POST /webhook`

### ⏰ Planificateur (Port 3002)  
- **Dockerfile**: `Dockerfile.scheduler`
- **Script**: `npm run start:scheduler`
- **Health Check**: `GET /health`
- **API Interne**: Gestion des notifications

## 🔍 Vérification Post-Déploiement

### 1. Vérifier les logs
```bash
railway logs --tail 50
```

### 2. Tester les health checks
```bash
curl https://[votre-domain].railway.app/health
```

### 3. Vérifier le statut
```bash
railway status
```

## 📱 Configuration WhatsApp

1. **URL Webhook** : `https://[domain-ai].railway.app/webhook`
2. **Token de vérification** : Utilisez `WHATSAPP_VERIFY_TOKEN`
3. **Test** : WhatsApp enverra un GET avec `hub.challenge`

## 🛠️ Commandes Utiles

```bash
# Voir les services déployés
railway status

# Afficher les logs en temps réel
railway logs --follow

# Gérer les variables d'environnement
railway variables

# Redéployer un service
railway up

# Gérer les domaines
railway domain

# Ouvrir le dashboard
railway open
```

## 🚨 Troubleshooting

### Problème de build
- Vérifiez que `package.json` et `Dockerfile.*` sont présents
- Assurez-vous que Prisma est correctement configuré

### Problème de variables
```bash
railway variables set KEY=value
```

### Logs d'erreur
```bash
railway logs --tail 100
```

### Redémarrer un service
```bash
railway restart
```

## ✅ Checklist de Déploiement

- [ ] Railway CLI installé et connecté
- [ ] Base PostgreSQL Railway configurée
- [ ] Variables d'environnement définies
- [ ] Agent IA déployé sur Railway
- [ ] Planificateur déployé sur Railway  
- [ ] Health checks fonctionnels
- [ ] Webhook WhatsApp configuré
- [ ] Tests de notifications OK

---

**🎉 Une fois déployé, vos services seront disponibles 24/7 sur Railway !** 
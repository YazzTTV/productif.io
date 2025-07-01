# 🚀 Guide de Déploiement Railway

## Architecture de Déploiement

Nous déployons **2 services séparés** sur Railway :

1. **🤖 Agent IA** (Port 3001) - Gère les messages WhatsApp et l'IA
2. **⏰ Planificateur** (Port 3002) - Gère les notifications programmées

---

## 📋 Prérequis

### 1. Railway CLI
```bash
npm install -g @railway/cli
railway login
```

### 2. Variables d'environnement nécessaires
- `DATABASE_URL` (Postgres)
- `OPENAI_API_KEY`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`

---

## 🎯 Étape 1 : Déployer l'Agent IA

### 1.1 Créer le service
1. Allez sur [railway.app](https://railway.app)
2. Créez un nouveau projet
3. Ajoutez un service "Deploy from GitHub repo"
4. Sélectionnez votre repository `productif.io`

### 1.2 Configuration
- **Nom du service** : `productif-agent-ia`
- **Build Command** : (automatique via Dockerfile.ai)
- **Start Command** : `pnpm start:ai`
- **Port** : 3001

### 1.3 Variables d'environnement
Ajoutez dans l'onglet "Variables" :
```
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### 1.4 Fichier de configuration
Le service utilise automatiquement `railway.toml`

---

## ⏰ Étape 2 : Déployer le Planificateur

### 2.1 Créer le service
1. Dans le même projet Railway
2. Ajoutez un nouveau service "Deploy from GitHub repo"
3. Sélectionnez le même repository

### 2.2 Configuration
- **Nom du service** : `productif-scheduler`
- **Build Command** : (automatique via Dockerfile.scheduler)
- **Start Command** : `pnpm start:scheduler`
- **Port** : 3002

### 2.3 Variables d'environnement
Mêmes variables que l'Agent IA

### 2.4 Fichier de configuration
1. Renommez `railway.scheduler.toml` en `railway.toml` pour ce service
2. Ou configurez manuellement le Dockerfile dans Railway :
   - Settings > Deploy > Custom Build Command : Dockerfile.scheduler

---

## 🔗 Étape 3 : Configuration WhatsApp

### 3.1 URL du Webhook
Récupérez l'URL de votre Agent IA déployé :
```
https://[votre-domain-agent-ia].railway.app/webhook
```

### 3.2 Configuration Meta for Developers
1. Allez sur [developers.facebook.com](https://developers.facebook.com)
2. Sélectionnez votre app WhatsApp Business
3. WhatsApp > Configuration
4. **Webhook URL** : `https://[votre-domain].railway.app/webhook`
5. **Verify Token** : Utilisez votre `WHATSAPP_VERIFY_TOKEN`

### 3.3 Test du Webhook
```bash
curl -X GET "https://[votre-domain].railway.app/webhook?hub.mode=subscribe&hub.challenge=CHALLENGE_ACCEPTED&hub.verify_token=[VOTRE_TOKEN]"
```

---

## 🔧 Commandes Utiles

### Déploiement automatique
```bash
./deploy-railway.sh
```

### Commandes Railway
```bash
# Voir les logs
railway logs --service productif-agent-ia
railway logs --service productif-scheduler

# Redéployer
railway up --service productif-agent-ia
railway up --service productif-scheduler

# Status
railway status
```

### Tests de santé
```bash
# Agent IA
curl https://[votre-domain-ai].railway.app/health

# Planificateur
curl https://[votre-domain-scheduler].railway.app/health
```

---

## 📊 Monitoring

### Logs en temps réel
```bash
# Agent IA
railway logs --service productif-agent-ia --tail

# Planificateur
railway logs --service productif-scheduler --tail
```

### Métriques importantes
- **Agent IA** : Messages reçus, réponses envoyées, erreurs GPT
- **Planificateur** : Notifications envoyées, erreurs de planification

---

## 🚨 Troubleshooting

### Problèmes courants

#### 1. Erreur de healthcheck
```bash
# Vérifiez les logs
railway logs --service [nom-service]

# Testez manuellement
curl https://[domain].railway.app/health
```

#### 2. Variables d'environnement manquantes
- Vérifiez dans Railway Dashboard > Variables
- Redéployez après ajout de variables

#### 3. Problème de Dockerfile
- Vérifiez que les ports correspondent
- Testez localement avec Docker

#### 4. Erreur WhatsApp
- Vérifiez l'URL webhook dans Meta for Developers
- Testez la vérification du token

---

## 🎉 Validation du Déploiement

### ✅ Checklist
- [ ] Agent IA déployé et accessible
- [ ] Planificateur déployé et accessible
- [ ] Variables d'environnement configurées
- [ ] Webhook WhatsApp configuré
- [ ] Test d'un message WhatsApp réussi
- [ ] Logs sans erreur

### Tests finaux
1. **Envoyez un message WhatsApp** → Doit recevoir une réponse
2. **Vérifiez les logs** → Pas d'erreurs critiques
3. **Testez les endpoints de santé** → Status 200 OK

---

## 📞 Support

En cas de problème :
1. Vérifiez les logs Railway
2. Testez les endpoints de santé
3. Vérifiez la configuration WhatsApp
4. Consultez la documentation Railway 
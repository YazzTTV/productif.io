# 🚀 **Déploiement Railway - Agent IA & Planificateur**

## ✅ **CONFIGURATION TERMINÉE**

Votre projet est maintenant **prêt pour le déploiement sur Railway** ! Toutes les vérifications sont passées avec succès.

---

## 📦 **CE QUI A ÉTÉ PRÉPARÉ**

### **🤖 Agent IA (Port 3001)**
- ✅ `Dockerfile.ai` optimisé 
- ✅ `railway.toml` configuré
- ✅ Script de démarrage : `npm run start:ai`
- ✅ Endpoint de santé : `/health`
- ✅ Gestion des messages WhatsApp + IA

### **⏰ Planificateur (Port 3002)**
- ✅ `Dockerfile.scheduler` optimisé
- ✅ `railway.scheduler.toml` configuré  
- ✅ Script de démarrage : `npm run start:scheduler`
- ✅ Endpoint de santé : `/health`
- ✅ Notifications programmées

### **📋 Documentation & Scripts**
- ✅ `docs/DEPLOIEMENT_RAILWAY.md` - Guide détaillé
- ✅ `deploy-railway.sh` - Script de déploiement
- ✅ `check-deployment.sh` - Vérifications automatiques
- ✅ Variables d'environnement documentées

---

## 🎯 **ÉTAPES DE DÉPLOIEMENT**

### **1️⃣ Aller sur Railway**
👉 [railway.app](https://railway.app)

### **2️⃣ Créer l'Agent IA**
1. **New Project** → **Deploy from GitHub Repo**
2. Sélectionnez : `YazzTTV/productif.io`
3. **Service Name** : `productif-agent-ia`
4. **Railway détectera automatiquement** `railway.toml`

### **3️⃣ Variables d'environnement Agent IA**
```
NODE_ENV=production
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
WHATSAPP_ACCESS_TOKEN=...
WHATSAPP_VERIFY_TOKEN=...
WHATSAPP_PHONE_NUMBER_ID=...
```

### **4️⃣ Créer le Planificateur**
1. **Add Service** dans le même projet
2. **Deploy from GitHub Repo** → même repository
3. **Service Name** : `productif-scheduler`
4. **Configuration** → **Settings** → **Deploy**
5. **Custom Build Path** : `railway.scheduler.toml`

### **5️⃣ Variables d'environnement Planificateur**
```
(Mêmes variables que l'Agent IA)
```

### **6️⃣ Configuration WhatsApp**
1. **Récupérez l'URL de l'Agent IA** : `https://[domain-ai].railway.app`
2. **Meta for Developers** → WhatsApp → Configuration
3. **Webhook URL** : `https://[domain-ai].railway.app/webhook`
4. **Verify Token** : Votre `WHATSAPP_VERIFY_TOKEN`

---

## 🔗 **URLS FINALES**

Après déploiement, vous aurez :

### **🤖 Agent IA**
- **URL** : `https://[your-ai-domain].railway.app`
- **Webhook** : `https://[your-ai-domain].railway.app/webhook`
- **Health** : `https://[your-ai-domain].railway.app/health`

### **⏰ Planificateur**  
- **URL** : `https://[your-scheduler-domain].railway.app`
- **Health** : `https://[your-scheduler-domain].railway.app/health`

---

## 🧪 **TESTS DE VALIDATION**

### **✅ Tests de santé**
```bash
curl https://[your-ai-domain].railway.app/health
curl https://[your-scheduler-domain].railway.app/health
```

### **✅ Test WhatsApp**
1. Envoyez un message WhatsApp à votre numéro
2. Vous devriez recevoir une réponse de l'IA

### **✅ Test du planificateur**
1. Vérifiez les logs Railway
2. Les notifications doivent être programmées automatiquement

---

## 📊 **MONITORING**

### **Commandes utiles**
```bash
# Installer Railway CLI
npm install -g @railway/cli
railway login

# Voir les logs en temps réel
railway logs --service productif-agent-ia --tail
railway logs --service productif-scheduler --tail

# Status des services
railway status
```

### **Métriques importantes**
- **Agent IA** : Messages traités, réponses GPT, erreurs
- **Planificateur** : Notifications envoyées, erreurs de scheduling

---

## 🚨 **TROUBLESHOOTING**

### **Problème de build**
- Vérifiez les logs Railway
- Assurez-vous que toutes les variables d'environnement sont définies

### **Problème WhatsApp**
- Testez l'endpoint de santé
- Vérifiez l'URL webhook dans Meta for Developers
- Vérifiez le token de vérification

### **Problème de base de données**
- Assurez-vous que `DATABASE_URL` pointe vers votre Postgres Railway
- Vérifiez que Prisma peut se connecter

---

## 🎉 **C'EST PARTI !**

Votre setup est **production-ready** ! 

👉 **Suivez maintenant le guide** : `docs/DEPLOIEMENT_RAILWAY.md`

🚀 **Bon déploiement !** 
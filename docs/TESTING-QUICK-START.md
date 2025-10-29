# 🧪 Tests Rapides - Feature 3

## 🚀 Commandes à Exécuter

### Étape 1 : Configuration initiale
```bash
node scripts/test-behavior-setup.js
```
**Résultat attendu** : Schedule configuré pour un utilisateur

### Étape 2 : Créer des données de test
```bash
node scripts/test-behavior-checkins.js
```
**Résultat attendu** : 42 check-ins créés (7 jours × 3 check-ins × 2 types par jour)

### Étape 3 : Tester l'analyse API (nécessite un token)
```bash
# Vous devez d'abord créer un token API pour l'utilisateur
# Puis tester les endpoints
```

### Étape 4 : Tester via WhatsApp
Envoyez "analyse" depuis WhatsApp à votre bot

### Étape 5 : Vérifier les logs du scheduler
```bash
# Vérifier que le scheduler est démarré
curl http://localhost:3001/health

# Vérifier les logs
tail -f logs/*.log
```

---

## 📱 Test Manuel Rapide via WhatsApp

1. **Envoyer "analyse"** → Devrait retourner un rapport avec insights IA
2. **Envoyer "tendances"** → Devrait montrer l'évolution des scores
3. **Attendre le check-in automatique** → Le bot devrait poser une question

---

## 🔍 Vérifications Database

```bash
# Connexion PostgreSQL
psql $DATABASE_URL

# Vérifier les check-ins créés
SELECT COUNT(*), type FROM "BehaviorCheckIn" GROUP BY type;

# Vérifier les patterns générés
SELECT * FROM "BehaviorPattern" ORDER BY "createdAt" DESC LIMIT 1;

# Vérifier les schedules
SELECT * FROM "CheckInSchedule";
```

---

## ✅ Checklist Rapide

- [ ] Schedule créé (script 1)
- [ ] Check-ins de test créés (script 2)  
- [ ] Webhook WhatsApp fonctionne
- [ ] API répond correctement
- [ ] Scheduler en cours d'exécution
- [ ] IA génère des insights
- [ ] Messages WhatsApp envoyés/réçus

---

## 🐛 Si ça ne marche pas

```bash
# 1. Vérifier les logs
npm run dev

# 2. Vérifier les erreurs de linting
npm run lint

# 3. Vérifier la connexion DB
npx prisma db push

# 4. Régénérer Prisma Client
npx prisma generate
```

---

## 💡 Prochaines Étapes

1. **Tester le scheduler automatique** : Attendre les horaires planifiés
2. **Ajouter de vrais check-ins** : Via WhatsApp manuellement
3. **Générer une analyse** : Via la commande "analyse"
4. **Optimiser les horaires** : Ajuster selon les préférences utilisateur

---

**Note** : Pour des tests complets avec GPT-4, assurez-vous d'avoir `OPENAI_API_KEY` dans votre `.env`

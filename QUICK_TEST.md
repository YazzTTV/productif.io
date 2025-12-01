# 🚀 Test Rapide - Notification Matinale avec Template

## ⚡ Test en 3 étapes

### 1. Vérifier la configuration

Assurez-vous d'avoir dans votre `.env` :

```env
WHATSAPP_USE_TEMPLATES=true
WHATSAPP_TEMPLATE_LANGUAGE=fr
```

### 2. Lancer le test

```bash
npm run test:morning-template
```

Ou avec un email spécifique :

```bash
npm run test:morning-template votre@email.com
```

### 3. Vérifier sur WhatsApp

Vous devriez recevoir le message avec le template `productif_rappel_matin` contenant vos habitudes.

## ✅ Résultat attendu

**Sur WhatsApp :**
```
🌅 Bonjour et bonne journée !

🌅 C'est parti pour une nouvelle journée !

💫 Tes habitudes pour aujourd'hui :
1. ⭕ Apprentissage
2. ⭕ Note de sa journée
3. ⭕ Dormir 00h
... (toutes vos habitudes)

Bonne journée ! 💙
```

## ⚠️ Si ça ne marche pas

1. **Template non trouvé** → Vérifiez que `productif_rappel_matin` est approuvé dans WhatsApp Business Manager
2. **Templates désactivés** → Ajoutez `WHATSAPP_USE_TEMPLATES=true` dans `.env`
3. **Aucun utilisateur** → Utilisez un email : `npm run test:morning-template email@example.com`

## 📚 Documentation complète

Voir `docs/TEST_MORNING_TEMPLATE.md` pour plus de détails.


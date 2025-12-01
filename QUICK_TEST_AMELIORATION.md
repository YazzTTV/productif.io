# 🚀 Test Rapide - Template Rappel Amélioration

## ⚡ Test en 2 étapes

### 1. Lancer le test

```bash
npm run test:amelioration-template
```

Ou avec un email spécifique :

```bash
npm run test:amelioration-template votre@email.com
```

### 2. Vérifier sur WhatsApp

Vous devriez recevoir :

```
🌅 *Bonjour ! Voici tes insights du jour*

🎯 *Aujourd'hui, concentre-toi sur :*

• Gestion du temps et des priorités
• Amélioration continue des processus de travail

💡 *Mes recommandations :

1. Établir un calendrier hebdomadaire...
2. Utiliser des outils de gestion de projet...
3. Mettre en place des rappels quotidiens...
4. Allouer des plages horaires spécifiques...
5. Intégrer des pauses actives...

✨ Bonne journée productive ! 💪
```

## ✅ Ce qui a été fait

1. ✅ Support des templates à 2 variables dans `whatsappService.js`
2. ✅ `MorningInsightsScheduler` utilise le template automatiquement
3. ✅ Script de test complet créé
4. ✅ Génération d'insights avec IA si journaux disponibles

## 📋 Prérequis

- Template `productif_rappel_amelioration` approuvé dans WhatsApp Business Manager
- `WHATSAPP_USE_TEMPLATES=true` dans `.env`

## 💡 Astuce

Le template a **2 variables** :
- `{{1}}` : Focus areas (• points de concentration)
- `{{2}}` : Recommendations (liste numérotée)

## 📚 Documentation complète

Voir `docs/TEMPLATE_AMELIORATION_SETUP.md`


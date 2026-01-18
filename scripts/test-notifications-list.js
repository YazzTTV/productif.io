#!/usr/bin/env node

/**
 * Script récapitulatif - Liste tous les scripts de test de notifications
 */

console.log(`
📱 SCRIPTS DE TEST DES NOTIFICATIONS
====================================

Chaque script envoie une notification push individuelle sur votre téléphone.

Usage: node scripts/test-notification-[nom].js [userId]

📋 Scripts disponibles:

1. 🌅 MORNING_ANCHOR
   node scripts/test-notification-morning-anchor.js [userId]

2. 🎯 FOCUS_WINDOW
   node scripts/test-notification-focus-window.js [userId]

3. ⏱️ FOCUS_END
   node scripts/test-notification-focus-end.js [userId]

4. 🍽️ LUNCH_BREAK
   node scripts/test-notification-lunch-break.js [userId]

5. 🔁 POST_LUNCH_RESTART
   node scripts/test-notification-post-lunch-restart.js [userId]

6. 🧠 STRESS_CHECK_PREMIUM
   node scripts/test-notification-stress-check-premium.js [userId]

7. 🙂 MOOD_CHECK_PREMIUM
   node scripts/test-notification-mood-check-premium.js [userId]

8. 🌙 EVENING_PLAN
   node scripts/test-notification-evening-plan.js [userId]

9. 🎯 FOCUS_CHECK_PREMIUM
   node scripts/test-notification-focus-check-premium.js [userId]

💡 Votre User ID: cma6li3j1000ca64sisjbjyfs

Exemple:
  node scripts/test-notification-morning-anchor.js cma6li3j1000ca64sisjbjyfs
`);

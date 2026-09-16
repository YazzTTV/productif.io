# Recette iPhone après les retours du 16 septembre

Cette passe traite les retours TestFlight sur les habitudes, la saisie du ressenti et la lisibilité des analyses. Le nouveau bundle doit être inclus dans une nouvelle archive iOS ; Noah réalise l’envoi TestFlight.

## Vérifications automatisées

- 23 tests réussis : moteur, synchronisation, couverture complète des graphiques et conservation des dates d’habitudes à Toronto, Paris et Auckland.
- Export Expo iOS/Hermes réussi dans `mobile-app-new/.expo/analytics-feedback-export`.
- ESLint ciblé réussi sur les écrans d’analyse, de saisie et de bilan et leurs nouveaux helpers.
- Aucune nouvelle erreur TypeScript par rapport au relevé initial. La vérification globale reste en échec sur les erreurs préexistantes du dépôt.

Commande des tests : `./node_modules/.bin/tsx --test tests/study-analysis/engine.test.ts tests/study-analysis/queue.test.ts tests/study-analysis/mobile-feedback.test.ts`.

## Parcours à vérifier sur appareil

1. **Habitude et paywall** : cocher une habitude qui démarre une série, fermer le paywall, revenir à l’accueil puis relancer l’application. La case doit rester cochée si la sauvegarde a réussi. Vérifier aussi une erreur réseau : aucune fausse confirmation, possibilité de réessayer.
2. **Saisie directe** : ouvrir un check-in humeur depuis une notification. La note doit être immédiatement accessible. Enregistrer, revenir aux analyses et vérifier l’actualisation. Répéter avec concentration et stress pour vérifier que le type est conservé.
3. **Journée** : ouvrir la saisie de journée, choisir une note et ajouter du texte. Vérifier la sauvegarde et l’accès à l’entrée. Le journal libre conserve son parcours distinct.
4. **Périodes** : comparer 7, 14, 30 et 90 jours. Toute la période doit être représentée, y compris le dernier jour. Les périodes longues regroupent les durées par semaine ; le total reste identique.
5. **Lisibilité** : avec l’iPhone en mode sombre, vérifier les analyses, le bilan de séance et la discussion avec l’assistant. Les champs doivent rester lisibles, les dernières actions accessibles au-dessus de la barre de navigation et le clavier ne doit pas bloquer l’envoi.
6. **Petits écrans et texte agrandi** : vérifier les totaux, les catégories et le libellé du bouton d’inclusion du journal. Déplier les détails des données et les recommandations supplémentaires.

La compilation du bundle ne remplace pas ces vérifications natives, en particulier l’ouverture réelle du paywall et les notifications sur iPhone.

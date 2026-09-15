# Assistant IA > Analyses : plan d'action

15 septembre 2026. Périmètre : backend Next/Prisma, application Expo et page web d'analyse.

## Ordre d'exécution

1. **Mesures et stockage** : migration additive pour sessions avec segments actifs, check-ins liés, dates de complétion et historique des reports. Validation des entrées, propriété des tâches, synchronisation idempotente et file mobile persistante par utilisateur.
2. **Collecte mobile** : focus et Mode Examen, pause/reprise, arrêt anticipé, fin normale, restauration, exclusion des démos et check-ins facultatifs. Durée réelle avant suppression de la session active.
3. **Moteur d'analyse commun** : périodes explicites dans le fuseau utilisateur, chevauchements dédupliqués, progression matières, échéances, organisation, habitudes et ressentis. Absence distincte de zéro. Comparaisons conditionnées par la couverture.
4. **Explications et actions** : faits calculés, preuves, discussion contextualisée, réponses IA bornées et repli déterministe, journal facultatif, mesures de suivi sans textes personnels.
5. **Interface** : bilan clair, filtres, détails des cinq dimensions, formulaires de check-in, états chargement/erreur/première utilisation et liens vers les prochaines actions. Même moteur pour la page web.
6. **Vérification** : tests de calcul et validation, tests de migration si base locale disponible, génération Prisma, TypeScript backend/mobile et bundle Expo. Comparer les erreurs avec le dépôt initial.
7. **Livraison** : documenter fonctionnement, limites des historiques anciens, procédure de migration et déploiement. Aucune publication App Store automatique. Le script npm build existant applique des migrations à la base configurée : ne pas l'utiliser comme simple contrôle local.

## Critères d'acceptation

- 25 minutes ne deviennent pas 0 h ; pauses et arrêts anticipés correctement comptés.
- Une synchronisation rejouée ne crée pas une deuxième session.
- Données d'un autre compte jamais synchronisées avec le compte courant.
- Aucune démo dans les indicateurs. Aucun faux jour actif ni fausse valeur par défaut.
- Dates locales, fenêtres comparables, données partielles et historiques inconnus explicités.
- Une recommandation repose sur des données accessibles et mène à une action réelle.
- Le journal n'est consulté qu'après choix de l'utilisateur.
- Une erreur IA ne masque jamais le bilan calculé.
- Migration additive et procédure de retour arrière documentées.

## Statut

Implémentation locale terminée. Le moteur, la collecte, les écrans, les routes et la migration sont créés. Les résultats de vérification, limites et étapes d’activation sont consignés dans [delivery.md](delivery.md). Le backend et le web sont déployés en production. Noah prend en charge le build et l’envoi TestFlight ; la recette sur appareil natif reste à effectuer.

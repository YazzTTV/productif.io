# Assistant IA > Analyses : livraison

15 septembre 2026. Implémentation locale sur `codex/assistant-analyses`. Aucun déploiement de production ni publication mobile effectué.

## Ce qui est créé

| Domaine | Comportement livré |
| --- | --- |
| Mesure du travail | Focus et Mode Examen enregistrent leurs intervalles actifs, pauses, changements de tâche, fin et arrêt anticipé. Les démos sont exclues. Les points de sauvegarde contigus sont fusionnés. |
| Synchronisation | File persistante par compte, reprise au premier plan et périodique, révisions idempotentes, vérification du compte avant chaque envoi. Les erreurs réseau conservent les données. |
| Ressenti | Check-in facultatif après la séance ou depuis les analyses : concentration, énergie, humeur, stress. Association à une séance lorsque disponible. |
| Bilan | Temps enregistré, tâches terminées avec date connue, jours actifs, états des séances, périodes de 7/14/30/90 jours et fuseau local. Les chevauchements ne doublent pas le total. |
| Matières | Chapitres terminés/restants, temps attribué, échéance, coefficient, charge estimée disponible et prochain chapitre. |
| Organisation | Reports répétés, tâches planifiées avec activité, estimation comparée au temps enregistré disponible. |
| Habitudes | Réalisation sur les jours prévus, uniquement depuis la création de l’habitude. |
| Tendances | Créneaux horaires et durées avec seuils d’observation. Comparaison énergie/concentration uniquement avec assez de séances et de jours distincts. |
| Assistant | Jusqu’à trois constats calculés, accès aux preuves, question contextualisée, préparation d’une session ou ouverture de la planification sur mobile. Journal uniquement sur choix explicite. |
| Interfaces | Nouvel écran dans Assistant IA > Analyses, ancien accès redirigé vers le même écran, bilan de fin de focus, page web connectée au même moteur. Français, anglais et espagnol. |
| Données serveur | Migration additive pour les séances, check-ins et historique des tâches. Un déclencheur SQL couvre les différents chemins de modification des tâches. |

## Règles de lecture

- Le temps enregistré ne mesure ni l’attention, ni le travail effectué hors de Productif.
- Cocher un chapitre ne prouve pas sa maîtrise. Les écrans le précisent.
- Les anciens temps et anciennes dates de complétion inconnus ne sont pas inventés. Le début de la collecte conditionne les comparaisons, même pour un compte ancien.
- Une absence de ressenti reste une donnée manquante. Elle ne devient pas une note nulle.
- Les associations observées ne prouvent aucune causalité. Aucune prédiction de note ni aucun diagnostic n’est produit.
- L’estimation d’une tâche est comparée seulement au temps disponible dans l’historique chargé, pas à une mesure exhaustive de tout le travail passé.
- Le changement de matière ou la suppression d’une tâche peut modifier l’attribution courante. Le temps sans attribution reste dans le total.

## Vérifications

| Contrôle | Résultat |
| --- | --- |
| Moteur, transitions et validation | 20 tests passent : pauses, arrêts, chevauchements, attribution, fuseaux, changement d’heure, données manquantes, ancien compte avec nouvelle collecte, taille des sauvegardes. |
| File mobile | 1 scénario d’intégration passe : hors ligne, retour du réseau, séance avant check-in, absence de réenvoi inutile, changement de compte et absence d’authentification. Adaptateurs natifs simulés. |
| Routes API sur PostgreSQL isolé | 11 tests passent : authentification, propriété, révisions concurrentes, entrées invalides, limites d’historique, bilan, repli de l’explication et faits périmés. |
| Migration | Appliquée à une base locale isolée. Scénarios SQL de complétion, réouverture, report, déduplication et suppression en cascade validés. Comparaison Prisma sans différence de schéma. |
| Prisma | Client généré et schéma validé. |
| TypeScript | Aucune erreur signalée dans les nouveaux modules ni dans les écrans modifiés pour cette livraison. La vérification globale reste en échec sur des erreurs déjà présentes ailleurs et sur la configuration racine héritée d’Expo. |
| Expo iOS | Export JavaScript/Hermes réussi, dans `mobile-app-new/.expo/study-analysis-export`. |
| Interface web | Vérifiée avec un compte fictif local, sur écran de bureau et à 390 px : bilan réel, données manquantes, discussion et affichage sans débordement. |

Les tests et leur exécution sont décrits dans `tests/study-analysis/README.md`.

## Activation, dans cet ordre

1. Relire la migration `20260915150000_study_analysis` et les modifications de cette branche. Le dépôt peut contenir du travail d’autres tâches : sélectionner les fichiers de cette fonctionnalité lors du commit.
2. Sur l’environnement de préproduction, appliquer les migrations avec la procédure habituelle du projet (`prisma migrate deploy`) puis générer le client Prisma. Vérifier les routes avec un compte gratuit et un compte Premium.
3. Déployer le backend avant le nouveau client mobile. Les anciennes applications restent compatibles avec les ajouts de tables et de colonnes.
4. Configurer `OPENAI_API_KEY` côté serveur pour les explications générées. `STUDY_ANALYSIS_MODEL` est facultatif. Sans clé, en cas de délai dépassé ou de réponse invalide, le bilan calculé reste disponible et le mode de secours est signalé à l’écran.
5. Valider sur iPhone : démarrer, mettre en pause, changer de tâche, passer en arrière-plan, relancer l’application, terminer normalement, interrompre et revenir du mode hors ligne. Vérifier aussi une démo, la session Examen, les blocages et les Live Activities.
6. Après recette, déployer le backend de production puis distribuer l’application selon le circuit existant. Vérifier l’arrivée des premières séances et les événements `analysis_*` sans contenu personnel.

Ne pas lancer `npm run build` comme simple test avec une base de production configurée : le script existant applique aussi des migrations.

## Limites de validation et exploitation

- Aucun parcours natif sur iPhone physique n’a été exécuté ici. L’export iOS valide le bundle, pas le comportement des extensions natives.
- L’appel réel au fournisseur IA n’a pas été exécuté dans les tests. Le chemin de repli a été testé. Les chiffres affichés viennent du moteur de calcul ; la validation de sortie du modèle ne constitue pas une preuve de justesse de chaque phrase.
- Le cache des explications est borné et local au processus. Il ne constitue pas un quota distribué entre plusieurs instances. Les limites de trafic et de coût de l’infrastructure doivent couvrir cette route avant une ouverture à grande échelle.
- Une séance arrêtée par le système sans notification de fin ne devient pas artificiellement une séance réussie. Le temps est plafonné à la durée prévue et l’état peut rester indéterminé.
- La page web permet de consulter et d’expliquer le bilan. Les raccourcis de préparation d’une séance ciblée sont intégrés au parcours mobile ; le web renvoie à l’espace de travail existant.

## Retour arrière

Revenir au client et au backend précédents en conservant les tables et données ajoutées. Une ancienne version ignore ces ajouts. Ne pas supprimer les tables pour revenir en arrière : cela détruirait les nouvelles mesures. Si le déclencheur doit être désactivé pour un incident identifié, suspendre les analyses pendant cette période et traiter les complétions concernées comme inconnues.

# Tests des analyses

Depuis la racine du dépôt, avec les dépendances installées :

```sh
./node_modules/.bin/tsx --test tests/study-analysis/engine.test.ts tests/study-analysis/queue.test.ts
```

Ces tests n’utilisent aucun compte réel et n’appellent aucun fournisseur IA. Le test de file compile le collecteur mobile avec des adaptateurs de stockage, de réseau et d’authentification simulés.

## Tests API et SQL

Utiliser exclusivement une base PostgreSQL locale jetable, nommée `productif_study_test` sur `127.0.0.1:55439`. Le test API refuse une autre destination. Le schéma courant et le déclencheur `study_task_history` doivent être installés au préalable.

Pour créer le schéma sur une base vide (ne pas exécuter cette procédure sur une base existante) :

```sh
./node_modules/.bin/prisma migrate diff --from-empty --to-schema-datamodel prisma/schema.prisma --script > /tmp/study-test-schema.sql
psql "$STUDY_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/study-test-schema.sql
sed -n '/^CREATE FUNCTION study_task_history/,$p' prisma/migrations/20260915150000_study_analysis/migration.sql > /tmp/study-test-trigger.sql
psql "$STUDY_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f /tmp/study-test-trigger.sql
```

Puis :

```sh
./node_modules/.bin/tsx --test tests/study-analysis/api.test.ts
psql "$STUDY_TEST_DATABASE_URL" -v ON_ERROR_STOP=1 -f tests/study-analysis/database.sql
```

Définir et exporter `STUDY_TEST_DATABASE_URL` avec les identifiants de cette base locale. Le test API crée deux utilisateurs fictifs et les supprime après les assertions. Les assertions SQL sont annulées par `ROLLBACK`.

Cette préparation depuis le schéma courant permet de répéter les tests fonctionnels. Pour tester la migration additive elle-même, partir du schéma de la version précédente dans une autre base vide, puis appliquer le fichier de migration complet. Cette vérification a été réalisée pendant l’implémentation.

## Bundle mobile

Depuis `mobile-app-new` :

```sh
CI=1 ./node_modules/.bin/expo export --platform ios --output-dir .expo/study-analysis-export
```

La compilation native, les extensions iOS et les scénarios sur appareil restent une recette distincte. Voir `docs/analytics/delivery.md`.

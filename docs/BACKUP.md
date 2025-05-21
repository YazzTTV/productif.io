# Guide des sauvegardes de la base de données

Ce document explique comment utiliser le système de sauvegarde automatique de la base de données PostgreSQL pour Productif.io.

## Configuration requise

- Node.js installé sur le serveur
- Accès à la base de données PostgreSQL (via l'URL dans la variable d'environnement `DATABASE_URL`)
- L'outil `pg_dump` doit être installé sur le serveur (généralement inclus avec PostgreSQL)

## Comment ça fonctionne

Le système de sauvegarde comprend trois scripts principaux :

1. **`backup-database.js`** : Sauvegarde la base de données dans un fichier SQL horodaté
2. **`cleanup-backups.js`** : Supprime les anciennes sauvegardes pour économiser de l'espace disque
3. **`schedule-backups.js`** : Programme l'exécution automatique des deux scripts précédents

Les fichiers de sauvegarde sont stockés dans le dossier `backups/` à la racine du projet.

## Utilisation

### Sauvegarde manuelle

Pour effectuer une sauvegarde manuelle de la base de données :

```bash
npm run backup
```

Cela créera un fichier SQL dans le dossier `backups/` avec un nom comme `productif_io_backup_2023-09-15_12-30-45.sql`.

### Nettoyage manuel des anciennes sauvegardes

Pour nettoyer manuellement les anciennes sauvegardes :

```bash 
npm run cleanup-backups
```

Par défaut, ce script conserve :
- Toutes les sauvegardes des 30 derniers jours
- Au moins 5 sauvegardes, quelle que soit leur ancienneté

### Planification des sauvegardes automatiques

Pour démarrer le planificateur de sauvegardes :

```bash
npm run schedule-backups
```

Ce script configure :
- Une sauvegarde quotidienne à 3h00 du matin (heure de Paris)
- Un nettoyage hebdomadaire le dimanche à 4h00 du matin (heure de Paris)

Le processus reste actif tant qu'il n'est pas interrompu. Pour une utilisation en production, il est recommandé d'utiliser un gestionnaire de processus comme PM2.

## Configuration avec PM2

Pour exécuter le planificateur en arrière-plan avec PM2 :

```bash
# Installation de PM2 si nécessaire
npm install -g pm2

# Démarrage du planificateur
pm2 start scripts/schedule-backups.js --name "db-backup-scheduler"

# Configuration du démarrage automatique
pm2 save
pm2 startup
```

## Personnalisation

Vous pouvez modifier les paramètres suivants dans les scripts :

- Dans `cleanup-backups.js` :
  - `MAX_AGE_DAYS` : Nombre de jours pendant lesquels conserver les sauvegardes (défaut : 30)
  - `MIN_BACKUPS_TO_KEEP` : Nombre minimum de sauvegardes à conserver (défaut : 5)

- Dans `schedule-backups.js` :
  - Les expressions cron pour modifier la fréquence des sauvegardes et nettoyages

## Restauration d'une sauvegarde

Pour restaurer une sauvegarde :

```bash
# Format général
pg_restore -h hostname -p port -U username -d database_name backup_file

# Exemple avec les variables d'environnement
pg_restore -h ${DB_HOST} -p ${DB_PORT} -U ${DB_USER} -d ${DB_NAME} backups/productif_io_backup_2023-09-15_12-30-45.sql
```

## Considérations de sécurité

- Les fichiers de sauvegarde contiennent toutes les données de la base, y compris les informations sensibles
- Assurez-vous que le dossier `backups/` n'est pas accessible publiquement
- Envisagez de copier régulièrement les sauvegardes vers un stockage externe sécurisé
- Pour une sécurité renforcée, considérez le chiffrement des fichiers de sauvegarde 
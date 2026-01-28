-- Script SQL pour créer une notification de test pour l'utilisateur "yazz" sur Android
-- À exécuter directement sur la base de données

-- 1. Trouver l'ID de l'utilisateur "yazz"
SELECT id, email, name FROM "User" WHERE email ILIKE '%yazz%' OR name ILIKE '%yazz%';

-- 2. Vérifier les tokens Android de l'utilisateur
SELECT pt.id, pt.platform, LEFT(pt.token, 20) || '...' as token_preview, pt."createdAt"
FROM "PushToken" pt
INNER JOIN "User" u ON pt."userId" = u.id
WHERE (u.email ILIKE '%yazz%' OR u.name ILIKE '%yazz%')
  AND pt.platform = 'android';

-- 3. Créer la notification de test
-- Remplacez 'USER_ID_HERE' par l'ID trouvé à l'étape 1
INSERT INTO "NotificationHistory" (
  id,
  "userId",
  type,
  content,
  "pushTitle",
  "pushBody",
  "scheduledFor",
  status,
  "createdAt",
  "updatedAt"
) 
SELECT 
  gen_random_uuid()::text,
  u.id,
  'TEST_NOTIFICATION',
  '🧪 Ceci est une notification de test Android envoyée via le scheduler. Si vous voyez ce message, les notifications Android fonctionnent correctement !',
  '🧪 Test Android',
  'Notification de test envoyée via le scheduler',
  NOW() + INTERVAL '10 seconds',
  'pending',
  NOW(),
  NOW()
FROM "User" u
WHERE (u.email ILIKE '%yazz%' OR u.name ILIKE '%yazz%')
LIMIT 1
RETURNING id, "userId", type, "scheduledFor", status;

-- 4. Vérifier que la notification a été créée
SELECT 
  nh.id,
  nh.type,
  nh."pushTitle",
  nh."pushBody",
  nh."scheduledFor",
  nh.status,
  u.email,
  u.name
FROM "NotificationHistory" nh
INNER JOIN "User" u ON nh."userId" = u.id
WHERE (u.email ILIKE '%yazz%' OR u.name ILIKE '%yazz%')
  AND nh.type = 'TEST_NOTIFICATION'
  AND nh.status = 'pending'
ORDER BY nh."createdAt" DESC
LIMIT 5;

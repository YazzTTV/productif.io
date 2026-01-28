-- Désactiver les notifications non souhaitées pour tous les utilisateurs existants
-- Ces notifications ne sont pas dans l'app mobile et doivent être désactivées

UPDATE notification_settings
SET 
  "afternoonReminder" = false,
  "eveningReminder" = false,
  "nightReminder" = false,
  "taskReminder" = false,
  "habitReminder" = false,
  "motivation" = false,
  "dailySummary" = false,
  "updatedAt" = NOW()
WHERE 
  "afternoonReminder" = true 
  OR "eveningReminder" = true 
  OR "nightReminder" = true 
  OR "taskReminder" = true 
  OR "habitReminder" = true 
  OR "motivation" = true 
  OR "dailySummary" = true;

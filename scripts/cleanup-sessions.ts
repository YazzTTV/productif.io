import { cleanupExpiredSessions } from "@/lib/cleanup-sessions"

// Exécuter le nettoyage toutes les heures
const CLEANUP_INTERVAL = 60 * 60 * 1000 // 1 heure en millisecondes

async function startCleanupJob() {
  console.log("Starting session cleanup job...")
  
  // Exécuter immédiatement
  await cleanupExpiredSessions()
  
  // Puis toutes les heures
  setInterval(async () => {
    await cleanupExpiredSessions()
  }, CLEANUP_INTERVAL)
}

// Démarrer le job
startCleanupJob().catch(console.error) 
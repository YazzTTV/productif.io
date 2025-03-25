import { prisma } from "./prisma"

export async function cleanupExpiredSessions() {
  try {
    const now = new Date()
    
    // Supprimer toutes les sessions expirées
    await prisma.session.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    })
  } catch (error) {
    console.error("Error cleaning up expired sessions:", error)
  }
} 
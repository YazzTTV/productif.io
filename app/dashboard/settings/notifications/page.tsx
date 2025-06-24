import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import NotificationSettings from "@/components/settings/NotificationSettings"
import { NotificationSettings as PrismaNotificationSettings } from "@prisma/client"

// Convertir les préférences Prisma en préférences frontend
function mapPrismaToFrontend(preferences: PrismaNotificationSettings) {
  return {
    isEnabled: preferences.isEnabled,
    whatsappEnabled: preferences.whatsappEnabled,
    whatsappNumber: preferences.whatsappNumber || undefined,
    startHour: preferences.startHour,
    endHour: preferences.endHour,
    allowedDays: preferences.allowedDays,
    notificationTypes: preferences.notificationTypes
  }
}

export default async function NotificationsPage() {
  // Récupérer le token depuis les cookies de manière asynchrone
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  try {
    // Vérifier et décoder le token
    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as { userId: string }
    const userId = decoded.userId

    // Récupérer les préférences de notification de l'utilisateur
    const preferences = await prisma.notificationSettings.findUnique({
      where: { userId }
    })

    // Si aucune préférence n'existe, créer avec les valeurs par défaut
    const userPreferences = preferences || await prisma.notificationSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        isEnabled: true,
        emailEnabled: true,
        pushEnabled: true,
        whatsappEnabled: false,
        whatsappNumber: null,
        startHour: 9,
        endHour: 18,
        allowedDays: [1, 2, 3, 4, 5],
        notificationTypes: ['TASK_DUE', 'HABIT_REMINDER', 'DAILY_SUMMARY'],
        morningReminder: true,
        taskReminder: true,
        habitReminder: true,
        motivation: true,
        dailySummary: true,
        reminderTime: "09:00"
      }
    })

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Paramètres des notifications</h1>
        <NotificationSettings userId={userId} preferences={mapPrismaToFrontend(userPreferences)} />
      </div>
    )
  } catch (error) {
    console.error("Erreur lors du chargement des préférences:", error)
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Paramètres des notifications</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Une erreur est survenue lors du chargement de vos préférences. Veuillez réessayer plus tard.
        </div>
      </div>
    )
  }
} 
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
    emailEnabled: preferences.emailEnabled,
    pushEnabled: preferences.pushEnabled,
    whatsappEnabled: preferences.whatsappEnabled,
    whatsappNumber: preferences.whatsappNumber || undefined,
    startHour: preferences.startHour,
    endHour: preferences.endHour,
    allowedDays: preferences.allowedDays,
    notificationTypes: preferences.notificationTypes,
    morningReminder: preferences.morningReminder,
    improvementReminder: preferences.improvementReminder,
    taskReminder: preferences.taskReminder,
    habitReminder: preferences.habitReminder,
    motivation: preferences.motivation,
    dailySummary: preferences.dailySummary,
    morningTime: preferences.morningTime,
    improvementTime: preferences.improvementTime,
    noonTime: preferences.noonTime,
    afternoonTime: preferences.afternoonTime,
    eveningTime: preferences.eveningTime,
    nightTime: preferences.nightTime
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
    const userPreferences = preferences || await prisma.notificationSettings.create({
      data: {
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
        improvementReminder: false,
        taskReminder: true,
        habitReminder: true,
        motivation: true,
        dailySummary: true,
        morningTime: "08:00",
        improvementTime: "08:30",
        noonTime: "12:00",
        afternoonTime: "14:00",
        eveningTime: "18:00",
        nightTime: "22:00"
      }
    })

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Paramètres des notifications</h1>
        <NotificationSettings userId={userId} preferences={mapPrismaToFrontend(userPreferences)} />
      </div>
    )
  } catch (error) {
    console.error("Erreur lors de la récupération des préférences de notification:", error)
    redirect("/login")
  }
} 
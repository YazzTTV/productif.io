import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const body = await req.json();
    const {
      isEnabled,
      preferredHours,
      preferredDays,
      timezone,
      morningReminder,
      taskReminder,
      habitReminder,
      motivationMessages,
      dailySummary
    } = body;

    // Valider les données
    if (!Array.isArray(preferredHours) || !Array.isArray(preferredDays)) {
      return new NextResponse("Données invalides", { status: 400 });
    }

    // Mettre à jour ou créer les préférences
    const preferences = await prisma.userNotificationPreference.upsert({
      where: { userId },
      update: {
        isEnabled,
        preferredHours,
        preferredDays,
        timezone,
        morningReminder,
        taskReminder,
        habitReminder,
        motivationMessages,
        dailySummary
      },
      create: {
        userId,
        isEnabled,
        preferredHours,
        preferredDays,
        timezone,
        morningReminder,
        taskReminder,
        habitReminder,
        motivationMessages,
        dailySummary
      }
    });

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const preferences = await prisma.userNotificationPreference.findUnique({
      where: { userId }
    });

    if (!preferences) {
      // Retourner les préférences par défaut
      return NextResponse.json({
        isEnabled: true,
        preferredHours: [9, 12, 17],
        preferredDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
        timezone: "Europe/Paris",
        morningReminder: true,
        taskReminder: true,
        habitReminder: true,
        motivationMessages: true,
        dailySummary: true
      });
    }

    return NextResponse.json(preferences);
  } catch (error) {
    console.error("[NOTIFICATION_PREFERENCES]", error);
    return new NextResponse("Erreur interne", { status: 500 });
  }
} 
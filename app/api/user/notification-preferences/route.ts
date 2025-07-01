import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getAuthUser } from "@/lib/auth";

const prisma = new PrismaClient();

export async function PUT(req: Request) {
  try {
    const user = await getAuthUser();
    if (!user) {
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
    const preferences = await prisma.notificationSettings.upsert({
      where: { userId: user.id },
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
        userId: user.id,
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
    const user = await getAuthUser();
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 });
    }

    const preferences = await prisma.notificationSettings.findUnique({
      where: { userId: user.id }
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
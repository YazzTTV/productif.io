import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return new NextResponse("Non autorisé", { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()

    if (!currentPassword || !newPassword) {
      return new NextResponse("Mot de passe manquant", { status: 400 })
    }

    // Vérifier l'ancien mot de passe
    const userWithPassword = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password: true }
    })

    if (!userWithPassword?.password) {
      return new NextResponse("Compte non trouvé", { status: 404 })
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      userWithPassword.password
    )

    if (!isPasswordValid) {
      return new NextResponse("Mot de passe actuel incorrect", { status: 400 })
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    })

    return NextResponse.json({ message: "Mot de passe mis à jour avec succès" })
  } catch (error) {
    console.error("[PASSWORD_UPDATE]", error)
    return new NextResponse("Erreur interne", { status: 500 })
  }
} 
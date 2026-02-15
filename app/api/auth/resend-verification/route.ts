import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUserFromRequest } from "@/lib/auth"
import {
  canResendVerificationEmail,
  generateEmailVerificationToken,
  getEmailVerificationExpiry,
  sendEmailVerificationEmail,
} from "@/lib/email-verification"

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUserFromRequest(req)
    const body = await req.json().catch(() => ({}))
    const rawEmail = typeof body?.email === "string" ? body.email : ""
    const rawToken = typeof body?.token === "string" ? body.token : ""
    const normalizedEmail = rawEmail.trim().toLowerCase()

    const user = authUser
      ? await prisma.user.findUnique({ where: { id: authUser.id } })
      : normalizedEmail
        ? await prisma.user.findFirst({
            where: {
              email: {
                equals: normalizedEmail,
                mode: "insensitive",
              },
            },
          })
        : rawToken
          ? await prisma.user.findFirst({
              where: { emailVerificationToken: rawToken },
            })
          : null

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    if (user.emailVerifiedAt) {
      return NextResponse.json({ success: true, alreadyVerified: true })
    }

    if (!canResendVerificationEmail(user.emailVerificationSentAt)) {
      return NextResponse.json(
        { error: "Veuillez patienter avant de renvoyer un email." },
        { status: 429 }
      )
    }

    const token = generateEmailVerificationToken()
    const expiresAt = getEmailVerificationExpiry()

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: token,
        emailVerificationExpiresAt: expiresAt,
        emailVerificationSentAt: new Date(),
      },
    })

    try {
      await sendEmailVerificationEmail({
        email: user.email,
        name: user.name,
        token,
      })
    } catch (emailError) {
      console.error("Erreur envoi email de vérification:", emailError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erreur resend verification:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

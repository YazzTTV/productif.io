import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { renderEmailVerificationPage } from "@/lib/email-verification"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")

    if (!token) {
      return new NextResponse(
        renderEmailVerificationPage({
          title: "Lien invalide",
          message: "Le lien de vérification est manquant.",
        }),
        { status: 400, headers: { "Content-Type": "text/html" } }
      )
    }

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token },
      select: {
        id: true,
        emailVerifiedAt: true,
        emailVerificationExpiresAt: true,
      },
    })

    if (!user) {
      return new NextResponse(
        renderEmailVerificationPage({
          title: "Lien invalide",
          message: "Ce lien n'est plus valide. Demande un nouvel email de vérification.",
        }),
        { status: 400, headers: { "Content-Type": "text/html" } }
      )
    }

    if (user.emailVerifiedAt) {
      return new NextResponse(
        renderEmailVerificationPage({
          title: "Email déjà vérifié",
          message: "Ton email est déjà confirmé. Tu peux retourner dans l'app.",
        }),
        { status: 200, headers: { "Content-Type": "text/html" } }
      )
    }

    if (user.emailVerificationExpiresAt && user.emailVerificationExpiresAt < new Date()) {
      return new NextResponse(
        renderEmailVerificationPage({
          title: "Lien expiré",
          message: "Ce lien a expiré. Demande un nouvel email de vérification.",
        }),
        { status: 410, headers: { "Content-Type": "text/html" } }
      )
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationToken: null,
        emailVerificationExpiresAt: null,
      },
    })

    return new NextResponse(
      renderEmailVerificationPage({
        title: "Email vérifié",
        message: "Merci, ton email est confirmé. Tu peux retourner dans l'app.",
      }),
      { status: 200, headers: { "Content-Type": "text/html" } }
    )
  } catch (error) {
    console.error("Erreur vérification email:", error)
    return new NextResponse(
      renderEmailVerificationPage({
        title: "Erreur",
        message: "Une erreur est survenue. Réessaie plus tard.",
      }),
      { status: 500, headers: { "Content-Type": "text/html" } }
    )
  }
}


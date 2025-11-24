import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id: groupId } = await params
    const body = await request.json()
    const { emails } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json(
        { error: "Au moins un email est requis" },
        { status: 400 }
      )
    }

    // Vérifier que l'utilisateur est membre du groupe
    const membership = await prisma.leaderboardGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId,
          userId: user.id
        }
      }
    })

    if (!membership) {
      return NextResponse.json(
        { error: "Vous n'êtes pas membre de ce groupe" },
        { status: 403 }
      )
    }

    // Vérifier que le groupe existe
    const group = await prisma.leaderboardGroup.findUnique({
      where: { id: groupId }
    })

    if (!group) {
      return NextResponse.json(
        { error: "Groupe introuvable" },
        { status: 404 }
      )
    }

    const results = []

    for (const email of emails) {
      const trimmedEmail = email.trim().toLowerCase()
      
      if (!trimmedEmail || !trimmedEmail.includes('@')) {
        results.push({ email: trimmedEmail, success: false, error: "Email invalide" })
        continue
      }

      // Vérifier si l'utilisateur existe
      const invitedUser = await prisma.user.findUnique({
        where: { email: trimmedEmail }
      })

      if (!invitedUser) {
        results.push({ email: trimmedEmail, success: false, error: "Utilisateur non trouvé" })
        continue
      }

      // Vérifier si l'utilisateur est déjà membre
      const existingMember = await prisma.leaderboardGroupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: invitedUser.id
          }
        }
      })

      if (existingMember) {
        results.push({ email: trimmedEmail, success: false, error: "Déjà membre" })
        continue
      }

      // Vérifier si une invitation existe déjà
      const existingInvitation = await prisma.leaderboardGroupInvitation.findUnique({
        where: {
          groupId_email: {
            groupId,
            email: trimmedEmail
          }
        }
      })

      if (existingInvitation) {
        if (existingInvitation.status === 'pending') {
          results.push({ email: trimmedEmail, success: false, error: "Invitation déjà envoyée" })
          continue
        } else if (existingInvitation.status === 'accepted') {
          results.push({ email: trimmedEmail, success: false, error: "Déjà membre" })
          continue
        }
      }

      // Créer l'invitation
      try {
        await prisma.leaderboardGroupInvitation.create({
          data: {
            groupId,
            email: trimmedEmail,
            invitedBy: user.id,
            status: 'pending'
          }
        })
        results.push({ email: trimmedEmail, success: true })
      } catch (error) {
        results.push({ email: trimmedEmail, success: false, error: "Erreur lors de l'invitation" })
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Erreur lors de l'invitation:", error)
    return NextResponse.json(
      { error: "Erreur lors de l'invitation" },
      { status: 500 }
    )
  }
}


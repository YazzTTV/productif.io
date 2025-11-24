import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { inviteCode } = body

    if (!inviteCode) {
      return NextResponse.json(
        { error: "Code d'invitation requis" },
        { status: 400 }
      )
    }

    // Trouver le groupe par code d'invitation
    const group = await prisma.leaderboardGroup.findUnique({
      where: { inviteCode: inviteCode.toUpperCase() }
    })

    if (!group) {
      return NextResponse.json(
        { error: "Code d'invitation invalide" },
        { status: 404 }
      )
    }

    // Vérifier si l'utilisateur est déjà membre
    const existingMember = await prisma.leaderboardGroupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id
        }
      }
    })

    if (existingMember) {
      return NextResponse.json(
        { error: "Vous êtes déjà membre de ce groupe" },
        { status: 400 }
      )
    }

    // Ajouter l'utilisateur au groupe
    await prisma.leaderboardGroupMember.create({
      data: {
        groupId: group.id,
        userId: user.id
      }
    })

    // Mettre à jour l'invitation si elle existe
    await prisma.leaderboardGroupInvitation.updateMany({
      where: {
        groupId: group.id,
        email: user.email,
        status: 'pending'
      },
      data: {
        status: 'accepted'
      }
    })

    return NextResponse.json({
      success: true,
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode
      }
    })
  } catch (error) {
    console.error("Erreur lors de la jointure au groupe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la jointure au groupe" },
      { status: 500 }
    )
  }
}


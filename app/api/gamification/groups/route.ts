import { NextRequest, NextResponse } from "next/server"
import { getAuthUserFromRequest } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { randomBytes } from "crypto"

// GET - Liste des groupes de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer tous les groupes où l'utilisateur est membre
    const userGroups = await prisma.leaderboardGroupMember.findMany({
      where: { userId: user.id },
      include: {
        group: {
          include: {
            creator: {
              select: {
                id: true,
                name: true,
                email: true
              }
            },
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true
                  }
                }
              }
            },
            _count: {
              select: {
                members: true
              }
            }
          }
        }
      }
    })

    const groups = userGroups.map(ug => ({
      id: ug.group.id,
      name: ug.group.name,
      description: ug.group.description,
      inviteCode: ug.group.inviteCode,
      createdAt: ug.group.createdAt,
      createdBy: {
        id: ug.group.creator.id,
        name: ug.group.creator.name,
        email: ug.group.creator.email
      },
      memberCount: ug.group._count.members,
      isCreator: ug.group.createdBy === user.id,
      joinedAt: ug.joinedAt
    }))

    return NextResponse.json({ groups })
  } catch (error) {
    console.error("Erreur lors de la récupération des groupes:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des groupes" },
      { status: 500 }
    )
  }
}

// POST - Créer un nouveau groupe
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUserFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const body = await request.json()
    const { name, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Le nom du groupe est requis" },
        { status: 400 }
      )
    }

    // Générer un code d'invitation unique
    const inviteCode = randomBytes(8).toString('hex').toUpperCase()

    // Créer le groupe
    const group = await prisma.leaderboardGroup.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        createdBy: user.id,
        inviteCode,
        members: {
          create: {
            userId: user.id
          }
        }
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            members: true
          }
        }
      }
    })

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        description: group.description,
        inviteCode: group.inviteCode,
        createdAt: group.createdAt,
        createdBy: {
          id: group.creator.id,
          name: group.creator.name,
          email: group.creator.email
        },
        memberCount: group._count.members,
        isCreator: true,
        joinedAt: group.createdAt
      }
    })
  } catch (error) {
    console.error("Erreur lors de la création du groupe:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du groupe" },
      { status: 500 }
    )
  }
}


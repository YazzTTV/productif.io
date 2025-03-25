import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/projects - Récupérer tous les projets de l'utilisateur
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    // Récupérer le paramètre limit de l'URL
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")

    const projects = await prisma.project.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      include: {
        _count: {
          select: {
            tasks: {
              where: {
                completed: false,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error("[PROJECTS_GET]", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des projets" },
      { status: 500 }
    )
  }
}

// POST /api/projects - Créer un nouveau projet
export async function POST(req: Request) {
  try {
    // Vérifier l'authentification
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const decoded = await verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { error: "Non authentifié" },
        { status: 401 }
      )
    }

    const userId = decoded.userId

    const body = await req.json()
    const { name, description, color } = body

    const project = await prisma.project.create({
      data: {
        name,
        description,
        color,
        userId,
      },
    })

    return NextResponse.json(project)
  } catch (error) {
    console.error("[PROJECTS_POST]", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du projet" },
      { status: 500 }
    )
  }
}


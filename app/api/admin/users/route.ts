import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { prisma } from "@/lib/prisma"
import { hash } from "bcrypt"

// GET /api/admin/users - Récupérer tous les utilisateurs (pour super admin)
export async function GET(request: Request) {
  try {
    // Vérifier l'authentification et les droits
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as any
    const userId = decoded.id || decoded.userId

    // Vérifier que l'utilisateur est super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Récupérer tous les utilisateurs
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        companies: {
          include: {
            company: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })

    // Transformer les données pour y inclure le nom de l'entreprise
    const usersWithCompany = users.map(user => {
      const primaryCompany = user.companies && user.companies.length > 0
        ? user.companies[0].company.name
        : null

      return {
        ...user,
        companyName: primaryCompany,
        companies: undefined // Ne pas exposer les détails des relations
      }
    })

    return NextResponse.json(usersWithCompany)
  } catch (error) {
    console.error("[ADMIN_USERS_GET]", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des utilisateurs" },
      { status: 500 }
    )
  }
}

// POST /api/admin/users - Créer un nouvel utilisateur (pour super admin)
export async function POST(request: Request) {
  try {
    // Vérifier l'authentification et les droits
    const cookieStore = await cookies()
    const token = cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || "fallback_secret") as any
    const userId = decoded.id || decoded.userId

    // Vérifier que l'utilisateur est super admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true }
    })

    if (!user || user.role !== "SUPER_ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    // Récupérer les données de la requête
    const body = await request.json()
    const { name, email, password, role } = body

    // Validation des données
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email et mot de passe requis" },
        { status: 400 }
      )
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      )
    }

    // Hacher le mot de passe
    const hashedPassword = await hash(password, 10)

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        name: name || null,
        email,
        password: hashedPassword,
        role: role || "USER"
      }
    })

    // Ne pas renvoyer le mot de passe
    const { password: _, ...userWithoutPassword } = newUser

    return NextResponse.json(userWithoutPassword)
  } catch (error) {
    console.error("[ADMIN_USERS_POST]", error)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    )
  }
} 
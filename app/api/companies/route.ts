import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { getAllCompanies, createCompany, isUserAdmin } from "@/lib/admin-utils"

// GET - Récupérer les entreprises (réservé aux administrateurs)
export async function GET() {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les droits d'accès
    const isAdmin = await isUserAdmin(user.id)
    if (!isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }

    // Récupérer les entreprises selon le rôle de l'utilisateur
    const companies = await getAllCompanies(user.id)

    return NextResponse.json({ companies })
  } catch (error) {
    console.error("Erreur lors de la récupération des entreprises:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

// POST - Créer une nouvelle entreprise (réservé aux administrateurs)
export async function POST(req: Request) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Vérifier les droits d'accès - Seul un SUPER_ADMIN peut créer une entreprise
    const isSuperAdmin = await isUserAdmin(user.id, true)
    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: "Seuls les super administrateurs peuvent créer de nouvelles entreprises" 
      }, { status: 403 })
    }

    const { name, description, logo } = await req.json()

    // Validation des données
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Le nom de l'entreprise est requis" }, { status: 400 })
    }

    // Créer la nouvelle entreprise et lier l'administrateur actuel
    const company = await createCompany(name, description, logo, user.id)

    if (!company) {
      return NextResponse.json({ error: "Erreur lors de la création de l'entreprise" }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Entreprise créée avec succès", 
      company 
    }, { status: 201 })
  } catch (error) {
    console.error("Erreur lors de la création de l'entreprise:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 
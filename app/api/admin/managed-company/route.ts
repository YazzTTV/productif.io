import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { getManagedCompany } from "@/lib/admin-utils"

export async function GET() {
  try {
    const user = await getAuthUser()
    console.log("Utilisateur récupéré dans /api/admin/managed-company:", user)

    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    // Récupérer l'entreprise gérée
    const company = await getManagedCompany(user.id)
    console.log("Entreprise gérée récupérée:", company)

    if (!company) {
      return NextResponse.json(
        { error: "Aucune entreprise gérée trouvée pour cet utilisateur" },
        { status: 404 }
      )
    }

    return NextResponse.json({ company })
  } catch (error) {
    console.error("Erreur lors de la récupération de l'entreprise gérée:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
} 
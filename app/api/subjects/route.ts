import { NextResponse } from "next/server"
import { getAuthUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const subjects = await prisma.subject.findMany({
      where: { userId: user.id },
      orderBy: { coefficient: 'desc' },
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error("Erreur lors de la récupération des sujets:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des sujets" },
      { status: 500 }
    )
  }
}

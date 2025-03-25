import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getAuthUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const processes = await prisma.process.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(processes)
  } catch (error) {
    console.error("Erreur lors de la récupération des process:", error)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des process" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const user = await getAuthUser()
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
    }

    const { name, description } = await request.json()

    const process = await prisma.process.create({
      data: {
        name,
        description,
        userId: user.id,
      },
    })

    return NextResponse.json(process)
  } catch (error) {
    console.error("Erreur lors de la création du process:", error)
    return NextResponse.json(
      { error: "Erreur lors de la création du process" },
      { status: 500 }
    )
  }
} 
import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { TimeEntriesTable } from "@/components/time/time-entries-table"

export default async function TimeHistoryPage() {
  // Vérifier l'authentification côté serveur
  const token = cookies().get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  let user
  try {
    user = verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    redirect("/login")
  }

  const userId = (user as any).id

  // Récupérer toutes les entrées de temps
  const timeEntries = await prisma.timeEntry.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      startTime: "desc",
    },
    include: {
      task: {
        select: {
          id: true,
          title: true,
        },
      },
      project: {
        select: {
          id: true,
          name: true,
          color: true,
        },
      },
    },
  })

  // Calculer le temps total
  const totalDuration = timeEntries.reduce((total, entry) => {
    return total + (entry.duration || 0)
  }, 0)

  // Formater la durée totale
  const formatTotalDuration = (durationInSeconds: number) => {
    const hours = Math.floor(durationInSeconds / 3600)
    const minutes = Math.floor((durationInSeconds % 3600) / 60)

    return `${hours}h ${minutes}m`
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/time">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour au suivi du temps
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Historique du temps</h1>
          <p className="text-gray-600 mt-1">Temps total suivi : {formatTotalDuration(totalDuration)}</p>
        </div>
      </div>

      <TimeEntriesTable entries={timeEntries} />
    </div>
  )
}


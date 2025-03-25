import Link from "next/link"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { verifyToken } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { EditHabitForm } from "@/components/habits/edit-habit-form"

export default async function EditHabitPage({ params }: { params: { id: string } }) {
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  const decoded = await verifyToken(token)
  if (!decoded) {
    redirect("/login")
  }

  const habit = await prisma.habit.findUnique({
    where: {
      id: params.id,
      userId: decoded.userId,
    },
    select: {
      id: true,
      name: true,
      description: true,
      color: true,
      daysOfWeek: true,
    },
  })

  if (!habit) {
    redirect("/dashboard/habits")
  }

  return (
    <div className="container mx-auto py-6 max-w-2xl">
      <div className="mb-6">
        <Link href="/dashboard/habits">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux habitudes
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Modifier l'habitude
        </h1>
        <p className="text-gray-600 mb-8">
          Modifiez les détails de votre habitude
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <EditHabitForm habit={habit} />
      </div>
    </div>
  )
} 
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CreateHabitForm } from "@/components/habits/create-habit-form"

export default function NewHabitPage() {
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
          Créer une nouvelle habitude
        </h1>
        <p className="text-gray-600 mb-8">
          Définissez une nouvelle habitude à suivre et à développer
        </p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <CreateHabitForm />
      </div>
    </div>
  )
} 
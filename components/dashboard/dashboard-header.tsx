import Link from "next/link"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"

export function DashboardHeader() {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue sur votre espace de productivité</p>
      </div>
      <div className="flex space-x-2">
        <Link href="/dashboard/tasks/new">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Nouvelle tâche
          </Button>
        </Link>
      </div>
    </div>
  )
}


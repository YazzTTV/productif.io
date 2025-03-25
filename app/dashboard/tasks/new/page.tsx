import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import { CreateTaskForm } from "@/components/tasks/create-task-form"

export default async function NewTaskPage() {
  // Vérifier l'authentification côté serveur
  const cookieStore = await cookies()
  const token = cookieStore.get("auth_token")?.value

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

  return (
    <div className="container mx-auto py-6 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Créer une nouvelle tâche</h1>
        <p className="text-gray-600 mt-1">Ajoutez une nouvelle tâche à votre liste</p>
      </div>

      <div className="bg-gray-50 rounded-xl p-6">
        <CreateTaskForm userId={userId} />
      </div>
    </div>
  )
}


import { cookies } from "next/headers"
import { verify } from "jsonwebtoken"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { ProjectForm } from "@/components/projects/project-form"

export default function NewProjectPage() {
  // Vérifier l'authentification côté serveur
  const token = cookies().get("auth_token")?.value

  if (!token) {
    redirect("/login")
  }

  try {
    verify(token, process.env.JWT_SECRET || "fallback_secret")
  } catch (error) {
    redirect("/login")
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/dashboard/projects">
          <Button variant="ghost" className="pl-0">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux projets
          </Button>
        </Link>
      </div>

      <ProjectForm />
    </div>
  )
}


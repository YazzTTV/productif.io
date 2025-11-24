import Link from "next/link"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, PlusCircle } from "lucide-react"

interface Project {
  id: string
  name: string
  description: string | null
  color: string | null
  _count?: {
    tasks: number
  }
}

interface ProjectsListProps {
  projects: Project[]
}

export function ProjectsList({ projects }: ProjectsListProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle>Projets</CardTitle>
          <Link href="/dashboard/projects/new">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-[#00C27A] to-[#00D68F] text-white rounded-xl shadow-sm flex items-center gap-2 text-sm"
            >
              <PlusCircle className="h-4 w-4" />
              <span>Nouveau</span>
            </motion.button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {projects.length === 0 ? (
          <div className="text-center py-6 text-gray-500">Aucun projet. Créez votre premier projet !</div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div
                      className="w-3 h-3 rounded-full mr-2"
                      style={{ backgroundColor: project.color || "#6366F1" }}
                    />
                    <Link href={`/dashboard/projects/${project.id}`} className="font-medium hover:underline">
                      {project.name}
                    </Link>
                  </div>
                  <div className="text-sm text-gray-500">{project._count?.tasks} tâches</div>
                </div>
                {project.description && <p className="text-sm text-gray-500 truncate">{project.description}</p>}
              </div>
            ))}

            <div className="pt-2">
              <Link href="/dashboard/projects">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full px-4 py-2.5 hover:bg-gray-100 text-gray-700 rounded-xl flex items-center justify-between transition-colors"
                >
                  <span>Voir tous les projets</span>
                  <ArrowRight className="h-4 w-4" />
                </motion.button>
              </Link>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


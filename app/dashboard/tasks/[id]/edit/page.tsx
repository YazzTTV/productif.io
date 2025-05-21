import { EditTaskForm } from "@/components/tasks/edit-task-form"

interface EditTaskPageProps {
  params: {
    id: string
  }
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  // Récupérer l'ID de la tâche de manière asynchrone
  const taskId = params.id
  
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Modifier la tâche</h1>
      <EditTaskForm taskId={taskId} />
    </div>
  )
} 
import { EditTaskForm } from "@/components/tasks/edit-task-form"

interface EditTaskPageProps {
  params: {
    id: string
  }
}

export default function EditTaskPage({ params }: EditTaskPageProps) {
  return (
    <div className="container py-10">
      <h1 className="text-2xl font-bold mb-8">Modifier la tâche</h1>
      <EditTaskForm taskId={params.id} />
    </div>
  )
} 
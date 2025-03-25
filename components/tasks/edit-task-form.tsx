"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProjectSelect } from "./project-select"
import { toast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  priority: z.string(),
  energyLevel: z.string(),
  dueDate: z.date().optional(),
  projectId: z.string().optional(),
})

interface EditTaskFormProps {
  taskId: string
}

export function EditTaskForm({ taskId }: EditTaskFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "P3",
      energyLevel: "Moyen",
      projectId: "",
    },
  })

  useEffect(() => {
    async function fetchTask() {
      try {
        const response = await fetch(`/api/tasks/${taskId}`)
        if (!response.ok) {
          throw new Error("Erreur lors de la récupération de la tâche")
        }
        const task = await response.json()
        
        form.reset({
          title: task.title,
          description: task.description || "",
          priority: task.priority !== null ? `P${task.priority}` : "P3",
          energyLevel: task.energyLevel !== null ? {
            0: "Extrême",
            1: "Élevé",
            2: "Moyen",
            3: "Faible"
          }[task.energyLevel] : "Moyen",
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          projectId: task.projectId || "",
        })
      } catch (error) {
        console.error("Erreur:", error)
        setError("Impossible de charger la tâche")
      } finally {
        setIsLoading(false)
      }
    }
    fetchTask()
  }, [taskId, form])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      const formData = {
        ...data,
        priority: data.priority ? parseInt(data.priority.replace('P', '')) : null,
        energyLevel: data.energyLevel ? {
          'Extrême': 0,
          'Élevé': 1,
          'Moyen': 2,
          'Faible': 3
        }[data.energyLevel] : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId || null
      }

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la modification de la tâche")
      }

      router.refresh()
      router.push("/dashboard/tasks")
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la modification de la tâche",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (isLoading) {
    return <div>Chargement...</div>
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Titre</FormLabel>
              <FormControl>
                <Input placeholder="Titre de la tâche" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Description de la tâche"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="priority"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Priorité</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="P0">Quick Win</SelectItem>
                    <SelectItem value="P1">Urgent</SelectItem>
                    <SelectItem value="P2">Important</SelectItem>
                    <SelectItem value="P3">A faire</SelectItem>
                    <SelectItem value="P4">Optionnel</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="energyLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau d'énergie</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau d'énergie" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Extrême">Extrême</SelectItem>
                    <SelectItem value="Élevé">Élevé</SelectItem>
                    <SelectItem value="Moyen">Moyen</SelectItem>
                    <SelectItem value="Faible">Faible</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date d'échéance</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "d MMMM yyyy", { locale: fr })
                        ) : (
                          <span>Choisir une date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="projectId"
            render={({ field }) => (
              <FormItem>
                <ProjectSelect
                  value={field.value}
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/tasks")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Modification..." : "Modifier la tâche"}
          </Button>
        </div>
      </form>
    </Form>
  )
} 
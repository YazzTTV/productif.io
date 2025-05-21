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
        setIsLoading(true)
        const response = await fetch(`/api/tasks/${taskId}`)
        
        if (!response.ok) {
          // Gérer les différents cas d'erreur HTTP
          if (response.status === 404) {
            throw new Error("Cette tâche n'existe pas ou a été supprimée.")
          } else if (response.status === 403) {
            throw new Error("Vous n'avez pas l'autorisation d'accéder à cette tâche.")
          } else if (response.status === 401) {
            throw new Error("Veuillez vous connecter pour accéder à cette tâche.")
          } else {
            throw new Error("Erreur lors de la récupération de la tâche. Veuillez réessayer.")
          }
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
        if (error instanceof Error) {
          setError(error.message)
        } else {
          setError("Impossible de charger la tâche")
        }
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTask()
  }, [taskId, form])

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)
    
    try {
      // Convertir le niveau d'énergie en valeur numérique
      let energyLevelValue: number | null = null;
      if (data.energyLevel === 'Extrême') energyLevelValue = 0;
      else if (data.energyLevel === 'Élevé') energyLevelValue = 1;
      else if (data.energyLevel === 'Moyen') energyLevelValue = 2;
      else if (data.energyLevel === 'Faible') energyLevelValue = 3;
      
      const formData = {
        ...data,
        priority: data.priority ? parseInt(data.priority.replace('P', '')) : null,
        energyLevel: energyLevelValue,
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
      
      // Vérifier s'il existe une page de retour stockée
      const returnTo = localStorage.getItem('returnTo');
      if (returnTo) {
        // Supprimer la valeur du localStorage pour ne pas affecter les éditions futures
        localStorage.removeItem('returnTo');
        router.push(returnTo);
      } else {
        // Comportement par défaut si aucune page de retour n'est spécifiée
        router.push("/dashboard/tasks");
      }
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
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mt-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Erreur</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                type="button"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={() => {
                  // Vérifier s'il existe une page de retour stockée
                  const returnTo = localStorage.getItem('returnTo');
                  if (returnTo) {
                    localStorage.removeItem('returnTo');
                    router.push(returnTo);
                  } else {
                    router.push("/dashboard/tasks");
                  }
                }}
              >
                Retour au tableau des tâches
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">Chargement de la tâche...</span>
      </div>
    )
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
            onClick={() => {
              // Vérifier s'il existe une page de retour stockée
              const returnTo = localStorage.getItem('returnTo');
              if (returnTo) {
                localStorage.removeItem('returnTo');
                router.push(returnTo);
              } else {
                router.push("/dashboard/tasks");
              }
            }}
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
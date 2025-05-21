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
  FormDescription,
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
import { CalendarIcon, Plus, Save, ChevronDown, ChevronRight } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ProjectSelect } from "./project-select"
import { toast } from "@/components/ui/use-toast"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProcessSelector } from "@/components/time/process-selector"
import { ProcessSteps } from "@/components/time/process-steps"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

interface Process {
  id: string
  name: string
  description: string
}

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  priority: z.string(),
  energyLevel: z.string(),
  dueDate: z.date().optional(),
  projectId: z.string().optional(),
  useProcess: z.boolean().default(false),
})

export function CreateTaskForm() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [process, setProcess] = useState("")
  const [savedProcessId, setSavedProcessId] = useState<string | null>(null)
  const [showSaveProcessDialog, setShowSaveProcessDialog] = useState(false)
  const [processName, setProcessName] = useState("")

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "P3",
      energyLevel: "Moyen",
      projectId: "",
      useProcess: false,
    },
  })

  const useProcess = form.watch("useProcess")

  const handleProcessSelect = (selectedProcess: Process | null) => {
    if (selectedProcess) {
      // Si on sélectionne un processus existant, sauvegarder son ID
      setSavedProcessId(selectedProcess.id)
      
      try {
        // Essayer de parser le process comme JSON
        const parsed = JSON.parse(selectedProcess.description)
        
        // Si c'est un tableau et que les éléments ont la structure attendue
        if (Array.isArray(parsed) && parsed.some(item => 
          typeof item === 'object' && 
          'title' in item && 
          'subSteps' in item
        )) {
          setProcess(selectedProcess.description)
        } else {
          // Convertir en nouveau format
          const simpleStep = [{
            id: Math.random().toString(36).substr(2, 9),
            title: selectedProcess.name,
            completed: false,
            isExpanded: true,
            subSteps: [{
              id: Math.random().toString(36).substr(2, 9),
              title: selectedProcess.description,
              completed: false,
              isExpanded: true,
              subSteps: []
            }]
          }]
          setProcess(JSON.stringify(simpleStep))
        }
      } catch (error) {
        // Si ce n'est pas du JSON du tout
        const simpleStep = [{
          id: Math.random().toString(36).substr(2, 9),
          title: selectedProcess.name,
          completed: false,
          isExpanded: true,
          subSteps: [{
            id: Math.random().toString(36).substr(2, 9),
            title: selectedProcess.description,
            completed: false,
            isExpanded: true,
            subSteps: []
          }]
        }]
        setProcess(JSON.stringify(simpleStep))
      }
    } else {
      setSavedProcessId(null)
      setProcess("")
    }
  }

  const handleSaveProcess = async () => {
    if (!processName.trim() || !process.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du processus est requis.",
        variant: "destructive",
      })
      return
    }

    try {
      const response = await fetch("/api/processes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: processName,
          description: process,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la sauvegarde du processus")
      }

      const data = await response.json();
      setSavedProcessId(data.id); // Sauvegarder l'ID du processus créé

      toast({
        title: "Succès",
        description: "Le processus a été sauvegardé avec succès.",
      })
      setShowSaveProcessDialog(false)
      setProcessName("")
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la sauvegarde du processus.",
        variant: "destructive",
      })
    }
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true)

    try {
      // Convertir les valeurs en nombres
      const formData = {
        ...data,
        priority: data.priority ? parseInt(data.priority.replace('P', '')) : null,
        energyLevel: data.energyLevel ? {
          'Faible': 0,
          'Moyen': 1,
          'Élevé': 2,
          'Extrême': 3
        }[data.energyLevel] : null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        projectId: data.projectId || null
      }

      // Créer la tâche
      const taskResponse = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          processId: savedProcessId, // Utiliser l'ID du processus sauvegardé s'il existe
          processDescription: data.useProcess && !savedProcessId ? process : null, // Ne créer un nouveau processus que si nécessaire
        }),
      });

      if (!taskResponse.ok) {
        throw new Error("Erreur lors de la création de la tâche");
      }

      form.reset();
      router.refresh();
      router.push("/dashboard/tasks");
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de la tâche",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une priorité" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="P4">Quick Win</SelectItem>
                    <SelectItem value="P3">Urgent</SelectItem>
                    <SelectItem value="P2">Important</SelectItem>
                    <SelectItem value="P1">A faire</SelectItem>
                    <SelectItem value="P0">Optionnel</SelectItem>
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
                <Select onValueChange={field.onChange} defaultValue={field.value}>
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

        <FormField
          control={form.control}
          name="useProcess"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Utiliser un processus</FormLabel>
                <FormDescription>
                  Associez cette tâche à un processus existant ou créez-en un nouveau.
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {useProcess && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-semibold">Process</CardTitle>
              <Button
                variant="outline"
                onClick={() => setShowSaveProcessDialog(true)}
                className="flex items-center gap-2"
                type="button"
              >
                <Save className="h-4 w-4" />
                Sauvegarder le process
              </Button>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <ProcessSelector onSelect={handleProcessSelect} />
                <ProcessSteps
                  key={process} // Force re-render when process changes
                  value={process}
                  onChange={(newValue) => {
                    setProcess(newValue)
                    // Si l'utilisateur modifie le processus, réinitialiser l'ID du processus sauvegardé
                    if (savedProcessId) {
                      setSavedProcessId(null);
                    }
                  }}
                />
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/dashboard/tasks")}
          >
            Annuler
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Création..." : "Créer la tâche"}
          </Button>
        </div>
      </form>

      <Dialog open={showSaveProcessDialog} onOpenChange={setShowSaveProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sauvegarder le processus</DialogTitle>
            <DialogDescription>
              Donnez un nom à ce processus pour le réutiliser plus tard.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Nom du processus"
            value={processName}
            onChange={(e) => setProcessName(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveProcessDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleSaveProcess}>Sauvegarder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Form>
  )
} 
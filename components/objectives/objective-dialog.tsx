"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  target: z.number().min(0, "La cible doit être positive"),
  current: z.number().min(0, "La valeur actuelle doit être positive"),
})

interface ObjectiveDialogProps {
  missionId: string
  onObjectiveCreated: () => void
  trigger?: React.ReactNode
}

export function ObjectiveDialog({
  missionId,
  onObjectiveCreated,
  trigger,
}: ObjectiveDialogProps) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      target: 100,
      current: 0,
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      const response = await fetch("/api/objectives", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...values,
          missionId,
        }),
      })

      if (!response.ok) {
        throw new Error("Erreur lors de la création de l'objectif")
      }

      toast({
        title: "Objectif créé",
        description: "L'objectif a été créé avec succès.",
      })

      form.reset()
      setOpen(false)
      onObjectiveCreated()
    } catch (error) {
      console.error("Erreur:", error)
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création de l'objectif.",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || <Button>Nouvel objectif</Button>}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nouvel objectif</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Titre</FormLabel>
                  <FormControl>
                    <Input placeholder="Titre de l'objectif" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur cible</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="100" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="current"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valeur actuelle</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full">
              Créer l'objectif
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
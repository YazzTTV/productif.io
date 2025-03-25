"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/components/ui/use-toast"

const formSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
})

type MissionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onMissionCreated?: () => void
  quarter: number
  year: number
}

export function MissionDialog({
  open,
  onOpenChange,
  onMissionCreated,
  quarter,
  year,
}: MissionDialogProps) {
  const { toast } = useToast()
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
    },
  })

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          quarter,
          year,
        }),
      })

      if (!response.ok) throw new Error("Erreur lors de la création de la mission")

      toast({
        title: "Mission créée",
        description: "La mission a été ajoutée pour ce trimestre",
      })

      form.reset()
      onOpenChange(false)
      onMissionCreated?.()
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer la mission",
        variant: "destructive",
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Nouvelle mission</DialogTitle>
          <DialogDescription>
            Définissez votre mission pour le trimestre {quarter} de l'année {year}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mission</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Ex: Développer la présence en ligne de l'entreprise" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="submit">Créer la mission</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 
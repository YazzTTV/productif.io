"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ChevronLeft, Building2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { AdminRequiredPage } from "@/components/auth/admin-required"

export default function NewCompanyPage() {
  return (
    <AdminRequiredPage>
      <div className="mb-6">
        <Link href="/dashboard/admin/companies" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-2">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Retour à la liste des entreprises
        </Link>
        <h1 className="text-3xl font-bold">Nouvelle entreprise</h1>
        <p className="text-muted-foreground">Créer une nouvelle entreprise sur la plateforme</p>
      </div>

      <CompanyForm />
    </AdminRequiredPage>
  )
}

function CompanyForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: ""
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/companies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: "Entreprise créée",
          description: "L'entreprise a été créée avec succès",
          variant: "default"
        })
        router.push("/dashboard/admin/companies")
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.error || "Une erreur est survenue")
      }
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la création de l'entreprise",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6" />
          <CardTitle>Informations de l'entreprise</CardTitle>
        </div>
        <CardDescription>
          Renseignez les informations de la nouvelle entreprise
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nom de l'entreprise *</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Nom de l'entreprise"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Description de l'entreprise"
              rows={4}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="logo">URL du logo</Label>
            <Input
              id="logo"
              name="logo"
              value={formData.logo || ""}
              onChange={handleChange}
              placeholder="https://exemple.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              URL d'une image pour le logo de l'entreprise (optionnel)
            </p>
          </div>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            Annuler
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Création en cours..." : "Créer l'entreprise"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
} 
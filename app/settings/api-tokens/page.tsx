"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"
import { Info, Plus, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Liste des scopes disponibles
const availableScopes = [
  { id: "habits:read", label: "Lecture des habitudes" },
  { id: "habits:write", label: "Écriture des habitudes" },
  { id: "tasks:read", label: "Lecture des tâches" },
  { id: "tasks:write", label: "Écriture des tâches" },
  { id: "projects:read", label: "Lecture des projets" },
  { id: "projects:write", label: "Écriture des projets" },
  { id: "objectives:read", label: "Lecture des objectifs" },
  { id: "objectives:write", label: "Écriture des objectifs" },
]

// Schéma de validation du formulaire
const formSchema = z.object({
  name: z.string().min(3, {
    message: "Le nom doit comporter au moins 3 caractères.",
  }),
  description: z.string().optional(),
  scopes: z.array(z.string()).min(1, {
    message: "Sélectionnez au moins un scope.",
  }),
  expiresAt: z.string().optional(),
})

type Token = {
  id: string
  name: string
  description: string | null
  scopes: string[]
  lastUsed: string | null
  expiresAt: string | null
  createdAt: string
}

export default function ApiTokensPage() {
  const router = useRouter()
  const [tokens, setTokens] = useState<Token[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [newToken, setNewToken] = useState<{token: string} | null>(null)
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      scopes: [],
    },
  })
  
  // Charger les tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const response = await fetch("/api/tokens")
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des tokens")
        }
        const data = await response.json()
        setTokens(data)
      } catch (error) {
        console.error("Erreur:", error)
        toast.error("Impossible de charger les tokens")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchTokens()
  }, [])
  
  // Créer un nouveau token
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const response = await fetch("/api/tokens", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la création du token")
      }
      
      const data = await response.json()
      setNewToken(data)
      
      // Ajouter le nouveau token à la liste (sans le token complet)
      setTokens([{
        id: data.id,
        name: data.name,
        description: data.description,
        scopes: data.scopes,
        lastUsed: data.lastUsed,
        expiresAt: data.expiresAt,
        createdAt: data.createdAt
      }, ...tokens])
      
      form.reset()
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Impossible de créer le token")
    }
  }
  
  // Supprimer un token
  const deleteToken = async (id: string) => {
    if (!confirm("Êtes-vous sûr de vouloir révoquer ce token ?")) {
      return
    }
    
    try {
      const response = await fetch(`/api/tokens/${id}`, {
        method: "DELETE",
      })
      
      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du token")
      }
      
      setTokens(tokens.filter(token => token.id !== id))
      toast.success("Token révoqué avec succès")
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Impossible de révoquer le token")
    }
  }
  
  // Fermer le dialogue et réinitialiser le token
  const closeDialog = () => {
    setIsOpen(false)
    setTimeout(() => setNewToken(null), 300) // Réinitialiser après la fermeture
  }
  
  // Formater la date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Tokens API</h1>
          <p className="text-gray-500">Gérez les tokens API pour permettre aux agents IA d'accéder à votre compte.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau token
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            {newToken ? (
              <>
                <DialogHeader>
                  <DialogTitle>Token créé avec succès</DialogTitle>
                  <DialogDescription>
                    Copiez ce token maintenant. Il ne sera plus jamais affiché.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-4 mb-4">
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md font-mono text-sm break-all">
                    {newToken.token}
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => {
                    navigator.clipboard.writeText(newToken.token)
                    toast.success("Token copié dans le presse-papiers")
                  }}>
                    Copier
                  </Button>
                  <Button variant="outline" onClick={closeDialog}>
                    Fermer
                  </Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Créer un nouveau token API</DialogTitle>
                  <DialogDescription>
                    Créez un token pour permettre aux agents IA d'accéder à votre compte.
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nom</FormLabel>
                          <FormControl>
                            <Input placeholder="Assistant IA" {...field} />
                          </FormControl>
                          <FormDescription>
                            Un nom descriptif pour identifier ce token.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (optionnelle)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ce token est utilisé pour..." 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="expiresAt"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date d'expiration (optionnelle)</FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
                              {...field} 
                              value={field.value || ""} 
                            />
                          </FormControl>
                          <FormDescription>
                            Laissez vide pour un token sans date d'expiration.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="scopes"
                      render={() => (
                        <FormItem>
                          <div className="mb-4">
                            <FormLabel>Permissions</FormLabel>
                            <FormDescription>
                              Sélectionnez les permissions à accorder à ce token.
                            </FormDescription>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {availableScopes.map((scope) => (
                              <FormField
                                key={scope.id}
                                control={form.control}
                                name="scopes"
                                render={({ field }) => {
                                  return (
                                    <FormItem
                                      key={scope.id}
                                      className="flex flex-row items-start space-x-3 space-y-0"
                                    >
                                      <FormControl>
                                        <Checkbox
                                          checked={field.value?.includes(scope.id)}
                                          onCheckedChange={(checked) => {
                                            return checked
                                              ? field.onChange([...field.value, scope.id])
                                              : field.onChange(
                                                  field.value?.filter(
                                                    (value) => value !== scope.id
                                                  )
                                                )
                                          }}
                                        />
                                      </FormControl>
                                      <FormLabel className="font-normal">
                                        {scope.label}
                                      </FormLabel>
                                    </FormItem>
                                  )
                                }}
                              />
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <DialogFooter>
                      <Button type="submit">Créer token</Button>
                    </DialogFooter>
                  </form>
                </Form>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
      
      <Separator />
      
      <div className="flex items-center space-x-2 text-sm bg-blue-50 dark:bg-blue-950 text-blue-800 dark:text-blue-200 p-4 rounded-md">
        <Info className="h-4 w-4" />
        <span>
          Les tokens API permettent aux applications tierces et aux agents IA d'accéder à votre compte. 
          <Link href="/docs/api-tokens" className="ml-1 underline">
            En savoir plus
          </Link>
        </span>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Chargement des tokens...</div>
      ) : tokens.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500">Vous n'avez pas encore créé de token API.</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Créer un token
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Permissions</TableHead>
              <TableHead>Dernière utilisation</TableHead>
              <TableHead>Expiration</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>
                  <div className="font-medium">{token.name}</div>
                  {token.description && (
                    <div className="text-xs text-gray-500">{token.description}</div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {token.scopes.map((scope) => (
                      <Badge key={scope} variant="outline" className="text-xs">
                        {scope}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  {token.lastUsed ? formatDate(token.lastUsed) : "Jamais"}
                </TableCell>
                <TableCell>
                  {token.expiresAt ? formatDate(token.expiresAt) : "Jamais"}
                </TableCell>
                <TableCell>
                  {formatDate(token.createdAt)}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteToken(token.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
} 
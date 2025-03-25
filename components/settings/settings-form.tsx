"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { useTheme } from "next-themes"
import { useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { useLocale, Locale } from "@/lib/i18n"

interface User {
  id: string
  email: string
  name: string | null
  createdAt: Date
}

interface SettingsFormProps {
  user: User
}

export function SettingsForm({ user }: SettingsFormProps) {
  const [name, setName] = useState(user.name || "")
  const [emailNotifications, setEmailNotifications] = useState(false)
  const [taskReminders, setTaskReminders] = useState(false)
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()
  const { locale, setLocale, t } = useLocale()
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          preferences: {
            emailNotifications,
            taskReminders,
            theme,
            language: locale,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(t('error'))
      }

      toast({
        title: t('success'),
        description: t('settingsUpdated'),
      })
    } catch (error) {
      toast({
        title: t('error'),
        description: t('settingsUpdated'),
        variant: "destructive",
      })
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: t('error'),
        description: t('passwordMismatch'),
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 8) {
      toast({
        title: t('error'),
        description: t('passwordTooShort'),
        variant: "destructive",
      })
      return
    }

    setIsUpdatingPassword(true)

    try {
      console.log("URL de l'API:", `/api/user-password`);
      console.log("Méthode:", "POST");
      
      const response = await fetch(`/api/user-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      })

      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.log("Erreur de réponse:", data);
        throw new Error(data.error || t('error'))
      }

      toast({
        title: t('success'),
        description: t('passwordUpdated'),
      })

      // Réinitialiser le formulaire et fermer le dialogue
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setShowPasswordDialog(false)
    } catch (error: any) {
      console.error("Erreur complète:", error);
      toast({
        title: t('error'),
        description: error.message || t('error'),
        variant: "destructive",
      })
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  const handleDeleteAccount = async () => {
    const deleteText = locale === 'fr' ? 'SUPPRIMER' : 'DELETE';
    
    if (deleteConfirmation !== deleteText) {
      toast({
        title: t('error'),
        description: t('invalidConfirmation'),
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)

    try {
      const response = await fetch("/api/users/me", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || t('error'))
      }

      // Rediriger vers la page d'accueil
      toast({
        title: t('accountDeleted'),
        description: t('accountDeletedDescription'),
      })
      
      // Petite pause pour que l'utilisateur puisse voir le toast
      setTimeout(() => {
        setShowDeleteDialog(false)
        router.push("/")
      }, 1500)
    } catch (error: any) {
      toast({
        title: t('error'),
        description: error.message || t('error'),
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('accountInfo')}</CardTitle>
          <CardDescription>
            {t('managePersonalInfo')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>{t('email')}</Label>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <div>
            <Label htmlFor="name">{t('name')}</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('name')}
            />
          </div>
          <div>
            <Label>{t('memberSince')}</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(user.createdAt).toLocaleDateString(locale === 'fr' ? "fr-FR" : "en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('password')}</CardTitle>
          <CardDescription>
            {t('changePassword')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
            <DialogTrigger asChild>
              <Button variant="outline">{t('changePassword')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('changePassword')}</DialogTitle>
                <DialogDescription>
                  {t('changePassword')}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handlePasswordUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">{t('currentPassword')}</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">{t('newPassword')}</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('confirmNewPassword')}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? t('updating') : t('update')}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('preferences')}</CardTitle>
          <CardDescription>
            {t('customizeExperience')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="theme">{t('theme')}</Label>
            <Select value={theme || "system"} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">{t('light')}</SelectItem>
                <SelectItem value="dark">{t('dark')}</SelectItem>
                <SelectItem value="system">{t('system')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="language">{t('language')}</Label>
            <Select value={locale} onValueChange={(value: Locale) => setLocale(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
          <CardDescription>
            {t('manageNotifications')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('emailNotifications')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('receiveEmailNotifications')}
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={setEmailNotifications}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{t('taskReminders')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('receiveTaskReminders')}
              </p>
            </div>
            <Switch
              checked={taskReminders}
              onCheckedChange={setTaskReminders}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('accountDeletion')}</CardTitle>
          <CardDescription>
            {t('deleteAccountDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('deleteAccount')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('areYouSure')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('irreversibleAction')} {t('typeDeleteToConfirm')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-4">
                <Input
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={locale === 'fr' ? "SUPPRIMER" : "DELETE"}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || deleteConfirmation !== (locale === 'fr' ? "SUPPRIMER" : "DELETE")}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? t('deleting') : t('deleteAccount')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>

      <Button type="submit" className="w-full">{t('update')}</Button>
    </form>
  )
} 
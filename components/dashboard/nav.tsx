"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { LayoutDashboard, CheckSquare, Clock, BarChart, Settings, FolderKanban, Heart, Target, Book, Users, Building2, LineChart } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n"

// Fonction utilitaire pour obtenir les premières lettres d'un nom
const getFirstLetters = (name: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
};

// Définir le type UserRole directement car nous n'avons pas accès à @prisma/client côté client
type UserRole = "SUPER_ADMIN" | "ADMIN" | "USER"

interface UserCompany {
  id: string
  name: string
  isActive: boolean
}

interface DashboardNavProps {
  viewAsMode?: boolean;
  viewAsUserId?: string;
}

export function DashboardNav({ viewAsMode = false, viewAsUserId }: DashboardNavProps) {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([])
  const [companyName, setCompanyName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLocale()

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // En mode visualisation, récupérer les infos de l'utilisateur spécifié
        const endpoint = viewAsMode && viewAsUserId 
          ? `/api/users/${viewAsUserId}` 
          : "/api/auth/me"
        
        const response = await fetch(endpoint)
        if (response.ok) {
          const data = await response.json()
          setUserRole(data.user.role)
          setCompanyName(data.user.companyName)
          
          if (data.companies && Array.isArray(data.companies)) {
            setUserCompanies(data.companies)
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du rôle de l'utilisateur:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserRole()
  }, [viewAsMode, viewAsUserId])

  // Déterminer si le lien est actif en tenant compte du mode visualisation
  const isActive = (path: string) => {
    if (viewAsMode && viewAsUserId) {
      // En mode visualisation, comparer avec le chemin standard correspondant
      const viewAsPath = `/dashboard/admin/view-as/${viewAsUserId}`
      if (path === '/dashboard') {
        return pathname === viewAsPath
      }
      return pathname.startsWith(viewAsPath + path.substring('/dashboard'.length))
    }
    return pathname === path
  }

  // Générer l'URL adaptée au mode visualisation
  const getHref = (path: string) => {
    if (viewAsMode && viewAsUserId) {
      if (path === '/dashboard') {
        return `/dashboard/admin/view-as/${viewAsUserId}`
      }
      return `/dashboard/admin/view-as/${viewAsUserId}${path.substring('/dashboard'.length)}`
    }
    return path
  }

  const isSuperAdmin = userRole === "SUPER_ADMIN"
  const isAdmin = userRole === "ADMIN"
  const hasAdminAccess = isSuperAdmin || isAdmin

  // En mode visualisation, ne pas afficher le menu d'administration ni les paramètres
  const showAdminMenu = hasAdminAccess && !viewAsMode
  const showSettings = !viewAsMode

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col gap-2">
        {viewAsMode && viewAsUserId && (
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getFirstLetters(viewAsUserId)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{viewAsUserId}</p>
              </div>
              <Link 
                href="/dashboard" 
                className={cn(
                  buttonVariants({ variant: "outline", size: "sm" }),
                  "text-xs"
                )}
              >
                {t('quit')}
              </Link>
            </div>
          </div>
        )}
      
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getHref("/dashboard")}
              className={cn(
                buttonVariants({
                  variant: isActive("/dashboard") ? "secondary" : "ghost",
                  size: "default",
                }),
                "justify-start w-full"
              )}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              {t('dashboard')}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{t('dashboard')}</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getHref("/dashboard/tasks")}
              className={cn(
                buttonVariants({
                  variant: isActive("/dashboard/tasks") ? "secondary" : "ghost",
                  size: "default",
                }),
                "justify-start w-full"
              )}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              {t('tasks')}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{t('tasks')}</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getHref("/dashboard/projects")}
              className={cn(
                buttonVariants({
                  variant: isActive("/dashboard/projects") ? "secondary" : "ghost",
                  size: "default",
                }),
                "justify-start w-full"
              )}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              {t('projects')}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{t('projects')}</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getHref("/dashboard/habits")}
              className={cn(
                buttonVariants({
                  variant: isActive("/dashboard/habits") ? "secondary" : "ghost",
                  size: "default",
                }),
                "justify-start w-full"
              )}
            >
              <Heart className="mr-2 h-4 w-4" />
              {t('habits')}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{t('habits')}</TooltipContent>
        </Tooltip>
        
        {!viewAsMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={getHref("/dashboard/mon-espace")}
                className={cn(
                  buttonVariants({
                    variant: isActive("/dashboard/mon-espace") ? "secondary" : "ghost",
                    size: "default",
                  }),
                  "justify-start w-full"
                )}
              >
                <Book className="mr-2 h-4 w-4" />
                {t('monEspace')}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('monEspace')}</TooltipContent>
          </Tooltip>
        )}
        
        {!viewAsMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={getHref("/dashboard/time")}
                className={cn(
                  buttonVariants({
                    variant: isActive("/dashboard/time") ? "secondary" : "ghost",
                    size: "default",
                  }),
                  "justify-start w-full"
                )}
              >
                <Clock className="mr-2 h-4 w-4" />
                {t('time')}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('time')}</TooltipContent>
          </Tooltip>
        )}
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href={getHref("/dashboard/objectives")}
              className={cn(
                buttonVariants({
                  variant: isActive("/dashboard/objectives") ? "secondary" : "ghost",
                  size: "default",
                }),
                "justify-start w-full"
              )}
            >
              <Target className="mr-2 h-4 w-4" />
              {t('objectives')}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">{t('objectives')}</TooltipContent>
        </Tooltip>
        
        {!viewAsMode && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href={getHref("/dashboard/analytics")}
                className={cn(
                  buttonVariants({
                    variant: isActive("/dashboard/analytics") ? "secondary" : "ghost",
                    size: "default",
                  }),
                  "justify-start w-full"
                )}
              >
                <LineChart className="mr-2 h-4 w-4" />
                {t('analytics')}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('analytics')}</TooltipContent>
          </Tooltip>
        )}

        {showAdminMenu && (
          <>
            <div className="h-px bg-border my-2" />
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/admin/companies"
                  className={cn(
                    buttonVariants({
                      variant: isActive("/dashboard/admin/companies") ? "secondary" : "ghost",
                      size: "default",
                    }),
                    "justify-start w-full"
                  )}
                >
                  <Building2 className="mr-2 h-4 w-4" />
                  {t('companies')}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{t('companies')}</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard/admin/users"
                  className={cn(
                    buttonVariants({
                      variant: isActive("/dashboard/admin/users") ? "secondary" : "ghost",
                      size: "default",
                    }),
                    "justify-start w-full"
                  )}
                >
                  <Users className="mr-2 h-4 w-4" />
                  {t('users')}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{t('users')}</TooltipContent>
            </Tooltip>
            
            {isSuperAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/admin/super-dashboard"
                    className={cn(
                      buttonVariants({
                        variant: isActive("/dashboard/admin/super-dashboard") ? "secondary" : "ghost",
                        size: "default",
                      }),
                      "justify-start w-full"
                    )}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    {t('adminDashboard')}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{t('adminDashboard')}</TooltipContent>
              </Tooltip>
            )}
            
            {!isSuperAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/admin/tasks"
                    className={cn(
                      buttonVariants({
                        variant: isActive("/dashboard/admin/tasks") ? "secondary" : "ghost",
                        size: "default",
                      }),
                      "justify-start w-full"
                    )}
                  >
                    <CheckSquare className="mr-2 h-4 w-4" />
                    {t('memberTasks')}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{t('memberTasks')}</TooltipContent>
              </Tooltip>
            )}
            
            {!isSuperAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/dashboard/admin/analytics"
                    className={cn(
                      buttonVariants({
                        variant: isActive("/dashboard/admin/analytics") ? "secondary" : "ghost",
                        size: "default",
                      }),
                      "justify-start w-full"
                    )}
                  >
                    <LineChart className="mr-2 h-4 w-4" />
                    {t('teamPerformance')}
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{t('teamPerformance')}</TooltipContent>
              </Tooltip>
            )}
          </>
        )}
        
        {showSettings && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn(
                  buttonVariants({
                    variant: pathname === "/dashboard/settings" ? "secondary" : "ghost",
                    size: "default",
                  }),
                  "justify-start w-full"
                )}
              >
                <Settings className="mr-2 h-4 w-4" />
                {t('settings')}
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('settings')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
} 
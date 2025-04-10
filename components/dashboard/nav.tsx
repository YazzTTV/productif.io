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
  onNavItemClick?: () => void;
}

export function DashboardNav({ viewAsMode = false, viewAsUserId, onNavItemClick }: DashboardNavProps) {
  const pathname = usePathname() || ""
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

  // Fonction pour gérer le clic sur un élément de navigation
  const handleNavClick = () => {
    if (onNavItemClick) {
      onNavItemClick();
    }
  };

  return (
    <TooltipProvider>
      <div className="w-full flex flex-col gap-2 p-4 pt-2">
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
                "justify-start w-full",
                "mt-6 md:mt-0"
              )}
              onClick={handleNavClick}
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              <span className="truncate">{t('dashboard')}</span>
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
              onClick={handleNavClick}
            >
              <CheckSquare className="mr-2 h-4 w-4" />
              <span className="truncate">{t('tasks')}</span>
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
              onClick={handleNavClick}
            >
              <FolderKanban className="mr-2 h-4 w-4" />
              <span className="truncate">{t('projects')}</span>
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
              onClick={handleNavClick}
            >
              <Heart className="mr-2 h-4 w-4" />
              <span className="truncate">{t('habits')}</span>
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
                onClick={handleNavClick}
              >
                <Book className="mr-2 h-4 w-4" />
                <span className="truncate">{t('monEspace')}</span>
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
                onClick={handleNavClick}
              >
                <Clock className="mr-2 h-4 w-4" />
                <span className="truncate">{t('time')}</span>
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
              onClick={handleNavClick}
            >
              <Target className="mr-2 h-4 w-4" />
              <span className="truncate">{t('objectives')}</span>
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
                onClick={handleNavClick}
              >
                <LineChart className="mr-2 h-4 w-4" />
                <span className="truncate">{t('analytics')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('analytics')}</TooltipContent>
          </Tooltip>
        )}

        {showAdminMenu && (
          <>
            <div className="h-px bg-border my-2" />
            
            {/* Menu Super Admin */}
            {isSuperAdmin && (
              <>
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
                      onClick={handleNavClick}
                    >
                      <Building2 className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('companies')}</span>
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
                      onClick={handleNavClick}
                    >
                      <Users className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('users')}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('users')}</TooltipContent>
                </Tooltip>

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
                      onClick={handleNavClick}
                    >
                      <LineChart className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('adminDashboard')}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('adminDashboard')}</TooltipContent>
                </Tooltip>
              </>
            )}

            {/* Menu Admin d'entreprise */}
            {(isAdmin || (isSuperAdmin && companyName)) && (
              <>
                {isSuperAdmin && <div className="h-px bg-border my-2" />}
                
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
                      onClick={handleNavClick}
                    >
                      <CheckSquare className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('memberTasks')}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('memberTasks')}</TooltipContent>
                </Tooltip>

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
                      onClick={handleNavClick}
                    >
                      <LineChart className="mr-2 h-4 w-4" />
                      <span className="truncate">{t('teamPerformance')}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">{t('teamPerformance')}</TooltipContent>
                </Tooltip>
              </>
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
                onClick={handleNavClick}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span className="truncate">{t('settings')}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">{t('settings')}</TooltipContent>
          </Tooltip>
        )}
      </div>
    </TooltipProvider>
  )
} 
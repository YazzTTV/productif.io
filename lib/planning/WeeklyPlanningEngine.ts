/**
 * Weekly Planning Engine
 * 
 * Système de planification intelligente qui organise automatiquement
 * la semaine d'un étudiant dans Google Calendar basé sur :
 * - Les matières et leurs coefficients (importance)
 * - Les tâches liées aux matières
 * - Les événements existants du calendrier (cours, etc.)
 * - La logique cognitive (travailler les matières importantes au bon moment)
 */

import { prisma } from '@/lib/prisma'
import { googleCalendarService } from '@/lib/calendar/GoogleCalendarService'
import { startOfWeek, endOfWeek, addDays, isSameDay, parseISO } from 'date-fns'

// Types
export interface SubjectWithTasks {
  id: string
  name: string
  coefficient: number
  deadline: Date | null
  tasks: Array<{
    id: string
    title: string
    estimatedMinutes: number
    dueDate: Date | null
    completed: boolean
  }>
}

export interface CalendarEvent {
  id: string
  summary: string
  start: Date
  end: Date
  isClass?: boolean // Détecté comme un cours
  subjectName?: string // Nom de la matière si détecté
}

export interface FreeSlot {
  start: Date
  end: Date
  durationMinutes: number
}

export interface PlannedSession {
  subjectId: string
  subjectName: string
  tasks: string[] // IDs des tâches
  start: Date
  end: Date
  durationMinutes: number
  priority: number // Score de priorité
}

export interface WeeklyPlan {
  sessions: PlannedSession[]
  summary: {
    totalSessions: number
    totalMinutes: number
    subjectsCovered: string[]
    distribution: Record<string, number> // Minutes par matière
  }
}

export class WeeklyPlanningEngine {
  /**
   * Planifie la semaine complète pour un utilisateur
   */
  async planWeek(
    userId: string,
    weekStart?: Date
  ): Promise<WeeklyPlan> {
    // 1. Préparer les données
    const data = await this.prepareData(userId, weekStart)
    
    // 2. Analyser le calendrier existant
    const calendarContext = await this.analyzeCalendar(userId, data.weekStart, data.weekEnd)
    
    // 3. Calculer la distribution optimale
    const distribution = this.calculateDistribution(data.subjects, calendarContext)
    
    // 4. Générer les créneaux libres
    const freeSlots = this.findFreeSlots(calendarContext.events, data.weekStart, data.weekEnd)
    
    // 5. Assigner les sessions aux créneaux
    const sessions = this.assignSessionsToSlots(
      distribution,
      freeSlots,
      calendarContext,
      data.subjects
    )
    
    // 6. Générer le résumé
    const summary = this.generateSummary(sessions, data.subjects)
    
    return {
      sessions,
      summary,
    }
  }

  /**
   * Étape 1: Préparer toutes les données nécessaires
   */
  private async prepareData(userId: string, weekStart?: Date) {
    const now = new Date()
    console.log('📅 [WeeklyPlanning] prepareData - now:', now.toISOString(), 'Local:', now.toString())
    
    let start = weekStart || startOfWeek(now, { weekStartsOn: 1 }) // Lundi
    console.log('📅 [WeeklyPlanning] prepareData - Initial start:', start.toISOString(), 'Local:', start.toString())
    
    // Si on est déjà dans la semaine, toujours commencer à partir de maintenant
    // (même si c'est tard, il peut y avoir des créneaux disponibles aujourd'hui)
    if (!weekStart) {
      const today = new Date(now)
      today.setHours(0, 0, 0, 0)
      const weekStartDate = new Date(start)
      weekStartDate.setHours(0, 0, 0, 0)
      
      console.log('📅 [WeeklyPlanning] prepareData - today:', today.toISOString(), 'weekStartDate:', weekStartDate.toISOString())
      console.log('📅 [WeeklyPlanning] prepareData - now.getHours():', now.getHours())
      
      // Si on est dans la semaine actuelle, commencer à partir de maintenant
      if (today >= weekStartDate) {
        // Toujours commencer à partir de maintenant (arrondi à la demi-heure supérieure)
        start = new Date(now)
        start.setMinutes(Math.ceil(start.getMinutes() / 30) * 30, 0, 0) // Arrondir à la demi-heure supérieure
        
        // Si on est après 22h, commencer demain à 8h
        if (start.getHours() >= 22) {
          const tomorrow = new Date(now)
          tomorrow.setDate(tomorrow.getDate() + 1)
          tomorrow.setHours(8, 0, 0, 0)
          start = tomorrow
          console.log('📅 [WeeklyPlanning] prepareData - Après 22h, start = demain:', start.toISOString())
        } else {
          console.log('📅 [WeeklyPlanning] prepareData - Dans la semaine, start = maintenant:', start.toISOString())
        }
      }
    }
    
    const end = endOfWeek(start, { weekStartsOn: 1 }) // Dimanche
    console.log('📅 [WeeklyPlanning] prepareData - Final start:', start.toISOString(), 'end:', end.toISOString())

    // Récupérer les matières avec leurs tâches non complétées
    const subjects = await (prisma as any).subject.findMany({
      where: {
        userId,
      },
      include: {
        tasks: {
          where: {
            completed: false,
            // Seulement les tâches sans deadline ou deadline dans la semaine
            OR: [
              { dueDate: null },
              {
                dueDate: {
                  gte: start,
                  lte: end,
                },
              },
            ],
          },
          select: {
            id: true,
            title: true,
            estimatedMinutes: true,
            dueDate: true,
            completed: true,
          },
        },
      },
    })

    // Filtrer les matières qui ont des tâches
    const subjectsWithTasks = subjects
      .filter((s: any) => s.tasks.length > 0)
      .map((s: any) => ({
        id: s.id,
        name: s.name,
        coefficient: s.coefficient,
        deadline: s.deadline,
        tasks: s.tasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          estimatedMinutes: t.estimatedMinutes || 30, // Par défaut 30 min
          dueDate: t.dueDate,
          completed: t.completed,
        })),
      }))

    return {
      subjects: subjectsWithTasks,
      weekStart: start,
      weekEnd: end,
    }
  }

  /**
   * Étape 2: Analyser le calendrier Google Calendar
   * Détecte les cours et les événements existants
   */
  private async analyzeCalendar(
    userId: string,
    weekStart: Date,
    weekEnd: Date
  ): Promise<{
    events: CalendarEvent[]
    classesBySubject: Record<string, Date[]> // Dates des cours par matière
    busyPeriods: Array<{ start: Date; end: Date }>
  }> {
    // Récupérer les périodes occupées
    const busyPeriods = await googleCalendarService.getBusyTimes(
      userId,
      weekStart,
      weekEnd
    )

    // Récupérer tous les événements de la semaine
    const accessToken = await googleCalendarService.refreshTokenIfNeeded(userId)
    if (!accessToken) {
      return {
        events: [],
        classesBySubject: {},
        busyPeriods: busyPeriods.map((p) => ({ start: p.start, end: p.end })),
      }
    }

    // Récupérer les événements depuis Google Calendar
    const params = new URLSearchParams({
      timeMin: weekStart.toISOString(),
      timeMax: weekEnd.toISOString(),
      singleEvents: 'true',
      orderBy: 'startTime',
      maxResults: '250',
    })

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    )

    if (!response.ok) {
      console.error('Erreur récupération événements Google Calendar')
      return {
        events: [],
        classesBySubject: {},
        busyPeriods: busyPeriods.map((p) => ({ start: p.start, end: p.end })),
      }
    }

    const data = await response.json()
    const events: CalendarEvent[] = (data.items || []).map((event: any) => {
      const start = parseISO(event.start?.dateTime || event.start?.date)
      const end = parseISO(event.end?.dateTime || event.end?.date)

      // Détecter si c'est un cours (heuristique simple)
      const summary = event.summary || ''
      const isClass = this.detectIfClass(summary)
      const subjectName = isClass ? this.extractSubjectName(summary) : undefined

      return {
        id: event.id,
        summary,
        start,
        end,
        isClass,
        subjectName,
      }
    })

    // Grouper les cours par matière
    const classesBySubject: Record<string, Date[]> = {}
    events.forEach((event) => {
      if (event.isClass && event.subjectName) {
        if (!classesBySubject[event.subjectName]) {
          classesBySubject[event.subjectName] = []
        }
        classesBySubject[event.subjectName].push(event.start)
      }
    })

    return {
      events,
      classesBySubject,
      busyPeriods: busyPeriods.map((p) => ({ start: p.start, end: p.end })),
    }
  }

  /**
   * Détecte si un événement est un cours
   * Heuristique: contient des mots-clés typiques des cours
   */
  private detectIfClass(summary: string): boolean {
    const classKeywords = [
      'cours',
      'td',
      'tp',
      'amphi',
      'classe',
      'lecture',
      'seminar',
      'class',
      'lesson',
    ]
    const lower = summary.toLowerCase()
    return classKeywords.some((keyword) => lower.includes(keyword))
  }

  /**
   * Extrait le nom de la matière depuis le titre d'un cours
   */
  private extractSubjectName(summary: string): string | undefined {
    // Heuristique simple: prendre les premiers mots (souvent le nom de la matière)
    const words = summary.split(/\s+/)
    if (words.length >= 2) {
      // Prendre les 2-3 premiers mots
      return words.slice(0, 2).join(' ')
    }
    return undefined
  }

  /**
   * Étape 3: Calculer la distribution optimale du temps par matière
   */
  private calculateDistribution(
    subjects: SubjectWithTasks[],
    calendarContext: {
      classesBySubject: Record<string, Date[]>
    }
  ): Array<{
    subjectId: string
    subjectName: string
    coefficient: number
    totalMinutes: number
    tasks: Array<{ id: string; minutes: number }>
    preferredDays: Date[] // Jours où il y a un cours de cette matière
  }> {
    // Calculer le total des coefficients
    const totalCoefficient = subjects.reduce((sum, s) => sum + s.coefficient, 0)

    // Temps total disponible pour la semaine (en minutes)
    // Estimation: 4h/jour × 5 jours = 20h = 1200 minutes
    const totalAvailableMinutes = 1200

    const distribution = subjects.map((subject) => {
      // Calculer le temps alloué proportionnellement au coefficient
      const coefficientRatio = subject.coefficient / totalCoefficient
      const allocatedMinutes = Math.round(totalAvailableMinutes * coefficientRatio)

      // Calculer le temps nécessaire pour toutes les tâches
      const requiredMinutes = subject.tasks.reduce(
        (sum, task) => sum + task.estimatedMinutes,
        0
      )

      // Prendre le minimum entre alloué et requis
      const totalMinutes = Math.min(allocatedMinutes, requiredMinutes)

      // Trouver les jours préférés (jours avec cours de cette matière)
      const preferredDays: Date[] = []
      const subjectNameLower = subject.name.toLowerCase()
      Object.entries(calendarContext.classesBySubject).forEach(
        ([className, dates]) => {
          if (className.toLowerCase().includes(subjectNameLower) ||
              subjectNameLower.includes(className.toLowerCase())) {
            preferredDays.push(...dates)
          }
        }
      )

      return {
        subjectId: subject.id,
        subjectName: subject.name,
        coefficient: subject.coefficient,
        totalMinutes,
        tasks: subject.tasks.map((t) => ({
          id: t.id,
          minutes: t.estimatedMinutes,
        })),
        preferredDays,
      }
    })

    // Trier par coefficient décroissant (matières importantes en premier)
    return distribution.sort((a, b) => b.coefficient - a.coefficient)
  }

  /**
   * Étape 4: Trouver les créneaux libres dans la semaine
   */
  private findFreeSlots(
    busyPeriods: Array<{ start: Date; end: Date }>,
    weekStart: Date,
    weekEnd: Date
  ): FreeSlot[] {
    const slots: FreeSlot[] = []
    const dayStart = 8 // 8h
    const dayEnd = 22 // 22h
    const minSlotDuration = 30 // Minimum 30 minutes
    const now = new Date()
    
    console.log('📅 [WeeklyPlanning] findFreeSlots - now:', now.toISOString(), 'Local:', now.toString())
    console.log('📅 [WeeklyPlanning] findFreeSlots - weekStart:', weekStart.toISOString(), 'weekEnd:', weekEnd.toISOString())

    // Toujours commencer par aujourd'hui si on est dans la semaine
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const weekStartDate = new Date(weekStart)
    weekStartDate.setHours(0, 0, 0, 0)
    
    // Si on est dans la semaine, traiter aujourd'hui d'abord
    if (today >= weekStartDate && today <= weekEnd) {
      console.log(`📅 [WeeklyPlanning] findFreeSlots - Traitement aujourd'hui:`, today.toISOString())
      const todaySlots = this.findDayFreeSlots(
        today,
        dayStart,
        dayEnd,
        busyPeriods,
        minSlotDuration
      )
      console.log(`📅 [WeeklyPlanning] findFreeSlots - ${todaySlots.length} créneaux trouvés pour aujourd'hui`)
      slots.push(...todaySlots)
    }

    // Pour chaque jour de la semaine à partir de weekStart
    for (let day = 0; day < 7; day++) {
      const currentDay = addDays(weekStart, day)
      const currentDayStart = new Date(currentDay)
      currentDayStart.setHours(0, 0, 0, 0)
      const nowStart = new Date(now)
      nowStart.setHours(0, 0, 0, 0)
      
      // Ignorer les jours dans le passé (sauf si c'est aujourd'hui, déjà traité)
      if (currentDayStart < nowStart || isSameDay(currentDay, now)) {
        if (isSameDay(currentDay, now)) {
          console.log(`📅 [WeeklyPlanning] findFreeSlots - Ignoré jour ${day} (déjà traité aujourd'hui):`, currentDay.toISOString())
        } else {
          console.log(`📅 [WeeklyPlanning] findFreeSlots - Ignoré jour ${day} (passé):`, currentDay.toISOString())
        }
        continue
      }
      
      console.log(`📅 [WeeklyPlanning] findFreeSlots - Traitement jour ${day}:`, currentDay.toISOString())
      const daySlots = this.findDayFreeSlots(
        currentDay,
        dayStart,
        dayEnd,
        busyPeriods,
        minSlotDuration
      )
      console.log(`📅 [WeeklyPlanning] findFreeSlots - ${daySlots.length} créneaux trouvés pour jour ${day}`)
      slots.push(...daySlots)
    }

    // Trier par heure de début et filtrer les créneaux passés
    const filteredSlots = slots.filter(slot => {
      const isFuture = slot.start >= now
      if (!isFuture) {
        console.log('📅 [WeeklyPlanning] findFreeSlots - Créneau passé filtré:', slot.start.toISOString(), 'now:', now.toISOString())
      }
      return isFuture
    })
    
    console.log(`📅 [WeeklyPlanning] findFreeSlots - Total slots: ${slots.length}, Après filtre: ${filteredSlots.length}`)
    if (filteredSlots.length > 0) {
      console.log('📅 [WeeklyPlanning] findFreeSlots - Premier slot:', filteredSlots[0].start.toISOString())
      console.log('📅 [WeeklyPlanning] findFreeSlots - Dernier slot:', filteredSlots[filteredSlots.length - 1].start.toISOString())
    }
    
    return filteredSlots.sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  /**
   * Trouve les créneaux libres pour un jour donné
   */
  private findDayFreeSlots(
    day: Date,
    dayStart: number,
    dayEnd: number,
    busyPeriods: Array<{ start: Date; end: Date }>,
    minDuration: number
  ): FreeSlot[] {
    const slots: FreeSlot[] = []
    const currentTime = new Date()
    const dayDate = new Date(day)
    
    console.log(`📅 [WeeklyPlanning] findDayFreeSlots - day:`, day.toISOString(), 'currentTime:', currentTime.toISOString())
    console.log(`📅 [WeeklyPlanning] findDayFreeSlots - isSameDay:`, isSameDay(day, currentTime))
    
    // Si c'est aujourd'hui, commencer à partir de maintenant (arrondi à la demi-heure supérieure)
    if (isSameDay(day, currentTime)) {
      const roundedMinutes = Math.ceil(currentTime.getMinutes() / 30) * 30
      dayDate.setHours(currentTime.getHours(), roundedMinutes, 0, 0)
      console.log(`📅 [WeeklyPlanning] findDayFreeSlots - Aujourd'hui, dayDate après arrondi:`, dayDate.toISOString())
      // Si on est après 22h, pas de créneaux aujourd'hui
      if (dayDate.getHours() >= dayEnd) {
        console.log(`📅 [WeeklyPlanning] findDayFreeSlots - Après ${dayEnd}h, pas de créneaux`)
        return []
      }
    } else {
      dayDate.setHours(dayStart, 0, 0, 0)
      console.log(`📅 [WeeklyPlanning] findDayFreeSlots - Autre jour, dayDate:`, dayDate.toISOString())
    }

    const endOfDay = new Date(day)
    endOfDay.setHours(dayEnd, 0, 0, 0)

    // Filtrer les périodes occupées de ce jour
    const dayBusyPeriods = busyPeriods.filter((period) =>
      isSameDay(period.start, day)
    )

    // Trier les périodes occupées
    dayBusyPeriods.sort((a, b) => a.start.getTime() - b.start.getTime())

    let slotStartTime = new Date(dayDate)

    for (const busy of dayBusyPeriods) {
      // Ignorer les périodes occupées dans le passé
      if (busy.end < currentTime) {
        slotStartTime = new Date(busy.end)
        continue
      }
      
      // Si il y a un créneau libre avant cette période occupée
      if (slotStartTime < busy.start && slotStartTime >= currentTime) {
        const duration = (busy.start.getTime() - slotStartTime.getTime()) / (1000 * 60)
        if (duration >= minDuration) {
          slots.push({
            start: new Date(slotStartTime),
            end: new Date(busy.start),
            durationMinutes: Math.floor(duration),
          })
        }
      }
      // Mettre à jour le temps courant après la période occupée
      slotStartTime = new Date(Math.max(busy.end.getTime(), currentTime.getTime()))
    }

    // Vérifier s'il reste du temps après la dernière période occupée
    if (slotStartTime < endOfDay && slotStartTime >= currentTime) {
      const duration = (endOfDay.getTime() - slotStartTime.getTime()) / (1000 * 60)
      if (duration >= minDuration) {
        slots.push({
          start: new Date(slotStartTime),
          end: new Date(endOfDay),
          durationMinutes: Math.floor(duration),
        })
      }
    }

    // Filtrer les créneaux dans le passé
    const filteredSlots = slots.filter(slot => {
      const isFuture = slot.start >= currentTime
      if (!isFuture) {
        console.log('📅 [WeeklyPlanning] findDayFreeSlots - Créneau passé filtré:', slot.start.toISOString(), 'currentTime:', currentTime.toISOString())
      }
      return isFuture
    })
    
    console.log(`📅 [WeeklyPlanning] findDayFreeSlots - Slots trouvés: ${slots.length}, Après filtre: ${filteredSlots.length}`)
    return filteredSlots
  }

  /**
   * Étape 5: Assigner les sessions aux créneaux libres
   * C'est ici que la magie opère : priorisation intelligente
   */
  private assignSessionsToSlots(
    distribution: Array<{
      subjectId: string
      subjectName: string
      coefficient: number
      totalMinutes: number
      tasks: Array<{ id: string; minutes: number }>
      preferredDays: Date[]
    }>,
    freeSlots: FreeSlot[],
    calendarContext: {
      classesBySubject: Record<string, Date[]>
    },
    subjects: SubjectWithTasks[]
  ): PlannedSession[] {
    const sessions: PlannedSession[] = []
    const usedSlots = new Set<number>() // Indices des slots utilisés
    const subjectMinutesUsed = new Map<string, number>() // Minutes déjà allouées par matière

    // Initialiser les minutes utilisées
    distribution.forEach((d) => {
      subjectMinutesUsed.set(d.subjectId, 0)
    })

    // Pour chaque matière (triée par coefficient décroissant)
    for (const subjectDist of distribution) {
      const remainingMinutes =
        subjectDist.totalMinutes - (subjectMinutesUsed.get(subjectDist.subjectId) || 0)

      if (remainingMinutes <= 0) continue

      // Trouver les tâches de cette matière
      const subject = subjects.find((s) => s.id === subjectDist.subjectId)
      if (!subject) continue

      // Grouper les tâches en sessions (max 2h par session)
      const maxSessionDuration = 120 // 2 heures max
      const taskGroups = this.groupTasksIntoSessions(
        subject.tasks,
        maxSessionDuration
      )

      // Pour chaque groupe de tâches
      for (const taskGroup of taskGroups) {
        const sessionDuration = taskGroup.reduce(
          (sum, t) => sum + t.estimatedMinutes,
          0
        )

        if (sessionDuration > remainingMinutes) continue

        // Trouver le meilleur slot
        const bestSlot = this.findBestSlot(
          freeSlots,
          usedSlots,
          subjectDist,
          sessionDuration,
          calendarContext
        )

        if (bestSlot) {
          const sessionStart = new Date(bestSlot.start)
          const sessionEnd = new Date(sessionStart.getTime() + sessionDuration * 60 * 1000)
          const now = new Date()
          
          console.log(`📅 [WeeklyPlanning] assignSessionsToSlots - Session proposée:`, {
            subject: subjectDist.subjectName,
            start: sessionStart.toISOString(),
            end: sessionEnd.toISOString(),
            now: now.toISOString(),
            isFuture: sessionStart >= now
          })
          
          // Double vérification que la session est dans le futur
          if (sessionStart >= now) {
            const session: PlannedSession = {
              subjectId: subjectDist.subjectId,
              subjectName: subjectDist.subjectName,
              tasks: taskGroup.map((t) => t.id),
              start: sessionStart,
              end: sessionEnd,
              durationMinutes: sessionDuration,
              priority: subjectDist.coefficient,
            }

            sessions.push(session)
            usedSlots.add(bestSlot.index)
            subjectMinutesUsed.set(
              subjectDist.subjectId,
              (subjectMinutesUsed.get(subjectDist.subjectId) || 0) + sessionDuration
            )
            console.log(`📅 [WeeklyPlanning] assignSessionsToSlots - Session ajoutée`)
          } else {
            console.log(`📅 [WeeklyPlanning] assignSessionsToSlots - Session rejetée (dans le passé)`)
          }
        }
      }
    }

    // Filtrer les sessions dans le passé (sécurité supplémentaire)
    const now = new Date()
    const futureSessions = sessions.filter(session => session.start >= now)

    return futureSessions.sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  /**
   * Groupe les tâches en sessions de taille raisonnable
   */
  private groupTasksIntoSessions(
    tasks: Array<{ id: string; estimatedMinutes: number }>,
    maxDuration: number
  ): Array<Array<{ id: string; estimatedMinutes: number }>> {
    const groups: Array<Array<{ id: string; estimatedMinutes: number }>> = []
    let currentGroup: Array<{ id: string; estimatedMinutes: number }> = []
    let currentDuration = 0

    for (const task of tasks) {
      if (currentDuration + task.estimatedMinutes <= maxDuration) {
        currentGroup.push(task)
        currentDuration += task.estimatedMinutes
      } else {
        if (currentGroup.length > 0) {
          groups.push(currentGroup)
        }
        currentGroup = [task]
        currentDuration = task.estimatedMinutes
      }
    }

    if (currentGroup.length > 0) {
      groups.push(currentGroup)
    }

    return groups
  }

  /**
   * Trouve le meilleur slot pour une session donnée
   * Priorise les jours avec cours de la matière
   */
  private findBestSlot(
    freeSlots: FreeSlot[],
    usedSlots: Set<number>,
    subjectDist: {
      preferredDays: Date[]
      coefficient: number
    },
    duration: number,
    calendarContext: {
      classesBySubject: Record<string, Date[]>
    }
  ): FreeSlot & { index: number } | null {
    const now = new Date()
    // Filtrer les slots disponibles, de taille suffisante, et dans le futur
    const availableSlots = freeSlots
      .map((slot, index) => ({ ...slot, index }))
      .filter(
        (slot) =>
          !usedSlots.has(slot.index) && 
          slot.durationMinutes >= duration &&
          slot.start >= now // S'assurer que le slot est dans le futur
      )

    if (availableSlots.length === 0) return null

    // Scorer chaque slot
    const scoredSlots = availableSlots.map((slot) => {
      let score = 0

      // Bonus si c'est un jour préféré (jour avec cours)
      const isPreferredDay = subjectDist.preferredDays.some((prefDay) =>
        isSameDay(prefDay, slot.start)
      )
      if (isPreferredDay) {
        score += 100 // Gros bonus pour étudier le jour du cours
      }

      // PRIORISER LES CRÉNEAUX LES PLUS PROCHES (bonus pour être tôt dans la semaine)
      const daysFromNow = Math.floor((slot.start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      score += Math.max(0, 50 - (daysFromNow * 10)) // Bonus décroissant : +50 pour aujourd'hui, +40 pour demain, etc.

      // Bonus pour les matières importantes (coefficient élevé) dans les créneaux matinaux
      const hour = slot.start.getHours()
      if (subjectDist.coefficient >= 3 && hour >= 8 && hour <= 12) {
        score += 50 // Matin = meilleure énergie
      }

      // Bonus pour éviter les créneaux trop tard (après 20h)
      if (hour < 20) {
        score += 20
      }

      // Pénalité si le slot est trop grand (préférer des slots adaptés)
      const sizeDiff = slot.durationMinutes - duration
      if (sizeDiff > 60) {
        score -= 10 // Trop de temps perdu
      }

      return { slot, score }
    })

    // Trier par score décroissant et retourner le meilleur
    scoredSlots.sort((a, b) => {
      // Si les scores sont égaux, préférer le créneau le plus proche
      if (b.score === a.score) {
        return a.slot.start.getTime() - b.slot.start.getTime()
      }
      return b.score - a.score
    })
    
    const bestSlot = scoredSlots[0]?.slot || null
    if (bestSlot) {
      console.log('📅 [WeeklyPlanning] findBestSlot - Meilleur slot choisi:', {
        start: bestSlot.start.toISOString(),
        score: scoredSlots[0].score,
        top3: scoredSlots.slice(0, 3).map(s => ({
          start: s.slot.start.toISOString(),
          score: s.score
        }))
      })
    }
    
    return bestSlot
  }

  /**
   * Génère un résumé de la planification
   */
  private generateSummary(
    sessions: PlannedSession[],
    subjects: SubjectWithTasks[]
  ) {
    const distribution: Record<string, number> = {}
    const subjectsCovered = new Set<string>()

    sessions.forEach((session) => {
      if (!distribution[session.subjectName]) {
        distribution[session.subjectName] = 0
      }
      distribution[session.subjectName] += session.durationMinutes
      subjectsCovered.add(session.subjectName)
    })

    const totalMinutes = sessions.reduce(
      (sum, s) => sum + s.durationMinutes,
      0
    )

    return {
      totalSessions: sessions.length,
      totalMinutes,
      subjectsCovered: Array.from(subjectsCovered),
      distribution,
    }
  }
}

// Export singleton
export const weeklyPlanningEngine = new WeeklyPlanningEngine()


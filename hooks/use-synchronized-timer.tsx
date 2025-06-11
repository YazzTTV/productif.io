"use client"

import { useState, useEffect, useRef, useCallback } from "react"

interface SyncTimerOptions {
  autoSync?: boolean
  syncInterval?: number
  maxAge?: number
  storageKey?: string
}

interface TimerState {
  isRunning: boolean
  startTime: string | null
  elapsedTime: number
  lastSync: number
}

export function useSynchronizedTimer(options: SyncTimerOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 60000, // 1 minute
    maxAge = 24 * 60 * 60 * 1000, // 24 heures
    storageKey = 'synchronized_timer'
  } = options

  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [lastSync, setLastSync] = useState<number>(0)
  const [isSyncing, setIsSyncing] = useState(false)
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Calculer le temps écoulé basé sur les timestamps
  const calculateElapsedTime = useCallback((startTime: Date): number => {
    const now = new Date()
    return Math.floor((now.getTime() - startTime.getTime()) / 1000)
  }, [])

  // Sauvegarder l'état du timer
  const saveTimerState = useCallback(() => {
    if (typeof window === 'undefined') return
    
    const state: TimerState = {
      isRunning,
      startTime: startTimeRef.current?.toISOString() || null,
      elapsedTime,
      lastSync: Date.now()
    }
    
    localStorage.setItem(storageKey, JSON.stringify(state))
  }, [isRunning, elapsedTime, storageKey])

  // Charger l'état du timer
  const loadTimerState = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return false
      
      const state: TimerState = JSON.parse(saved)
      
      // Vérifier si la session n'est pas trop ancienne
      if (Date.now() - state.lastSync > maxAge) {
        clearTimerState()
        return false
      }
      
      if (state.isRunning && state.startTime) {
        const startTime = new Date(state.startTime)
        const currentElapsed = calculateElapsedTime(startTime)
        
        setIsRunning(true)
        setElapsedTime(currentElapsed)
        setLastSync(state.lastSync)
        startTimeRef.current = startTime
        
        return true
      }
    } catch (error) {
      console.error('Erreur lors du chargement de l\'état du timer:', error)
      clearTimerState()
    }
    
    return false
  }, [storageKey, maxAge, calculateElapsedTime])

  // Nettoyer l'état du timer
  const clearTimerState = useCallback(() => {
    if (typeof window === 'undefined') return
    localStorage.removeItem(storageKey)
  }, [storageKey])

  // Synchroniser avec le serveur
  const syncWithServer = useCallback(async () => {
    if (!isRunning || !startTimeRef.current) return
    
    setIsSyncing(true)
    try {
      const response = await fetch('/api/timer/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startTime: startTimeRef.current.toISOString(),
          currentTime: new Date().toISOString()
        })
      })
      
      if (response.ok) {
        const data = await response.json()
        setLastSync(Date.now())
        
        // Ajuster si nécessaire basé sur la réponse serveur
        if (data.serverElapsed && Math.abs(data.serverElapsed - elapsedTime) > 2) {
          setElapsedTime(data.serverElapsed)
        }
      }
    } catch (error) {
      console.error('Erreur de synchronisation:', error)
    } finally {
      setIsSyncing(false)
    }
  }, [isRunning, elapsedTime])

  // Démarrer le timer
  const startTimer = useCallback(() => {
    if (isRunning) return

    setIsRunning(true)
    const now = new Date()
    startTimeRef.current = now

    // Timer principal avec correction de dérive
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const newElapsed = calculateElapsedTime(startTimeRef.current)
        setElapsedTime(newElapsed)
        
        // Sauvegarder périodiquement
        if (newElapsed % 10 === 0) {
          saveTimerState()
        }
      }
    }, 1000)

    // Synchronisation périodique si activée
    if (autoSync) {
      syncIntervalRef.current = setInterval(() => {
        syncWithServer()
      }, syncInterval)
    }

    saveTimerState()
  }, [isRunning, calculateElapsedTime, saveTimerState, autoSync, syncInterval, syncWithServer])

  // Arrêter le timer
  const stopTimer = useCallback(() => {
    setIsRunning(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
    
    setElapsedTime(0)
    startTimeRef.current = null
    clearTimerState()
  }, [clearTimerState])

  // Mettre en pause le timer
  const pauseTimer = useCallback(() => {
    if (!isRunning) return

    setIsRunning(false)
    
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current)
      syncIntervalRef.current = null
    }
    
    saveTimerState()
  }, [isRunning, saveTimerState])

  // Reprendre le timer
  const resumeTimer = useCallback(() => {
    if (isRunning || !startTimeRef.current) return

    setIsRunning(true)

    // Reprendre le timer principal
    timerRef.current = setInterval(() => {
      if (startTimeRef.current) {
        const newElapsed = calculateElapsedTime(startTimeRef.current)
        setElapsedTime(newElapsed)
        
        if (newElapsed % 10 === 0) {
          saveTimerState()
        }
      }
    }, 1000)

    // Reprendre la synchronisation si activée
    if (autoSync) {
      syncIntervalRef.current = setInterval(() => {
        syncWithServer()
      }, syncInterval)
    }

    saveTimerState()
  }, [isRunning, calculateElapsedTime, saveTimerState, autoSync, syncInterval, syncWithServer])

  // Formater le temps
  const formatTime = useCallback((timeInSeconds: number, includeHours: boolean = true) => {
    const hours = Math.floor(timeInSeconds / 3600)
    const minutes = Math.floor((timeInSeconds % 3600) / 60)
    const seconds = timeInSeconds % 60

    if (includeHours) {
      return [
        hours.toString().padStart(2, "0"),
        minutes.toString().padStart(2, "0"),
        seconds.toString().padStart(2, "0"),
      ].join(":")
    } else {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`
    }
  }, [])

  // Charger l'état au démarrage
  useEffect(() => {
    const hasActiveSession = loadTimerState()
    
    if (hasActiveSession && isRunning) {
      // Reprendre le timer
      timerRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const newElapsed = calculateElapsedTime(startTimeRef.current)
          setElapsedTime(newElapsed)
          
          if (newElapsed % 10 === 0) {
            saveTimerState()
          }
        }
      }, 1000)
      
      // Reprendre la synchronisation si activée
      if (autoSync) {
        syncIntervalRef.current = setInterval(() => {
          syncWithServer()
        }, syncInterval)
      }
    }
  }, [loadTimerState, isRunning, calculateElapsedTime, saveTimerState, autoSync, syncInterval, syncWithServer])

  // Nettoyer les intervalles lors du démontage
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
      if (isRunning) {
        saveTimerState()
      }
    }
  }, [isRunning, saveTimerState])

  return {
    // État
    isRunning,
    elapsedTime,
    lastSync,
    isSyncing,
    startTime: startTimeRef.current,
    
    // Actions
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    syncWithServer,
    
    // Utilitaires
    formatTime,
    calculateElapsedTime,
    
    // Données
    formattedTime: formatTime(elapsedTime),
    formattedTimeShort: formatTime(elapsedTime, false)
  }
} 
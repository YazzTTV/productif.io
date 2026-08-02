import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Modal, Dimensions, Platform, InteractionManager } from 'react-native';
import { ScrollView as GestureScrollView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { taskAssociationService, googleCalendarService, dailyPlanningService, authService, PlanLimits, getAuthToken } from '@/lib/api';
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore, getHours, getMinutes } from 'date-fns';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getTutorialCompleted,
  getTutorialStage,
  setTutorialCompleted,
  setTutorialStage,
} from '@/tutorial/tutorialStorage';
import { Coachmark } from '@/tutorial/Coachmark';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';

type PlanPhase = 'entry' | 'recording' | 'transcription' | 'processing' | 'association' | 'overview';

interface TaskWithSubject {
  title: string;
  description?: string;
  priority: number;
  energy: number;
  estimatedDuration: number;
  subjectId: string | null;
  subjectName: string | null;
  confidence: number;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
}

export function PlanMyDay() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { triggerEvent } = useSuperwall();
  const isMountedRef = useRef(true);
  const typeButtonRef = useRef<TouchableOpacity>(null);
  const confirmButtonRef = useRef<TouchableOpacity>(null);
  const [phase, setPhase] = useState<PlanPhase>('entry');
  const [transcription, setTranscription] = useState('');
  const [tutorialStage, setTutorialStageState] = useState<string | null>(null);
  const [tutorialCompleted, setTutorialCompletedState] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [tasks, setTasks] = useState<TaskWithSubject[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number | null>(null);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  
  // Google Calendar & Overview
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [eventStartTimes, setEventStartTimes] = useState<Date[]>([]); // Heure de début de chaque événement
  const [isCreatingEvents, setIsCreatingEvents] = useState(false);
  const [targetDate, setTargetDate] = useState(new Date()); // Date cible pour le plan
  const [existingCalendarEvents, setExistingCalendarEvents] = useState<{
    id: string;
    title: string;
    start: string;
    end: string;
    startDate: string | null;
    endDate: string | null;
  }[]>([]); // Événements existants du calendrier pour la date cible
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false); // État de chargement pour confirmAssociations
  const [planLimits, setPlanLimits] = useState<PlanLimits | null>(null);
  const [planPreviewLimited, setPlanPreviewLimited] = useState(false);

  const refreshTutorialState = async () => {
    const [completed, stage] = await Promise.all([
      getTutorialCompleted(),
      getTutorialStage(),
    ]);
    console.log('[Tutorial] PlanMyDay load state', { completed, stage });
    setTutorialCompletedState(completed);
    setTutorialStageState(stage);
  };

  useEffect(() => {
    refreshTutorialState();
  }, []);

  // Coachmarks are handled locally in this screen.

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Nettoyer l'enregistrement si le composant est démonté
      if (recording) {
        recording.stopAndUnloadAsync().catch((err) => {
          // Ignorer si déjà déchargé (cas normal après stopRecording)
          if (!err?.message?.includes('already been unloaded')) {
            console.error(err);
          }
        });
      }
    };
  }, [recording]);

  useEffect(() => {
    let mounted = true;
    // Attendre que l'UI soit stable avant de charger les données
    InteractionManager.runAfterInteractions(() => {
      setTimeout(async () => {
        if (!mounted || !isMountedRef.current) return;
        try {
          const user = await authService.checkAuth();
          if (!mounted || !isMountedRef.current) return;
          setPlanLimits(user?.planLimits || null);
        } catch {
          if (!mounted || !isMountedRef.current) return;
          setPlanLimits(null);
        }
      }, 300);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Vérifier la connexion Google Calendar quand on arrive sur l'overview
  useEffect(() => {
    if (phase === 'overview') {
      checkCalendarConnection();
    }
  }, [phase]);

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission refusée', 'L\'accès au microphone est nécessaire pour enregistrer.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(newRecording);
      setIsRecording(true);
      setPhase('recording');
    } catch (error: any) {
      console.error('Erreur démarrage enregistrement:', error);
      Alert.alert('Erreur', 'Impossible de démarrer l\'enregistrement.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        await transcribeAudio(uri);
      }
    } catch (error: any) {
      console.error('Erreur arrêt enregistrement:', error);
      Alert.alert('Erreur', 'Impossible d\'arrêter l\'enregistrement.');
    }
  };

  const transcribeAudio = async (audioUri: string) => {
    try {
      setIsTranscribing(true);
      setPhase('transcription');

      // Lire le fichier audio
      const fileInfo = await FileSystem.getInfoAsync(audioUri);
      if (!fileInfo.exists) {
        throw new Error('Fichier audio introuvable');
      }

      // Récupérer le token d'authentification via l'utilitaire centralisé
      const token = await getAuthToken();
      if (!token) {
        throw new Error('Utilisateur non authentifié. Veuillez vous reconnecter.');
      }

      // Corriger l'URI selon la plateforme (comme dans DailyJournal)
      const uri = Platform.OS === 'ios' ? audioUri.replace('file://', '') : audioUri;

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('audio', {
        uri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      console.log('🎤 [PlanMyDay] Envoi audio transcription', { uri, hasToken: !!token });

      // Appeler l'API de transcription
      const response = await fetch('https://www.productif.io/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Ne pas définir Content-Type, FormData le fera
        },
        body: formData,
      });

      console.log('📡 [PlanMyDay] Réponse transcription', { status: response.status, ok: response.ok });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData: any;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: errorText || `Erreur ${response.status}` };
        }
        console.error('❌ [PlanMyDay] Erreur API transcription:', errorData);
        throw new Error(errorData.error || `Erreur ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ [PlanMyDay] Transcription réussie', { success: data.success, hasTranscription: !!data.transcription });

      if (data.success && data.transcription) {
        setTranscription(data.transcription);
      } else {
        throw new Error(data.error || 'Transcription échouée');
      }
    } catch (error: any) {
      console.error('Erreur transcription:', error);
      Alert.alert('Erreur', error.message || 'Impossible de transcrire l\'audio.');
      setPhase('entry');
    } finally {
      setIsTranscribing(false);
    }
  };

  const processTranscription = async () => {
    if (!transcription.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir ou enregistrer votre transcription.');
      return;
    }

    try {
      setIsProcessing(true);
      setPhase('processing');
      setProcessingStep(0);

      // Animer les étapes pendant le traitement (simulation de progression)
      const stepInterval = setInterval(() => {
        setProcessingStep((prev) => {
          if (prev < 2) return prev + 1;
          return prev; // Rester à 2 (dernière étape) jusqu'à la fin
        });
      }, 800); // Avancer d'une étape toutes les 800ms

      try {
        // Appeler l'API pour associer les tâches aux matières
        const result = await taskAssociationService.associateTasks(transcription);

        clearInterval(stepInterval); // Arrêter l'animation
        setProcessingStep(3); // Marquer toutes les étapes comme complétées brièvement

        if (result.success && result.tasks && result.tasks.length > 0) {
          setPlanPreviewLimited(false);
          let extractedTasks = result.tasks;
          let limited = false;
          const limit = planLimits?.planMyDayMode === 'preview' ? planLimits?.maxPlanMyDayEvents : null;
          if (limit !== null && limit !== undefined && extractedTasks.length > limit) {
            extractedTasks = extractedTasks.slice(0, limit);
            limited = true;
          }
          setPlanPreviewLimited(limited);
          setTasks(extractedTasks);
          setSubjects(result.subjects);
          // Déterminer la date: respecte ce que l'utilisateur a dit ("demain", "lundi", etc.)
          // - Si l'IA a extrait une targetDate valide et non passée: l'utiliser
          // - Sinon (pas de date, date invalide ou passée): utiliser aujourd'hui
          let dateToUse = new Date(); // Par défaut: aujourd'hui
          if (result.targetDate && typeof result.targetDate === 'string') {
            const parsedDate = new Date(result.targetDate);
            const todayStart = startOfDay(new Date());
            // Utiliser la date de l'IA seulement si elle est valide et >= aujourd'hui
            if (!isNaN(parsedDate.getTime()) && !isBefore(parsedDate, todayStart)) {
              dateToUse = parsedDate;
            }
          }
          setTargetDate(dateToUse);
          // Petit délai pour voir la dernière étape complétée avant la transition
          setTimeout(() => setPhase('association'), 300);
        } else {
          Alert.alert('Aucune tâche', 'Aucune tâche n\'a pu être extraite de votre transcription.');
          setPhase('transcription');
        }
      } catch (apiError) {
        clearInterval(stepInterval);
        throw apiError;
      }
    } catch (error: any) {
      console.error('Erreur traitement:', error);
      Alert.alert('Erreur', error.message || 'Impossible de traiter la transcription.');
      setPhase('transcription');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction de tri des tâches par priorité
  // Logique : tâches importantes (académiques) d'abord, sport/perso en dernier
  const sortTasksByPriority = (tasksToSort: TaskWithSubject[]): TaskWithSubject[] => {
    return [...tasksToSort].sort((a, b) => {
      // 1. D'abord par priorité décroissante (5 > 4 > 3 > 2 > 1)
      if (b.priority !== a.priority) {
        return b.priority - a.priority;
      }
      
      // 2. En cas d'égalité de priorité, les tâches académiques (avec matière) passent avant les perso/sport
      const aHasSubject = a.subjectId ? 1 : 0;
      const bHasSubject = b.subjectId ? 1 : 0;
      if (bHasSubject !== aHasSubject) {
        return bHasSubject - aHasSubject;
      }
      
      // 3. Par concentration mentale (energy) décroissante — les tâches exigeantes d'abord (quand on est frais)
      if (b.energy !== a.energy) {
        return b.energy - a.energy;
      }
      
      // 4. En cas d'égalité, par coefficient de la matière (plus élevé = plus prioritaire)
      const getCoefficient = (task: TaskWithSubject): number => {
        if (!task.subjectId) return 0;
        const subject = subjects.find(s => s.id === task.subjectId);
        return subject?.coefficient || 0;
      };
      
      const coeffA = getCoefficient(a);
      const coeffB = getCoefficient(b);
      
      return coeffB - coeffA;
    });
  };

  const updateTaskSubject = (taskIndex: number, subjectId: string | null) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const subject = subjects.find((s) => s.id === subjectId);

    task.subjectId = subjectId;
    task.subjectName = subject?.name || null;
    task.confidence = subjectId ? 1.0 : 0.0;

    // Trier les tâches après modification (le coefficient de la matière affecte l'ordre)
    setTasks(sortTasksByPriority(updatedTasks));
    setShowSubjectPicker(false);
    setSelectedTaskIndex(null);
  };

  const confirmAssociations = async () => {
    try {
      setIsLoadingCalendar(true);
      console.log('🔄 [PlanMyDay] confirmAssociations - Début');
      
      // Calculer les créneaux en tenant compte des événements déjà présents dans Google Calendar
      const dateStr = format(targetDate, 'yyyy-MM-dd');
      console.log('📅 [PlanMyDay] Date cible:', dateStr);
      
      let existingBusyPeriods: { start: Date; end: Date }[] = [];

      try {
        // Récupérer les événements existants du calendrier pour cette date (si connecté)
        console.log('📥 [PlanMyDay] Récupération des événements du calendrier...');
        const calendarData = await dailyPlanningService.getCalendarEvents(dateStr);
        console.log('✅ [PlanMyDay] Événements reçus:', calendarData.events?.length || 0);
        
        if (calendarData.connected && calendarData.events?.length > 0) {
          // Stocker les événements pour l'affichage
          setExistingCalendarEvents(calendarData.events);
          
          existingBusyPeriods = calendarData.events
            .filter((evt: any) => evt.startDate && evt.endDate)
            .map((evt: any) => ({
              start: new Date(evt.startDate),
              end: new Date(evt.endDate),
            }))
            .sort((a: any, b: any) => a.start.getTime() - b.start.getTime());
        } else {
          setExistingCalendarEvents([]);
        }
      } catch (e: any) {
        console.error('❌ [PlanMyDay] Erreur récupération calendrier:', e);
        // Ignorer les erreurs - on utilisera 9h par défaut
        setExistingCalendarEvents([]);
      }

      // Trier les tâches : priorité > coefficient matière > énergie
      // La priorité est le critère principal car l'utilisateur peut la modifier manuellement
      const sortedTasks = sortTasksByPriority(tasks);

      console.log('📋 [PlanMyDay] Tâches triées par coefficient puis priorité:', sortedTasks.map(t => {
        const subject = subjects.find(s => s.id === t.subjectId);
        return {
          title: t.title,
          subject: t.subjectName || 'Aucune',
          coefficient: subject?.coefficient || 0,
          priority: t.priority,
          energy: t.energy
        };
      }));

      // Calculer les heures de début en évitant les créneaux occupés
      const dayStart = startOfDay(targetDate);
      const now = new Date();
      const isToday = format(targetDate, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd');
      
      // Si c'est aujourd'hui et qu'il est après 9h, commencer à l'heure actuelle (arrondie à la prochaine demi-heure)
      let defaultStart: Date;
      if (isToday) {
        const currentMinutes = now.getMinutes();
        const roundedMinutes = currentMinutes < 30 ? 30 : 0;
        const hoursToAdd = currentMinutes >= 30 ? 1 : 0;
        const startHour = Math.max(9, now.getHours() + hoursToAdd);
        defaultStart = setMinutes(setHours(dayStart, startHour), roundedMinutes);
        console.log('📍 [PlanMyDay] Aujourd\'hui - début à', format(defaultStart, 'HH:mm'));
      } else {
        defaultStart = setMinutes(setHours(dayStart, 9), 0); // 9h par défaut pour les autres jours
      }
      let currentTime = new Date(defaultStart);

      console.log('📋 [PlanMyDay] Calcul des créneaux pour', sortedTasks.length, 'tâches');

      // Créer un mapping pour stocker les heures par index original
      const timesByOriginalIndex = new Map<number, Date>();

      for (const task of sortedTasks) {
        const taskEnd = addMinutes(currentTime, task.estimatedDuration);

        // Vérifier si le créneau chevauche un événement existant
        // Chevauchement si: start < busy.end && end > busy.start
        let overlappingEvent = existingBusyPeriods.find(
          (period) => {
            const taskStartTime = currentTime.getTime();
            const taskEndTime = taskEnd.getTime();
            const periodStartTime = period.start.getTime();
            const periodEndTime = period.end.getTime();
            return taskStartTime < periodEndTime && taskEndTime > periodStartTime;
          }
        );

        // Si chevauchement, déplacer après la fin de l'événement
        while (overlappingEvent) {
          currentTime = new Date(overlappingEvent.end);
          const newTaskEnd = addMinutes(currentTime, task.estimatedDuration);
          overlappingEvent = existingBusyPeriods.find(
            (period) => {
              const taskStartTime = currentTime.getTime();
              const taskEndTime = newTaskEnd.getTime();
              const periodStartTime = period.start.getTime();
              const periodEndTime = period.end.getTime();
              return taskStartTime < periodEndTime && taskEndTime > periodStartTime;
            }
          );
        }

        // Trouver l'index original de cette tâche
        const originalIndex = tasks.findIndex(t => 
          t.title === task.title && 
          t.priority === task.priority && 
          t.energy === task.energy &&
          t.estimatedDuration === task.estimatedDuration
        );
        
        if (originalIndex !== -1) {
          timesByOriginalIndex.set(originalIndex, new Date(currentTime));
        }
        
        currentTime = addMinutes(currentTime, task.estimatedDuration);
      }

      // Créer le tableau times dans l'ordre original des tâches
      const times = tasks.map((_, index) => {
        return timesByOriginalIndex.get(index) || new Date(defaultStart);
      });

      console.log('✅ [PlanMyDay] Créneaux calculés:', times.length);
      console.log('📊 [PlanMyDay] Ordre de priorisation appliqué');
      setEventStartTimes(times);
      
      // Mettre à jour l'ordre des tâches pour que l'affichage corresponde à la priorisation
      setTasks(sortedTasks);
      setPhase('overview');
      console.log('✅ [PlanMyDay] Phase changée vers overview');

    } catch (error: any) {
      console.error('❌ [PlanMyDay] Erreur dans confirmAssociations:', error);
      Alert.alert(
        'Erreur',
        'Impossible de passer à l\'étape suivante. Veuillez réessayer.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoadingCalendar(false);
    }
  };

  // Vérifier la connexion Google Calendar
  const checkCalendarConnection = async () => {
    try {
      const status = await googleCalendarService.getStatus();
      setIsCalendarConnected(status.connected && !status.isExpired);
    } catch {
      setIsCalendarConnected(false);
    }
  };

  // Modifier la durée d'une tâche (phase association)
  const updateTaskDuration = (taskIndex: number, delta: number) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const newDuration = Math.max(15, Math.min(480, task.estimatedDuration + delta)); // 15min - 8h
    task.estimatedDuration = newDuration;
    setTasks(updatedTasks);
  };

  // Modifier la priorité d'une tâche (phase association) - avec tri automatique
  const updateTaskPriority = (taskIndex: number, delta: number) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const newPriority = Math.max(1, Math.min(5, task.priority + delta)); // 1-5
    task.priority = newPriority;
    // Trier les tâches après modification pour que la plus prioritaire soit en haut
    setTasks(sortTasksByPriority(updatedTasks));
  };

  // Modifier l'énergie d'une tâche (phase association) - avec tri automatique
  const updateTaskEnergy = (taskIndex: number, delta: number) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const newEnergy = Math.max(1, Math.min(5, task.energy + delta)); // 1-5
    task.energy = newEnergy;
    // Trier les tâches après modification pour que la plus prioritaire soit en haut
    setTasks(sortTasksByPriority(updatedTasks));
  };

  // Modifier l'heure de début d'un événement (phase overview)
  // Quand une tâche est glissée à une nouvelle heure :
  // 1. La tâche glissée garde son heure (newTime)
  // 2. On trie par heure et on supprime les chevauchements en décalant les autres
  // 3. On évite les événements existants du calendrier
  const handleTimelineTimeChange = (index: number, newTime: Date) => {
    const dayStart = startOfDay(targetDate);
    const minStart = setHours(dayStart, 6);

    // Préparer les périodes occupées (événements existants)
    const existingBusyPeriods = existingCalendarEvents
      .filter((evt) => evt.startDate && evt.endDate)
      .map((evt) => ({
        start: new Date(evt.startDate!),
        end: new Date(evt.endDate!),
      }))
      .sort((a, b) => a.start.getTime() - b.start.getTime());

    // Heure de chaque tâche (la glissée garde newTime)
    const times = tasks.map((t, i) => (i === index ? newTime : eventStartTimes[i] || new Date()));

    // Trier par heure de début (la tâche glissée prend sa nouvelle position)
    const indexed = tasks.map((t, i) => ({ task: t, time: times[i], index: i }));
    indexed.sort((a, b) => a.time.getTime() - b.time.getTime());

    // Supprimer les chevauchements : chaque tâche garde son heure sauf si elle chevauche la précédente
    // ou un événement existant -> on la décale
    const newTimes: Date[] = new Array(tasks.length);
    let lastEnd = 0;

    for (const { task, time, index } of indexed) {
      let start = new Date(time);
      if (start < minStart) start = new Date(minStart);

      const duration = task.estimatedDuration;
      let end = addMinutes(start, duration);

      // Ne pas commencer avant la fin de la tâche précédente
      const prevEndDate = new Date(lastEnd);
      if (start < prevEndDate) {
        start = new Date(prevEndDate);
        end = addMinutes(start, duration);
      }

      // Éviter les événements existants du calendrier
      let overlapping = existingBusyPeriods.find(
        (p) => start.getTime() < p.end.getTime() && end.getTime() > p.start.getTime()
      );
      while (overlapping) {
        start = new Date(overlapping.end);
        end = addMinutes(start, duration);
        overlapping = existingBusyPeriods.find(
          (p) => start.getTime() < p.end.getTime() && end.getTime() > p.start.getTime()
        );
      }

      newTimes[index] = start;
      lastEnd = end.getTime();
    }

    // Réordonner les tâches et les heures selon le nouvel ordre
    const reorderedTasks = indexed.map((x) => x.task);
    const reorderedTimes = indexed.map((x) => newTimes[x.index]);

    setTasks(reorderedTasks);
    setEventStartTimes(reorderedTimes);
  };

  // Créer les événements dans Google Calendar
  const handleCreateCalendarEvents = async () => {
    if (!isCalendarConnected) {
      Alert.alert(
        'Google Calendar non connecté',
        'Connectez votre Google Calendar dans les paramètres pour ajouter ces événements.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsCreatingEvents(true);
      // Inclure toutes les infos des tâches pour créer les tâches dans AI Tasks + événements Calendar
      // IMPORTANT: Envoyer la date avec les composants année/mois/jour/heure/minute
      // pour éviter les problèmes de fuseau horaire. Le backend interprétera ces composants
      // comme étant en heure de Paris.
      const events = tasks.map((task, i) => {
        const startTime = eventStartTimes[i] || new Date();
        // Extraire les composants de la date locale (qui est en heure de Paris sur le téléphone)
        const year = startTime.getFullYear();
        const month = String(startTime.getMonth() + 1).padStart(2, '0');
        const day = String(startTime.getDate()).padStart(2, '0');
        const hour = String(startTime.getHours()).padStart(2, '0');
        const minute = String(startTime.getMinutes()).padStart(2, '0');
        // Envoyer comme string ISO mais en interprétant les composants comme heure de Paris
        const startISO = `${year}-${month}-${day}T${hour}:${minute}:00`;
        
        return {
          title: task.title,
          description: task.description || null,
          subjectName: task.subjectName,
          subjectId: task.subjectId,
          priority: task.priority,
          energy: task.energy,
          start: startISO, // String au format YYYY-MM-DDTHH:mm:ss (sans timezone)
          durationMinutes: task.estimatedDuration,
        };
      });

      const result = await dailyPlanningService.createDayEvents(events);

      if (result.success && (result.eventsCreated > 0 || (result.tasksCreated ?? 0) > 0)) {
        const messages = [];
        if (result.eventsCreated > 0) {
          messages.push(`${result.eventsCreated} événement(s) dans Google Calendar`);
        }
        if ((result.tasksCreated ?? 0) > 0) {
          messages.push(`${result.tasksCreated} tâche(s) dans AI Tasks`);
        }
        Alert.alert(
          'Succès',
          `${messages.join(', ')}. Vous les retrouverez dans votre calendrier et dans l'onglet tâches.`,
          [
            {
              text: 'OK',
              onPress: () => {
                void (async () => {
                  if (tutorialStage === 'plan' && !tutorialCompleted) {
                    await setTutorialStage('focus');
                    setTutorialStageState('focus');
                    router.push('/focus');
                  } else {
                    router.back();
                  }
                })();
              },
            },
          ]
        );
      } else if (result.eventsCreated === 0 && result.eventsFailed > 0) {
        Alert.alert('Erreur', 'Impossible de créer les événements. Vérifiez votre connexion Google Calendar.');
      }
    } catch (error: any) {
      console.error('Erreur création événements:', error);
      const errorMessage = error?.message || '';
      let alertMessage = 'Impossible de créer les événements. Réessayez.';
      if (errorMessage.includes('Google Calendar non connecté')) {
        alertMessage = 'Connectez votre Google Calendar dans les paramètres.';
      } else if (errorMessage.includes('pas encore disponible') || errorMessage.includes('à jour')) {
        alertMessage = 'Cette fonctionnalité nécessite une mise à jour du serveur. Elle sera bientôt disponible.';
      } else if (errorMessage.toLowerCase().includes('plan my day') || errorMessage.toLowerCase().includes('premium') || errorMessage.toLowerCase().includes('limite')) {
        alertMessage = errorMessage;
      }
      Alert.alert('Erreur', alertMessage);
    } finally {
      setIsCreatingEvents(false);
    }
  };

  if (phase === 'entry') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {planLimits?.planMyDayMode === 'preview' && (
            <View style={styles.planLimitCard}>
              <View style={styles.planLimitTextContainer}>
                <Text style={styles.planLimitTitle}>Aperçu Plan My Day</Text>
                <Text style={styles.planLimitText}>
                  Accédez à une version limitée (max {planLimits.maxPlanMyDayEvents ?? 3} tâches). Passez en Premium pour tout planifier.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.planLimitButton}
                onPress={() =>
                  triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
                    params: { source: 'plan_my_day_preview_entry' },
                    // CTA explicite : doit toujours afficher le paywall.
                    bypassCooldown: true,
                  })
                }
              >
                <Text style={styles.planLimitButtonText}>Passer en Premium</Text>
              </TouchableOpacity>
            </View>
          )}
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.entryContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#16A34A" />
            </View>

            <Text style={styles.entryTitle}>{t('planYourDayIn60Seconds')}</Text>
            <Text style={styles.entrySubtitle}>{t('speakWeStructure')}</Text>

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>{t('recordVoice')}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                ref={typeButtonRef}
                style={styles.typeButton}
                onPress={() => setPhase('transcription')}
                activeOpacity={0.7}
              >
                <Text style={styles.typeButtonText}>{t('typeInstead')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>{t('back')}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
        <Coachmark
          visible={!tutorialCompleted && tutorialStage === 'plan' && phase === 'entry'}
          targetRef={typeButtonRef}
          text="Planifie ta journee: tape tes taches ici pour generer ton planning."
          nextLabel="Commencer"
          onNext={() => setPhase('transcription')}
          onSkip={async () => {
            await setTutorialCompleted(false);
            await setTutorialStage('focus');
            setTutorialCompletedState(false);
            setTutorialStageState('focus');
            router.replace('/focus');
          }}
        />
      </View>
    );
  }

  if (phase === 'recording') {
    return (
      <View style={[styles.container, styles.recordingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.recordingContent}>
          <View style={[styles.recordingCircle, isRecording && styles.recordingCircleActive]}>
            <Ionicons name="mic" size={60} color="#FFFFFF" />
          </View>
          <Text style={styles.recordingTitle}>Enregistrement en cours...</Text>
          <Text style={styles.recordingSubtitle}>Parlez maintenant</Text>

          <TouchableOpacity
            style={styles.stopButton}
            onPress={stopRecording}
            activeOpacity={0.8}
          >
            <Ionicons name="stop" size={24} color="#FFFFFF" />
            <Text style={styles.stopButtonText}>Arrêter</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'transcription') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.transcriptionContent}>
            <View style={styles.checkIcon}>
              {isTranscribing ? (
                <ActivityIndicator size="large" color="#16A34A" />
              ) : (
                <Ionicons name="checkmark-circle" size={24} color="#16A34A" />
              )}
            </View>
            <Text style={styles.transcriptionTitle}>
              {isTranscribing ? t('transcribing') || 'Transcription en cours...' : t('weGotIt') || 'We got it.'}
            </Text>

            <View style={styles.transcriptionCard}>
              <TextInput
                style={styles.transcriptionInput}
                value={transcription}
                onChangeText={setTranscription}
                placeholder={t('transcriptionPlaceholder') || 'Your transcription appears here...'}
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                textAlignVertical="top"
                editable={!isTranscribing}
              />
            </View>
            <Text style={styles.editHint}>{t('youCanEditIfNeeded') || 'You can edit if needed'}</Text>

            <TouchableOpacity
              style={[styles.generateButton, (!transcription.trim() || isTranscribing) && styles.generateButtonDisabled]}
              onPress={processTranscription}
              activeOpacity={0.8}
              disabled={!transcription.trim() || isTranscribing}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>{t('generateMyIdealDay') || 'Generate my ideal day'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordAgainButton}
              onPress={() => {
                setPhase('entry');
                setTranscription('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.recordAgainText}>{t('recordAgain') || 'Record again'}</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'processing') {
    const steps = [
      t('extractingTasks') || 'Extracting tasks',
      t('associatingWithSubjects') || 'Associating with subjects',
      t('prioritizingByImpactTimeEnergy') || 'Prioritizing by impact + time + energy',
    ];

    return (
      <View style={[styles.container, styles.processingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.processingContent}>
          <View style={styles.processingIcon}>
            <Ionicons name="sparkles" size={40} color="#16A34A" />
          </View>

          <Text style={styles.processingTitle}>{t('buildingYourIdealDay') || 'Building your ideal day…'}</Text>

          <View style={styles.stepsContainer}>
            {steps.map((step, index) => {
              const isCompleted = processingStep > index;
              const isCurrent = processingStep === index;
              return (
                <Animated.View
                  key={index}
                  entering={FadeInDown.delay(200 + index * 100).duration(300)}
                  style={[
                    styles.stepItem,
                    isCompleted && styles.stepItemCompleted,
                    isCurrent && styles.stepItemCurrent,
                  ]}
                >
                  <View
                    style={[
                      styles.stepIcon,
                      isCompleted && styles.stepIconCompleted,
                      isCurrent && styles.stepIconCurrent,
                    ]}
                  >
                    {isCompleted ? (
                      <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                    ) : isCurrent ? (
                      <ActivityIndicator size="small" color="#16A34A" />
                    ) : null}
                  </View>
                  <Text
                    style={[
                      styles.stepText,
                      isCompleted && styles.stepTextCompleted,
                      isCurrent && styles.stepTextCurrent,
                    ]}
                  >
                    {step}
                  </Text>
                </Animated.View>
              );
            })}
          </View>
        </Animated.View>
      </View>
    );
  }

  if (phase === 'association') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setPhase('transcription')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>Associer aux matières</Text>
              <Text style={styles.headerSubtitle}>Vérifiez et corrigez si nécessaire</Text>
            </View>
          </Animated.View>

          {planPreviewLimited && (
            <View style={styles.planLimitNotice}>
              <Ionicons name="lock-closed" size={18} color="#16A34A" />
              <Text style={styles.planLimitNoticeText}>
                Aperçu: seules {planLimits?.maxPlanMyDayEvents ?? 3} tâches sont incluses. Passez en Premium pour le plan complet.
              </Text>
              <TouchableOpacity
                style={styles.planLimitButton}
                onPress={() =>
                  triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
                    params: { source: 'plan_my_day_preview_association' },
                    // CTA explicite : doit toujours afficher le paywall.
                    bypassCooldown: true,
                  })
                }
              >
                <Text style={styles.planLimitButtonText}>Upgrade</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.tasksList}>
            {tasks.map((task, index) => (
              <View key={index} style={styles.taskCard}>
                <View style={styles.taskHeader}>
                  <Text style={styles.taskTitle}>{task.title}</Text>
                  {task.confidence < 0.7 && (
                    <View style={styles.lowConfidenceBadge}>
                      <Ionicons name="warning" size={14} color="#FF6B00" />
                      <Text style={styles.lowConfidenceText}>À vérifier</Text>
                    </View>
                  )}
                </View>

                {task.description && (
                  <Text style={styles.taskDescription}>{task.description}</Text>
                )}

                <TouchableOpacity
                  style={[
                    styles.subjectSelector,
                    !task.subjectId && styles.subjectSelectorEmpty,
                  ]}
                  onPress={() => {
                    setSelectedTaskIndex(index);
                    setShowSubjectPicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={task.subjectId ? 'checkmark-circle' : 'add-circle-outline'}
                    size={20}
                    color={task.subjectId ? '#16A34A' : 'rgba(0, 0, 0, 0.4)'}
                  />
                  <Text style={[
                    styles.subjectSelectorText,
                    !task.subjectId && styles.subjectSelectorTextEmpty,
                  ]}>
                    {task.subjectName || 'Sélectionner une matière'}
                  </Text>
                  {task.subjectId && task.confidence < 1.0 && (
                    <Text style={styles.confidenceText}>
                      ({Math.round(task.confidence * 100)}% confiance)
                    </Text>
                  )}
                </TouchableOpacity>

                <View style={styles.taskMeta}>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="time-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <View style={styles.durationControl}>
                      <TouchableOpacity
                        style={styles.durationButton}
                        onPress={() => updateTaskDuration(index, -15)}
                        disabled={task.estimatedDuration <= 15}
                      >
                        <Ionicons name="remove" size={16} color={task.estimatedDuration <= 15 ? 'rgba(0,0,0,0.2)' : '#000'} />
                      </TouchableOpacity>
                      <Text style={styles.taskMetaText}>{task.estimatedDuration} min</Text>
                      <TouchableOpacity
                        style={styles.durationButton}
                        onPress={() => updateTaskDuration(index, 15)}
                        disabled={task.estimatedDuration >= 480}
                      >
                        <Ionicons name="add" size={16} color={task.estimatedDuration >= 480 ? 'rgba(0,0,0,0.2)' : '#000'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                <View style={styles.taskMetaRow}>
                  <View style={styles.taskMetaItemAdjustable}>
                    <Ionicons name="flag-outline" size={14} color="#16A34A" />
                    <Text style={styles.taskMetaLabel}>Priorité</Text>
                    <View style={styles.adjustableControl}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => updateTaskPriority(index, -1)}
                        disabled={task.priority <= 1}
                      >
                        <Ionicons name="remove" size={14} color={task.priority <= 1 ? 'rgba(0,0,0,0.2)' : '#16A34A'} />
                      </TouchableOpacity>
                      <Text style={styles.adjustableValue}>{task.priority}/5</Text>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => updateTaskPriority(index, 1)}
                        disabled={task.priority >= 5}
                      >
                        <Ionicons name="add" size={14} color={task.priority >= 5 ? 'rgba(0,0,0,0.2)' : '#16A34A'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View style={styles.taskMetaItemAdjustable}>
                    <Ionicons name="flash-outline" size={14} color="#F59E0B" />
                    <Text style={styles.taskMetaLabel}>Énergie</Text>
                    <View style={styles.adjustableControl}>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => updateTaskEnergy(index, -1)}
                        disabled={task.energy <= 1}
                      >
                        <Ionicons name="remove" size={14} color={task.energy <= 1 ? 'rgba(0,0,0,0.2)' : '#F59E0B'} />
                      </TouchableOpacity>
                      <Text style={styles.adjustableValue}>{task.energy}/5</Text>
                      <TouchableOpacity
                        style={styles.adjustButton}
                        onPress={() => updateTaskEnergy(index, 1)}
                        disabled={task.energy >= 5}
                      >
                        <Ionicons name="add" size={14} color={task.energy >= 5 ? 'rgba(0,0,0,0.2)' : '#F59E0B'} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
            ref={confirmButtonRef}
            style={[styles.confirmButton, isLoadingCalendar && styles.confirmButtonDisabled]}
            onPress={confirmAssociations}
            activeOpacity={0.8}
            disabled={isLoadingCalendar}
          >
            {isLoadingCalendar ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            )}
            <Text style={styles.confirmButtonText}>
              {isLoadingCalendar ? 'Chargement...' : 'Confirmer et continuer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <Coachmark
          visible={!tutorialCompleted && tutorialStage === 'plan' && phase === 'association'}
          targetRef={confirmButtonRef}
          text="Planifie automatiquement ta journee."
          nextLabel="Planifier"
          onNext={confirmAssociations}
          onSkip={async () => {
            await setTutorialCompleted(false);
            await setTutorialStage('focus');
            setTutorialCompletedState(false);
            setTutorialStageState('focus');
            router.replace('/focus');
          }}
        />

        {/* Subject Picker Modal */}
        <Modal
          visible={showSubjectPicker}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowSubjectPicker(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Sélectionner une matière</Text>
                <TouchableOpacity
                  onPress={() => setShowSubjectPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close" size={24} color="#000" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScrollView}>
                <TouchableOpacity
                  style={styles.subjectOption}
                  onPress={() => {
                    if (selectedTaskIndex !== null) {
                      updateTaskSubject(selectedTaskIndex, null);
                    }
                  }}
                >
                  <Text style={styles.subjectOptionText}>Aucune matière</Text>
                </TouchableOpacity>

                {subjects.map((subject) => (
                  <TouchableOpacity
                    key={subject.id}
                    style={styles.subjectOption}
                    onPress={() => {
                      if (selectedTaskIndex !== null) {
                        updateTaskSubject(selectedTaskIndex, subject.id);
                      }
                    }}
                  >
                    <Text style={styles.subjectOptionText}>{subject.name}</Text>
                    <Text style={styles.subjectOptionCoeff}>Coef {subject.coefficient}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  if (phase === 'overview') {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setPhase('association')}
            >
              <Ionicons name="arrow-back" size={22} color="#000" />
            </TouchableOpacity>

            <View style={styles.headerContent}>
              <Text style={styles.headerTitle}>{t('yourIdealDay')}</Text>
              <Text style={styles.headerSubtitle}>
                {format(targetDate, 'EEEE, d MMMM')}
              </Text>
            </View>
          </Animated.View>

          {/* Timeline interactive avec événements existants et nouvelles tâches */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={[styles.section, styles.timelineSectionFullWidth]}>
            <View style={styles.timelineSectionHeader}>
              <Text style={styles.sectionLabel}>{t('calendarOfTheDay') || 'Calendrier du jour'}</Text>
              <Text style={styles.timelineDragHint}>
                Maintiens une tâche pour la déplacer
              </Text>
            </View>
            <TimelineCalendar
              targetDate={targetDate}
              existingEvents={existingCalendarEvents}
              tasks={tasks}
              eventStartTimes={eventStartTimes}
              onTimeChange={handleTimelineTimeChange}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.reassuranceCard}>
            <Text style={styles.reassuranceText}>
              {t('idealDayReassurance') || "This covers what matters. Nothing more, nothing less."}
            </Text>
          </Animated.View>

          <View style={{ height: 140 }} />
        </ScrollView>

        <View style={styles.bottomCTA}>
          {isCalendarConnected ? (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={handleCreateCalendarEvents}
              activeOpacity={0.8}
              disabled={isCreatingEvents}
            >
              {isCreatingEvents ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.syncButtonText}>
                {isCreatingEvents ? 'Création...' : 'Valider et ajouter au calendrier'}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.syncButton}
              onPress={() => router.push('/(onboarding-new)/calendar-sync')}
              activeOpacity={0.8}
            >
              <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              <Text style={styles.syncButtonText}>Connecter Google Calendar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return null;
}

// Constantes pour la timeline
const HOUR_HEIGHT = 60; // Hauteur en pixels pour chaque heure
const START_HOUR = 6; // Heure de début de la timeline (6h)
const END_HOUR = 24; // Heure de fin de la timeline (24h)

// Composant Timeline Calendar pour afficher les événements et tâches sur une timeline
interface TimelineCalendarProps {
  targetDate: Date;
  existingEvents: {
    id: string;
    title: string;
    start: string;
    end: string;
    startDate: string | null;
    endDate: string | null;
  }[];
  tasks: TaskWithSubject[];
  eventStartTimes: Date[];
  onTimeChange: (taskIndex: number, newTime: Date) => void;
}

function TimelineCalendar({
  targetDate,
  existingEvents,
  tasks,
  eventStartTimes,
  onTimeChange,
}: TimelineCalendarProps) {
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const timelineRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Refs pour le closure
  const draggingIndexRef = useRef<number | null>(null);
  const dragYRef = useRef(0);
  const dragStartYRef = useRef(0);
  const eventStartTimesRef = useRef(eventStartTimes);
  const scrollOffsetRef = useRef(0);
  const lastScrollTimeRef = useRef(0);
  
  // Mettre à jour les refs quand les valeurs changent
  useEffect(() => {
    eventStartTimesRef.current = eventStartTimes;
  }, [eventStartTimes]);

  // Convertir une heure en position Y sur la timeline
  const hourToY = (date: Date): number => {
    const hours = getHours(date);
    const minutes = getMinutes(date);
    const totalMinutes = (hours - START_HOUR) * 60 + minutes;
    return (totalMinutes / 60) * HOUR_HEIGHT;
  };

  // Convertir une position Y en heure
  const yToHour = (y: number): Date => {
    const totalMinutes = (y / HOUR_HEIGHT) * 60;
    const hours = Math.floor(totalMinutes / 60) + START_HOUR;
    const minutes = Math.round(totalMinutes % 60);
    const dayStart = startOfDay(targetDate);
    return setMinutes(setHours(dayStart, hours), minutes);
  };

  // Handlers pour le glisser-déposer avec PanGestureHandler (comme sur la page /scan)
  const handlePanStateChange = (taskIndex: number, event: { nativeEvent: { state: number } }) => {
    const { state } = event.nativeEvent;
    if (state === State.ACTIVE) {
      const currentStartTimes = eventStartTimesRef.current;
      const taskY = hourToY(currentStartTimes[taskIndex] || new Date());
      draggingIndexRef.current = taskIndex;
      dragStartYRef.current = taskY;
      dragYRef.current = taskY;
      setDraggingIndex(taskIndex);
      setDragStartY(taskY);
      setDragY(taskY);
    } else if (state === State.END || state === State.CANCELLED) {
      if (draggingIndexRef.current === taskIndex) {
        const currentDragY = dragYRef.current;
        const newTime = yToHour(currentDragY);
        const minutes = getMinutes(newTime);
        const roundedMinutes = Math.round(minutes / 15) * 15;
        const finalTime = setMinutes(newTime, roundedMinutes);
        onTimeChange(taskIndex, finalTime);
        draggingIndexRef.current = null;
        dragYRef.current = 0;
        dragStartYRef.current = 0;
        setDraggingIndex(null);
        setDragY(0);
        setDragStartY(0);
      }
    }
  };

  const handlePanGesture = (taskIndex: number, event: { nativeEvent: { translationY: number } }) => {
    if (draggingIndexRef.current === taskIndex) {
      const startY = dragStartYRef.current;
      const newY = startY + event.nativeEvent.translationY;
      const minY = 0;
      const maxY = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
      const clampedY = Math.max(minY, Math.min(maxY, newY));
      dragYRef.current = clampedY;
      setDragY(clampedY);

      // Auto-scroll quand on drag près des bords pour atteindre 20h, 22h, etc.
      const now = Date.now();
      if (now - lastScrollTimeRef.current < 80) return; // Throttle
      const scroll = scrollViewRef.current as any;
      if (!scroll?.scrollTo) return;

      const visibleHeight = Dimensions.get('window').height * 0.35;
      const scrollOffset = scrollOffsetRef.current;

      if (clampedY > scrollOffset + visibleHeight - 100) {
        const newOffset = Math.min(clampedY - visibleHeight + 80, maxY);
        scroll.scrollTo({ y: newOffset, animated: false });
        lastScrollTimeRef.current = now;
      } else if (clampedY < scrollOffset + 80) {
        const newOffset = Math.max(0, clampedY - 80);
        scroll.scrollTo({ y: newOffset, animated: false });
        lastScrollTimeRef.current = now;
      }
    }
  };

  // Combiner tous les événements (existants + nouvelles tâches)
  // Utiliser useMemo pour recalculer quand eventStartTimes change
  const allEvents = useMemo(() => {
    return [
      ...existingEvents.map((evt) => {
        const start = evt.startDate ? new Date(evt.startDate) : null;
        const end = evt.endDate ? new Date(evt.endDate) : null;
        return {
          id: evt.id,
          title: evt.title,
          start,
          end,
          isExisting: true,
        };
      }),
      ...tasks.map((task, index) => {
        // Utiliser dragY si on est en train de glisser cette tâche, sinon eventStartTimes
        let start: Date;
        if (draggingIndex === index && dragY > 0) {
          // Pendant le glisser, utiliser la position Y actuelle
          start = yToHour(dragY);
        } else {
          start = eventStartTimes[index] || new Date();
        }
        const end = addMinutes(start, task.estimatedDuration);
        return {
          id: `task-${index}`,
          title: task.title,
          subjectName: task.subjectName,
          start,
          end,
          isExisting: false,
          taskIndex: index,
        };
      }),
    ].filter((evt) => evt.start && evt.end);
  }, [existingEvents, tasks, eventStartTimes, draggingIndex, dragY]);

  // Trier par heure de début
  const sortedEvents = useMemo(() => {
    return [...allEvents].sort((a, b) => a.start!.getTime() - b.start!.getTime());
  }, [allEvents]);

  const timelineHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <GestureScrollView 
      ref={scrollViewRef}
      style={styles.timelineScrollView}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
      scrollEnabled={draggingIndex === null}
      onScroll={(e) => { scrollOffsetRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
    >
      <View style={styles.timelineContainer}>
        <View style={styles.timelineContent}>
        {/* Ligne de temps avec heures */}
        <View style={styles.timelineHours}>
          {Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => {
            const hour = START_HOUR + i;
            return (
              <View key={hour} style={[styles.timelineHour, { top: i * HOUR_HEIGHT }]}>
                <Text style={styles.timelineHourText}>{String(hour).padStart(2, '0')}:00</Text>
                <View style={styles.timelineHourLine} />
              </View>
            );
          })}
        </View>

        {/* Événements et tâches - pleine largeur, pas de colonnes côte à côte */}
        <View style={styles.timelineEvents}>
          {sortedEvents.map((evt) => {
            if (!evt.start || !evt.end) return null;
            
            const top = hourToY(evt.start);
            const durationHours = (evt.end.getTime() - evt.start.getTime()) / (1000 * 60 * 60);
            const height = durationHours * HOUR_HEIGHT;
            const isDragging = draggingIndex !== null && !evt.isExisting && evt.taskIndex === draggingIndex;
            const currentTop = isDragging ? dragY : top;

            // Toujours pleine largeur (pas de colonnes côte à côte)
            const isDraggable = !evt.isExisting && evt.taskIndex !== undefined;
            const taskIndex = evt.taskIndex ?? -1;

            const isCompact = height < 44;
            const eventInnerContent = (
              <>
                {isCompact ? (
                  <View style={styles.timelineEventRowCompact}>
                    <Text style={styles.timelineEventTimeCompact} numberOfLines={1}>
                      {format(evt.start, 'HH:mm')} - {format(evt.end, 'HH:mm')}
                    </Text>
                    <Text style={styles.timelineEventTitleCompact} numberOfLines={1}>
                      {evt.title}
                    </Text>
                    {!evt.isExisting && (
                      <View style={styles.timelineEventDragHandleCompact}>
                        <Ionicons name="reorder-three" size={16} color="rgba(0,0,0,0.5)" />
                      </View>
                    )}
                  </View>
                ) : (
                  <>
                    <Text style={styles.timelineEventTime}>
                      {format(evt.start, 'HH:mm')} - {format(evt.end, 'HH:mm')}
                    </Text>
                    <Text style={styles.timelineEventTitle} numberOfLines={2}>
                      {evt.title}
                    </Text>
                    {!evt.isExisting && evt.subjectName && (
                      <View style={styles.timelineEventBadge}>
                        <Text style={styles.timelineEventBadgeText}>{evt.subjectName}</Text>
                      </View>
                    )}
                    {!evt.isExisting && (
                      <View style={styles.timelineEventDragHandle}>
                        <Ionicons name="reorder-three" size={22} color="rgba(0,0,0,0.5)" />
                      </View>
                    )}
                  </>
                )}
              </>
            );

            if (isDraggable) {
              return (
                <PanGestureHandler
                  key={evt.id}
                  onHandlerStateChange={(e) => handlePanStateChange(taskIndex, e)}
                  onGestureEvent={(e) => handlePanGesture(taskIndex, e)}
                  activeOffsetY={[-10, 10]}
                  activateAfterLongPress={250}
                >
                  <View
                    style={[
                      styles.timelineEventBase,
                      isCompact && styles.timelineEventCompact,
                      styles.timelineEventNew,
                      {
                        top: currentTop,
                        height,
                        left: 0,
                        right: 0,
                      },
                      isDragging && styles.timelineEventDragging,
                    ]}
                  >
                    {eventInnerContent}
                  </View>
                </PanGestureHandler>
              );
            }

            return (
              <View
                key={evt.id}
                style={[
                  styles.timelineEventBase,
                  isCompact && styles.timelineEventCompact,
                  evt.isExisting ? styles.timelineEventExisting : styles.timelineEventNew,
                  {
                    top: currentTop,
                    height,
                    left: 0,
                    right: 0,
                  },
                ]}
              >
                {eventInnerContent}
              </View>
            );
          })}
        </View>
      </View>
    </View>
    </GestureScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  planLimitCard: {
    backgroundColor: '#ECFDF3',
    borderColor: '#16A34A',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planLimitTextContainer: {
    flex: 1,
    gap: 4,
  },
  planLimitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#14532D',
  },
  planLimitText: {
    fontSize: 14,
    color: '#166534',
  },
  planLimitButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  planLimitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  planLimitNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  planLimitNoticeText: {
    flex: 1,
    color: '#166534',
    fontSize: 14,
  },
  entryContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 600,
    gap: 48,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryTitle: {
    fontSize: 40,
    fontWeight: '600',
    letterSpacing: -1.5,
    color: '#000000',
    textAlign: 'center',
  },
  entrySubtitle: {
    fontSize: 18,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  ctaContainer: {
    width: '100%',
    gap: 16,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  typeButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  typeButtonText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  backButton: {
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'rgba(0, 0, 0, 0.4)',
    fontSize: 16,
  },
  recordingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingContent: {
    alignItems: 'center',
    gap: 32,
  },
  recordingCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingCircleActive: {
    backgroundColor: '#16A34A',
  },
  recordingTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000000',
  },
  recordingSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FF3B30',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
  },
  stopButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  transcriptionContent: {
    flex: 1,
    gap: 24,
  },
  checkIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  transcriptionTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    textAlign: 'center',
  },
  transcriptionCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    minHeight: 200,
  },
  transcriptionInput: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.8)',
    minHeight: 200,
  },
  editHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  generateButtonDisabled: {
    opacity: 0.5,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  recordAgainButton: {
    paddingVertical: 14,
    borderRadius: 24,
    alignItems: 'center',
  },
  recordAgainText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingContent: {
    width: '100%',
    maxWidth: 400,
    gap: 48,
    alignItems: 'center',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
    textAlign: 'center',
  },
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  stepItemCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  stepItemCurrent: {
    borderColor: 'rgba(22, 163, 74, 0.3)',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
  },
  stepIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepIconCompleted: {
    backgroundColor: '#16A34A',
  },
  stepIconCurrent: {
    backgroundColor: 'rgba(22, 163, 74, 0.2)',
    borderWidth: 2,
    borderColor: '#16A34A',
  },
  stepText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  stepTextCompleted: {
    color: '#000000',
  },
  stepTextCurrent: {
    color: '#16A34A',
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 32,
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tasksList: {
    gap: 16,
    marginBottom: 24,
  },
  taskCard: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  taskTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  lowConfidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 107, 0, 0.1)',
  },
  lowConfidenceText: {
    fontSize: 12,
    color: '#FF6B00',
    fontWeight: '500',
  },
  taskDescription: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 20,
  },
  subjectSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  subjectSelectorEmpty: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  subjectSelectorText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#16A34A',
  },
  subjectSelectorTextEmpty: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  confidenceText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  taskMetaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  taskMetaItemAdjustable: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  taskMetaLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    fontWeight: '500',
  },
  adjustableControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 'auto',
  },
  adjustButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    minWidth: 28,
    textAlign: 'center',
  },
  taskMetaText: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    marginBottom: 24,
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 4,
  },
  modalScrollView: {
    padding: 24,
  },
  subjectOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginBottom: 8,
  },
  subjectOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  subjectOptionCoeff: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  section: {
    marginBottom: 32,
  },
  timelineSectionFullWidth: {
    marginHorizontal: -24,
    width: Dimensions.get('window').width,
  },
  timelineSectionHeader: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  timelineDragHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: -4,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  existingEventsList: {
    gap: 8,
  },
  existingEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  existingEventTime: {
    minWidth: 80,
  },
  existingEventTimeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  existingEventTitle: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  timelineScrollView: {
    flex: 1,
  },
  timelineContainer: {
    marginTop: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  timelineContent: {
    position: 'relative',
    minHeight: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
  },
  timelineHours: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
  },
  timelineHour: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 12,
    paddingRight: 8,
    height: HOUR_HEIGHT,
  },
  timelineHourText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '500',
    width: 36,
  },
  timelineHourLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 12,
  },
  timelineEvents: {
    position: 'absolute',
    left: 56,
    right: 8,
    height: (END_HOUR - START_HOUR) * HOUR_HEIGHT,
  },
  timelineEvent: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    minHeight: 40,
  },
  timelineEventBase: {
    position: 'absolute',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 2,
  },
  timelineEventCompact: {
    paddingVertical: 4,
    paddingHorizontal: 6,
    justifyContent: 'center',
  },
  timelineEventRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  timelineEventTimeCompact: {
    fontSize: 10,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '600',
    flexShrink: 0,
  },
  timelineEventTitleCompact: {
    fontSize: 12,
    color: '#000000',
    fontWeight: '500',
    flex: 1,
    minWidth: 0,
  },
  timelineEventExisting: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderLeftWidth: 3,
    borderLeftColor: 'rgba(0, 0, 0, 0.2)',
  },
  timelineEventNew: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#16A34A',
  },
  timelineEventDragging: {
    opacity: 0.7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  timelineEventTime: {
    fontSize: 11,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineEventTitle: {
    fontSize: 13,
    color: '#000000',
    fontWeight: '500',
    marginBottom: 4,
  },
  timelineEventBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
  },
  timelineEventBadgeText: {
    fontSize: 10,
    color: '#16A34A',
    fontWeight: '600',
  },
  timelineEventDragIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  timelineEventDragHandle: {
    position: 'absolute',
    right: 8,
    top: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 4,
  },
  timelineEventDragHandleCompact: {
    flexShrink: 0,
    padding: 2,
  },
  timelineEventDragHint: {
    fontSize: 10,
    color: 'rgba(0,0,0,0.4)',
    fontStyle: 'italic',
  },
  blocksList: {
    gap: 12,
  },
  blockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  blockTime: {
    width: 80,
    alignItems: 'flex-end',
  },
  blockTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  blockDurationText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.5)',
    marginTop: 2,
  },
  timeControl: {
    alignItems: 'center',
    gap: 2,
  },
  timeAdjustButton: {
    padding: 4,
  },
  durationControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blockContent: {
    flex: 1,
    gap: 4,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: '#000000',
  },
  blockSubjectBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    marginTop: 4,
  },
  blockSubjectText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '500',
  },
  reassuranceCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  reassuranceText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  bottomCTA: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 24,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  syncButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

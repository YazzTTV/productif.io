import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, ActivityIndicator, Alert, Modal, PanResponder, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { taskAssociationService, googleCalendarService, dailyPlanningService } from '@/lib/api';
import { format, addMinutes, setHours, setMinutes, startOfDay, isBefore, getHours, getMinutes } from 'date-fns';

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
  const [phase, setPhase] = useState<PlanPhase>('entry');
  const [transcription, setTranscription] = useState('');
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
  const [existingCalendarEvents, setExistingCalendarEvents] = useState<Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    startDate: string | null;
    endDate: string | null;
  }>>([]); // Événements existants du calendrier pour la date cible
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false); // État de chargement pour confirmAssociations

  useEffect(() => {
    return () => {
      // Nettoyer l'enregistrement si le composant est démonté
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

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

      // Créer FormData pour l'upload
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'recording.m4a',
      } as any);

      // Appeler l'API de transcription
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch('https://www.productif.io/api/transcribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la transcription');
      }

      const data = await response.json();
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
          setTasks(result.tasks);
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

  const updateTaskSubject = (taskIndex: number, subjectId: string | null) => {
    const updatedTasks = [...tasks];
    const task = updatedTasks[taskIndex];
    const subject = subjects.find((s) => s.id === subjectId);

    task.subjectId = subjectId;
    task.subjectName = subject?.name || null;
    task.confidence = subjectId ? 1.0 : 0.0;

    setTasks(updatedTasks);
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
      
      let existingBusyPeriods: Array<{ start: Date; end: Date }> = [];

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

      // Calculer les heures de début en évitant les créneaux occupés
      const dayStart = startOfDay(targetDate);
      const defaultStart = setMinutes(setHours(dayStart, 9), 0); // 9h par défaut
      const times: Date[] = [];
      let currentTime = new Date(defaultStart);

      console.log('📋 [PlanMyDay] Calcul des créneaux pour', tasks.length, 'tâches');

      for (const task of tasks) {
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

        times.push(new Date(currentTime));
        currentTime = addMinutes(currentTime, task.estimatedDuration);
      }

      console.log('✅ [PlanMyDay] Créneaux calculés:', times.length);
      setEventStartTimes(times);
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

  // Modifier l'heure de début d'un événement (phase overview)
  const updateEventStartTime = (index: number, deltaMinutes: number, newTime?: Date) => {
    const updated = [...eventStartTimes];
    if (newTime) {
      updated[index] = newTime;
    } else {
      updated[index] = addMinutes(updated[index], deltaMinutes);
    }
    // S'assurer que l'heure ne devient pas négative
    const dayStart = startOfDay(targetDate);
    if (updated[index] < dayStart) {
      updated[index] = new Date(dayStart);
    }
    setEventStartTimes(updated);
  };
  
  // Wrapper pour la timeline qui accepte newTime
  const handleTimelineTimeChange = (index: number, newTime: Date) => {
    updateEventStartTime(index, 0, newTime);
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
          [{ text: 'OK', onPress: () => router.back() }]
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
          <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.entryContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="sparkles" size={40} color="#16A34A" />
            </View>

            <Text style={styles.entryTitle}>Plan your day in 60 seconds</Text>
            <Text style={styles.entrySubtitle}>Speak. We'll structure it.</Text>

            <View style={styles.ctaContainer}>
              <TouchableOpacity
                style={styles.recordButton}
                onPress={startRecording}
                activeOpacity={0.8}
              >
                <Ionicons name="mic" size={20} color="#FFFFFF" />
                <Text style={styles.recordButtonText}>Record voice</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.typeButton}
                onPress={() => setPhase('transcription')}
                activeOpacity={0.7}
              >
                <Text style={styles.typeButtonText}>Type instead</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
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
              {isTranscribing ? 'Transcription en cours...' : 'We got it.'}
            </Text>

            <View style={styles.transcriptionCard}>
              <TextInput
                style={styles.transcriptionInput}
                value={transcription}
                onChangeText={setTranscription}
                placeholder="Your transcription appears here..."
                placeholderTextColor="rgba(0, 0, 0, 0.4)"
                multiline
                textAlignVertical="top"
                editable={!isTranscribing}
              />
            </View>
            <Text style={styles.editHint}>You can edit if needed</Text>

            <TouchableOpacity
              style={[styles.generateButton, (!transcription.trim() || isTranscribing) && styles.generateButtonDisabled]}
              onPress={processTranscription}
              activeOpacity={0.8}
              disabled={!transcription.trim() || isTranscribing}
            >
              <Ionicons name="sparkles" size={20} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Generate my ideal day</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recordAgainButton}
              onPress={() => {
                setPhase('entry');
                setTranscription('');
              }}
              activeOpacity={0.7}
            >
              <Text style={styles.recordAgainText}>Record again</Text>
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  if (phase === 'processing') {
    const steps = [
      'Extracting tasks',
      'Associating with subjects',
      'Prioritizing by impact + time + energy',
    ];

    return (
      <View style={[styles.container, styles.processingContainer, { paddingTop: insets.top }]}>
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.processingContent}>
          <View style={styles.processingIcon}>
            <Ionicons name="sparkles" size={40} color="#16A34A" />
          </View>

          <Text style={styles.processingTitle}>Building your ideal day…</Text>

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
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="flash-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.taskMetaText}>Énergie: {task.energy}/5</Text>
                  </View>
                  <View style={styles.taskMetaItem}>
                    <Ionicons name="flag-outline" size={14} color="rgba(0, 0, 0, 0.4)" />
                    <Text style={styles.taskMetaText}>Priorité: {task.priority}/5</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>

          <TouchableOpacity
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
              <Text style={styles.headerTitle}>Your Ideal Day</Text>
              <Text style={styles.headerSubtitle}>{format(targetDate, 'EEEE, d MMMM')}</Text>
            </View>
          </Animated.View>

          {/* Timeline interactive avec événements existants et nouvelles tâches */}
          <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Calendrier du jour</Text>
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
              This covers what matters. Nothing more, nothing less.
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
  existingEvents: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
    startDate: string | null;
    endDate: string | null;
  }>;
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
  const panRespondersRef = useRef<Map<number, ReturnType<typeof PanResponder.create>>>(new Map());

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

  // Obtenir ou créer un pan responder pour une tâche (mémorisé)
  const getTaskPanResponder = (taskIndex: number): ReturnType<typeof PanResponder.create> => {
    if (!panRespondersRef.current.has(taskIndex)) {
      panRespondersRef.current.set(taskIndex, PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt, gestureState) => {
          const taskY = hourToY(eventStartTimes[taskIndex]);
          setDraggingIndex(taskIndex);
          setDragStartY(taskY);
          setDragY(taskY);
        },
        onPanResponderMove: (evt, gestureState) => {
          if (draggingIndex === taskIndex) {
            const taskY = hourToY(eventStartTimes[taskIndex]);
            const newY = taskY + gestureState.dy;
            const minY = 0;
            const maxY = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
            const clampedY = Math.max(minY, Math.min(maxY, newY));
            setDragY(clampedY);
          }
        },
        onPanResponderRelease: (evt, gestureState) => {
          if (draggingIndex === taskIndex) {
            // Arrondir à la demi-heure la plus proche pour un meilleur alignement
            const newTime = yToHour(dragY);
            const minutes = getMinutes(newTime);
            const roundedMinutes = Math.round(minutes / 30) * 30;
            const finalTime = setMinutes(newTime, roundedMinutes);
            
            onTimeChange(taskIndex, finalTime);
            setDraggingIndex(null);
            setDragY(0);
            setDragStartY(0);
          }
        },
      }));
    }
    return panRespondersRef.current.get(taskIndex)!;
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

  // Détecter les chevauchements et assigner des colonnes
  // Recalculer à chaque fois que les événements changent
  const { eventsWithColumns, totalMaxColumns } = useMemo(() => {
    type EventWithColumn = typeof sortedEvents[0] & { column: number; maxColumns: number; taskIndex?: number; subjectName?: string | null };
    const eventsWithCols: EventWithColumn[] = [];
    let maxCols = 1;
    
    for (let index = 0; index < sortedEvents.length; index++) {
      const evt = sortedEvents[index];
      if (!evt.start || !evt.end) {
        eventsWithCols.push({ ...evt, column: 0, maxColumns: 1 });
        continue;
      }
      
      // Trouver tous les événements précédents qui se chevauchent avec celui-ci
      const usedColumns = new Set<number>();
      for (let i = 0; i < index; i++) {
        const prevEvt = eventsWithCols[i];
        if (!prevEvt.start || !prevEvt.end) continue;
        
        const prevStart = prevEvt.start.getTime();
        const prevEnd = prevEvt.end.getTime();
        const thisStart = evt.start.getTime();
        const thisEnd = evt.end.getTime();
        
        // Vérifier le chevauchement
        if (thisStart < prevEnd && thisEnd > prevStart) {
          usedColumns.add(prevEvt.column);
        }
      }
      
      // Trouver la première colonne libre
      let column = 0;
      while (usedColumns.has(column)) {
        column++;
      }
      
      maxCols = Math.max(maxCols, column + 1);
      
      eventsWithCols.push({ ...evt, column, maxColumns: maxCols });
    }

    return { eventsWithColumns: eventsWithCols, totalMaxColumns: maxCols };
  }, [sortedEvents]);

  const timelineHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

  return (
    <ScrollView 
      ref={scrollViewRef}
      style={styles.timelineScrollView}
      contentContainerStyle={{ paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
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

        {/* Événements et tâches */}
        <View style={styles.timelineEvents}>
          {eventsWithColumns.map((evt) => {
            if (!evt.start || !evt.end) return null;
            
            const top = hourToY(evt.start);
            const height = ((evt.end.getTime() - evt.start.getTime()) / (1000 * 60 * 60)) * HOUR_HEIGHT;
            const isDragging = draggingIndex !== null && !evt.isExisting && evt.taskIndex === draggingIndex;
            const currentTop = isDragging ? dragY : top;
            
            // Calculer la largeur et la position horizontale en fonction de la colonne
            // Si on est en train de glisser, mettre la tâche en pleine largeur pour éviter les chevauchements
            const isDraggingThis = isDragging;
            const columnWidth = isDraggingThis ? 100 : (100 / totalMaxColumns);
            const left = isDraggingThis ? 0 : ((evt.column || 0) * (100 / totalMaxColumns));
            const width = isDraggingThis ? 100 : ((100 / totalMaxColumns) - 2); // -2 pour un petit espace entre les colonnes

            // Obtenir le pan responder pour les tâches (pas les événements existants)
            const panResponder = !evt.isExisting && evt.taskIndex !== undefined 
              ? getTaskPanResponder(evt.taskIndex)
              : null;

            return (
              <View
                key={evt.id}
                style={[
                  styles.timelineEvent,
                  evt.isExisting ? styles.timelineEventExisting : styles.timelineEventNew,
                  {
                    top: currentTop,
                    height: Math.max(height, 40),
                    left: `${left}%`,
                    width: `${width}%`,
                  },
                  isDragging && styles.timelineEventDragging,
                ]}
                {...(panResponder?.panHandlers || {})}
              >
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
                    <Ionicons name="move" size={18} color="rgba(0,0,0,0.4)" />
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </View>
    </View>
    </ScrollView>
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
  taskMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    maxHeight: 600,
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
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 16,
    height: HOUR_HEIGHT,
  },
  timelineHourText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
    fontWeight: '500',
    width: 50,
  },
  timelineHourLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginLeft: 12,
  },
  timelineEvents: {
    position: 'absolute',
    left: 70,
    right: 16,
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

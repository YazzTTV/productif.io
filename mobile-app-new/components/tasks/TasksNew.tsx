import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Platform, Alert, ActivityIndicator, Image, Keyboard } from 'react-native';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import {
  subjectsService,
  tasksService,
  weeklyPlanningService,
  catchUpService,
  type CatchUpPlan,
} from '@/lib/api';
import { format } from 'date-fns';
import { fr, es, enUS } from 'date-fns/locale';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  getTutorialCompleted,
  getTutorialStage,
  setTutorialCompleted,
  setTutorialStage,
  TutorialStage,
} from '@/tutorial/tutorialStorage';
import { InlineHint } from '@/tutorial/InlineHint';
import { Coachmark } from '@/tutorial/Coachmark';
import { useSuperwall } from '@/hooks/useSuperwall';
import {
  assignPriorityTiers,
  calculatePriorityScore,
  PriorityTier,
  TIER_COLORS,
} from '@/utils/priorityScore';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import {
  markUserFirstActionTriggered,
  shouldTriggerUserFirstAction,
} from '@/lib/superwallFirstAction';

interface Task {
  id: string;
  title: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  details?: string;
  // Jour de travail. Alimente le rattrapage des blocs non faits.
  scheduledFor?: string | null;
}

interface Subject {
  id: string;
  name: string;
  coefficient: number;
  progress: number;
  impact: 'high' | 'medium' | 'low';
  insight?: string;
  tasks: Task[];
  nextDeadline?: string;
  deadline?: Date;
}

const MOCK_SUBJECTS: Subject[] = [
  {
    id: '1',
    name: 'Organic Chemistry',
    coefficient: 6,
    progress: 35,
    impact: 'high',
    insight: 'This subject represents 40% of your final grade. Completing these tasks today will reduce future stress.',
    tasks: [
      {
        id: '1-1',
        title: 'Review Chapter 12 — Integrals',
        estimatedTime: 45,
        priority: 'high',
        completed: false,
        details: 'Focus on integration techniques and substitution methods',
      },
      {
        id: '1-2',
        title: 'Complete practice problems 15-20',
        estimatedTime: 60,
        priority: 'high',
        completed: false,
      },
      {
        id: '1-3',
        title: 'Review lecture notes from Monday',
        estimatedTime: 30,
        priority: 'medium',
        completed: false,
      },
    ],
    nextDeadline: 'Exam in 5 days',
  },
  {
    id: '2',
    name: 'Linear Algebra',
    coefficient: 5,
    progress: 60,
    impact: 'high',
    insight: 'Strong foundation here will help with Physics. Stay consistent.',
    tasks: [
      {
        id: '2-1',
        title: 'Matrix operations exercises',
        estimatedTime: 40,
        priority: 'high',
        completed: false,
      },
      {
        id: '2-2',
        title: 'Eigenvalues problem set',
        estimatedTime: 50,
        priority: 'medium',
        completed: true,
      },
    ],
    nextDeadline: 'Assignment due Friday',
  },
];

export function TasksNew() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const { triggerEvent } = useSuperwall();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<string[]>([]);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [showAddSubjectModal, setShowAddSubjectModal] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  const [newSubjectCoeff, setNewSubjectCoeff] = useState(1);
  const [newSubjectDeadline, setNewSubjectDeadline] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [selectedSubjectForTask, setSelectedSubjectForTask] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskEstimatedTime, setNewTaskEstimatedTime] = useState(30);
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskScheduledFor, setNewTaskScheduledFor] = useState<Date | null>(null);
  const [showTaskDatePicker, setShowTaskDatePicker] = useState(false);
  // Valeur en cours de choix, pour qu'Annuler ne modifie rien
  const [taskDateDraft, setTaskDateDraft] = useState<Date | null>(null);
  // Changement de jour sur une tache DEJA creee (l'app n'avait aucune edition)
  const [editingDayTask, setEditingDayTask] = useState<{ id: string; title: string } | null>(null);
  const [editingDayDraft, setEditingDayDraft] = useState<Date | null>(null);
  const [savingDay, setSavingDay] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [selectedSubjectForBulk, setSelectedSubjectForBulk] = useState<string | null>(null);
  const [bulkImportText, setBulkImportText] = useState('');
  const [importingChapters, setImportingChapters] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [planningWeek, setPlanningWeek] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);
  // Rattrapage des blocs non faits
  const [catchUpPlan, setCatchUpPlan] = useState<CatchUpPlan | null>(null);
  const [catchUpCanApply, setCatchUpCanApply] = useState(true);
  const [showCatchUpPreview, setShowCatchUpPreview] = useState(false);
  const [applyingCatchUp, setApplyingCatchUp] = useState(false);
  const [tutorialSubjectId, setTutorialSubjectId] = useState<string | null>(null);
  const tutorialSubjectIdRef = useRef<string | null>(null);
  const addSubjectButtonRef = useRef<TouchableOpacity>(null);
  const addTaskButtonRef = useRef<TouchableOpacity>(null);
  const scrollViewRef = useRef<ScrollView>(null);
  const subjectPositionsRef = useRef<Record<string, number>>({});
  const [tutorialStage, setTutorialStageState] = useState<TutorialStage | null>(null);
  const [tutorialCompleted, setTutorialCompletedState] = useState(false);

  const refreshTutorialState = async () => {
    const [completed, stage] = await Promise.all([
      getTutorialCompleted(),
      getTutorialStage(),
    ]);
    if (!completed && stage === 'calendar') {
      console.log('[Tutorial] TasksNew force stage -> subjects');
      await setTutorialStage('subjects');
      setTutorialCompletedState(false);
      setTutorialStageState('subjects');
      return;
    }
    console.log('[Tutorial] TasksNew load state', { completed, stage });
    setTutorialCompletedState(completed);
    setTutorialStageState(stage);
  };

  useEffect(() => {
    refreshTutorialState();
  }, [tutorialSubjectId]);

  useEffect(() => {
    if (params.tutorial === 'subjects') {
      console.log('[Tutorial] TasksNew param override -> subjects');
      void setTutorialCompleted(false);
      void setTutorialStage('subjects');
      refreshTutorialState();
    }
  }, [params.tutorial]);

  useEffect(() => {
    if (tutorialCompleted) return;
    if (tutorialStage !== 'subjects' && tutorialStage !== 'task') return;
    console.log('[Tutorial] TasksNew inline mode', { tutorialStage });
  }, [tutorialCompleted, tutorialStage]);

  // Coachmarks are handled locally in this screen.

  useEffect(() => {
    if (tutorialCompleted) {
      setTutorialSubjectId(null);
      tutorialSubjectIdRef.current = null;
      return;
    }
    if (tutorialStage && tutorialStage !== 'subjects' && tutorialStage !== 'task') {
      setTutorialSubjectId(null);
      tutorialSubjectIdRef.current = null;
    }
  }, [tutorialCompleted, tutorialStage]);

  const loadSubjects = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await subjectsService.getAll();
      console.log('📥 [TasksNew] Données reçues de l\'API:', JSON.stringify(data, null, 2));
      if (Array.isArray(data)) {
        // S'assurer que chaque matière a un tableau tasks
        // Filtrer les tâches complétées qui ont été complétées il y a plus de 24h
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        let normalizedData = data.map(subject => ({
          ...subject,
          tasks: Array.isArray(subject.tasks) 
            ? subject.tasks.filter((t: Task & { updatedAt?: string }) => {
                // Garder les tâches non complétées
                if (!t.completed) return true;
                // Pour les tâches complétées, vérifier si elles ont été mises à jour il y a moins de 24h
                if (t.completed && t.updatedAt) {
                  const updatedAt = new Date(t.updatedAt);
                  return updatedAt > oneDayAgo;
                }
                // Si pas de updatedAt, garder la tâche (cas de compatibilité)
                return false;
              })
            : [],
        }));
        const focusSubjectId = tutorialSubjectIdRef.current ?? tutorialSubjectId;
        if (focusSubjectId) {
          const targetIndex = normalizedData.findIndex(subject => subject.id === focusSubjectId);
          if (targetIndex > 0) {
            const [targetSubject] = normalizedData.splice(targetIndex, 1);
            normalizedData = [targetSubject, ...normalizedData];
          }
        }
        console.log('📥 [TasksNew] Données normalisées:', normalizedData.map(s => ({
          id: s.id,
          name: s.name,
          tasksCount: s.tasks.length,
          completedCount: s.tasks.filter((t: Task) => t.completed).length,
        })));
        setSubjects(normalizedData);
        // Ouvrir la matière du didacticiel ou la première par défaut
        if (normalizedData.length > 0) {
          const firstSubjectId = normalizedData[0].id;
          const preferredId =
            focusSubjectId && normalizedData.some(subject => subject.id === focusSubjectId)
              ? focusSubjectId
              : firstSubjectId;
          setExpandedSubjects([preferredId]);
        }
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des matières:', error);
      // En cas d'erreur, utiliser les données mockées
      setSubjects(MOCK_SUBJECTS);
      if (MOCK_SUBJECTS.length > 0) {
        setExpandedSubjects([MOCK_SUBJECTS[0].id]);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les matières depuis l'API au montage
  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  // Recharger les données quand on revient du focus mode
  useFocusEffect(
    React.useCallback(() => {
      loadSubjects();
    }, [loadSubjects])
  );

  // Y a-t-il des blocs non faits a rattraper ? Silencieux en cas d'echec :
  // c'est une suggestion, pas une fonction dont depend l'ecran.
  const loadCatchUp = React.useCallback(async () => {
    try {
      const result = await catchUpService.preview();
      if (result?.success) {
        setCatchUpPlan(result.plan);
        setCatchUpCanApply(result.canApply !== false);
      }
    } catch (error) {
      console.warn('[catchUp] apercu indisponible:', error);
    }
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadCatchUp();
    }, [loadCatchUp])
  );

  useFocusEffect(
    React.useCallback(() => {
      refreshTutorialState();
    }, [])
  );

  useEffect(() => {
    if (tutorialStage !== 'task') return;
    const focusSubjectId = tutorialSubjectIdRef.current ?? tutorialSubjectId;
    if (!focusSubjectId) return;
    const y = subjectPositionsRef.current[focusSubjectId];
    if (y == null) return;
    const offset = Math.max(0, y - 120);
    requestAnimationFrame(() => {
      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
    });
  }, [tutorialStage, tutorialSubjectId, subjects]);

  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev =>
      prev.includes(subjectId)
        ? prev.filter(id => id !== subjectId)
        : [...prev, subjectId]
    );
  };

  const toggleTaskDetails = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(id => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleCompleteTask = async (subjectId: string, taskId: string) => {
    // Trouver la tâche pour obtenir son état actuel
    const subject = subjects.find(s => s.id === subjectId);
    const task = subject?.tasks.find(t => t.id === taskId);
    if (!task) return;

    const newCompletedState = !task.completed;

    // Mise à jour optimiste de l'UI
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              tasks: subject.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: newCompletedState }
                  : task
              ),
            }
          : subject
      )
    );

    // Synchroniser avec l'API
    try {
      await tasksService.updateTask(taskId, { completed: newCompletedState });
      console.log('✅ [TasksNew] Tâche mise à jour avec succès');
      
      // Si la tâche est complétée, la retirer de l'affichage après un court délai
      if (newCompletedState) {
        setTimeout(() => {
          setSubjects(prev =>
            prev.map(subject =>
              subject.id === subjectId
                ? {
                    ...subject,
                    tasks: subject.tasks.filter(t => t.id !== taskId),
                  }
                : subject
            )
          );
        }, 2000); // Retirer après 2 secondes
      }
    } catch (error) {
      console.error('❌ [TasksNew] Erreur lors de la mise à jour de la tâche:', error);
      // Annuler la mise à jour locale en cas d'erreur
      setSubjects(prev =>
        prev.map(subject =>
          subject.id === subjectId
            ? {
                ...subject,
                tasks: subject.tasks.map(task =>
                  task.id === taskId
                    ? { ...task, completed: task.completed } // Revenir à l'état précédent
                    : task
                ),
              }
            : subject
        )
      );
      Alert.alert(t('error'), t('updateTaskError'));
    }
  };

  const handleDeleteTask = async (subjectId: string, taskId: string) => {
    Alert.alert(
      t('deleteTask'),
      t('deleteTaskConfirmation'),
      [
        {
          text: t('cancel'),
          style: 'cancel',
        },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              // Mise à jour optimiste : retirer la tâche de l'UI immédiatement
              setSubjects(prev =>
                prev.map(subject =>
                  subject.id === subjectId
                    ? {
                        ...subject,
                        tasks: subject.tasks.filter(t => t.id !== taskId),
                      }
                    : subject
                )
              );

              // Supprimer via l'API
              await tasksService.deleteTask(taskId);
              console.log('✅ [TasksNew] Tâche supprimée avec succès');
            } catch (error: any) {
              console.error('❌ [TasksNew] Erreur lors de la suppression de la tâche:', error);
              // Recharger les données en cas d'erreur
              await loadSubjects();
              Alert.alert(t('error'), t('deleteTaskError'));
            }
          },
        },
      ]
    );
  };

  const handleDeleteSubject = (subjectId: string, subjectName: string) => {
    if (subjectId === 'no-subject') return;
    Alert.alert(
      t('deleteSubject') || 'Supprimer la matière',
      (t('deleteSubjectConfirmation') || 'Êtes-vous sûr de vouloir supprimer « %s » ? Les tâches seront déplacées sans matière.').replace('%s', subjectName),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await subjectsService.delete(subjectId);
              setSubjects(prev => prev.filter(s => s.id !== subjectId));
              await loadSubjects();
            } catch (error: any) {
              console.error('[TasksNew] Erreur suppression matière:', error);
              Alert.alert(t('error'), error?.message || (t('deleteSubjectError') || 'Impossible de supprimer la matière'));
            }
          },
        },
      ]
    );
  };

  const handleStartFocus = (task: Task, subject: Subject) => {
    router.push({
      pathname: '/focus',
      params: {
        taskId: task.id,
        title: task.title,
        subject: subject.name,
        duration: task.estimatedTime,
      },
    });
  };

  const handlePickImage = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('photoAccessPermission')
        );
        return;
      }

      // Ouvrir le sélecteur d'image avec une qualité réduite pour optimiser la vitesse
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Réduire la qualité pour accélérer le traitement
      });

      if (!result.canceled && result.assets[0]) {
        await handleAnalyzeImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Erreur sélection image:', error);
      Alert.alert(t('error'), t('selectImageError'));
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          t('permissionRequired'),
          t('cameraAccessPermission')
        );
        return;
      }

      // Ouvrir l'appareil photo avec une qualité réduite pour optimiser la vitesse
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.6, // Réduire la qualité pour accélérer le traitement
      });

      if (!result.canceled && result.assets[0]) {
        await handleAnalyzeImage(result.assets[0].uri);
      }
    } catch (error: any) {
      console.error('Erreur prise photo:', error);
      Alert.alert(t('error'), t('takePhotoError'));
    }
  };

  const handleAnalyzeImage = async (imageUri: string) => {
    try {
      setAnalyzingImage(true);
      setShowImagePickerOptions(false);

      // Analyser l'image avec un timeout plus long
      const result = await Promise.race([
        subjectsService.analyzeImage(imageUri),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('L\'analyse prend trop de temps. Veuillez réessayer avec une image plus claire.')), 55000)
        )
      ]) as any;

      if (!result.success || !result.subjects || result.subjects.length === 0) {
        Alert.alert(
          t('noSubjectsFound'),
          t('noSubjectsExtractedFromImage')
        );
        return;
      }

      // Afficher un message de confirmation
      const message = t('subjectsFound', { count: result.validCount });
      
      Alert.alert(
        t('subjectsFoundTitle'),
        message,
        [
          {
            text: t('cancel'),
            style: 'cancel',
          },
          {
            text: t('create'),
            onPress: async () => {
              await createSubjectsFromAnalysis(result.subjects);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur analyse image:', error);
      
      let errorMessage = t('analyzeImageError');
      
      if (error.message?.includes('504') || error.message?.includes('timeout') || error.message?.includes('trop de temps')) {
        errorMessage = t('analysisTakesTooLong');
      } else if (error.message?.includes('Non authentifié') || error.message?.includes('401')) {
        errorMessage = t('mustBeLoggedInToAnalyze');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handlePlanWeek = async () => {
    try {
      setPlanningWeek(true);

      // Générer le plan
      const result = await weeklyPlanningService.generatePlan();
      
      if (result.success && result.plan) {
        setWeeklyPlan(result.plan);
        setShowPlanPreview(true);
      } else {
        Alert.alert(t('error'), t('generatePlanError'));
      }
    } catch (error: any) {
      console.error('Erreur planification:', error);
      let errorMessage = t('planWeekError');
      
      if (error.message?.includes('Google Calendar non connecté')) {
        errorMessage = t('connectGoogleCalendarForPlanning');
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      Alert.alert('Erreur', errorMessage);
    } finally {
      setPlanningWeek(false);
    }
  };

  const handleApplyPlan = async () => {
    try {
      setPlanningWeek(true);
      
      const result = await weeklyPlanningService.applyPlan();
      
      if (result.success) {
        Alert.alert(
          t('success'),
          result.message || t('sessionsCreatedInCalendar', { count: result.eventsCreated }),
          [
            {
              text: 'OK',
              onPress: () => {
                setShowPlanPreview(false);
                setWeeklyPlan(null);
                loadSubjects(); // Recharger pour voir les mises à jour
              },
            },
          ]
        );
      } else {
        Alert.alert(t('error'), t('applyPlanError'));
      }
    } catch (error: any) {
      console.error('Erreur application plan:', error);
      Alert.alert(t('error'), error.message || t('applyPlanError'));
    } finally {
      setPlanningWeek(false);
    }
  };

  // Les noms de jours suivent la langue de l'app : c'est ce qui rend la
  // redistribution lisible d'un coup d'oeil ("jeu" -> "sam").
  const dateLocale = language === 'fr' ? fr : language === 'es' ? es : enUS;
  const formatDay = (iso: string) => format(new Date(iso), 'EEE d MMM', { locale: dateLocale });
  // Construit ici plutot que dans la traduction : "2h05" au lieu de "2h5".
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    if (hours === 0) return `${rest} min`;
    if (rest === 0) return `${hours}h`;
    return `${hours}h${String(rest).padStart(2, '0')}`;
  };

  // Changer le jour de travail d'une tache existante. L'app n'avait aucun moyen
  // d'editer une tache, donc le message "a deplacer a la main si besoin" du
  // rattrapage donnait un conseil impossible a suivre.
  const openDayEditor = (task: Task) => {
    Keyboard.dismiss();
    setEditingDayDraft(task.scheduledFor ? new Date(task.scheduledFor) : new Date());
    setEditingDayTask({ id: task.id, title: task.title });
  };

  const saveTaskDay = async (day: Date | null) => {
    if (!editingDayTask) return;
    try {
      setSavingDay(true);
      await tasksService.updateTask(editingDayTask.id, {
        scheduledFor: day ? day.toISOString() : null,
      });
      setEditingDayTask(null);
      await Promise.all([loadSubjects(), loadCatchUp()]);
    } catch (error: any) {
      console.error('Erreur changement de jour:', error);
      Alert.alert(t('error'), error?.message || t('taskDayUpdateError'));
    } finally {
      setSavingDay(false);
    }
  };

  const handleApplyCatchUp = async () => {
    // Le gratuit voit la redistribution mais ne l'applique pas : c'est le
    // moment ou la valeur est deja demontree a l'ecran.
    if (!catchUpCanApply) {
      await triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
        params: { source: 'tasks_catch_up' },
      });
      return;
    }

    try {
      setApplyingCatchUp(true);
      const result = await catchUpService.apply();

      if (result.success) {
        setShowCatchUpPreview(false);
        setCatchUpPlan(null);
        await Promise.all([loadSubjects(), loadCatchUp()]);
        Alert.alert(t('success'), result.message);
      } else {
        Alert.alert(t('error'), t('catchUpError'));
      }
    } catch (error: any) {
      console.error('Erreur rattrapage:', error);
      // 403 = plan gratuit. On rouvre le paywall au lieu d'afficher une erreur.
      if (typeof error?.message === 'string' && error.message.includes('premium')) {
        setCatchUpCanApply(false);
        await triggerEvent(SUPERWALL_EVENTS.FEATURE_LOCKED, {
          params: { source: 'tasks_catch_up' },
        });
      } else {
        Alert.alert(t('error'), error?.message || t('catchUpError'));
      }
    } finally {
      setApplyingCatchUp(false);
    }
  };

  const createSubjectsFromAnalysis = async (subjectsToCreate: { name: string; coefficient: number; ue?: string | null }[]) => {
    try {
      setSaving(true);
      const createdSubjects: Subject[] = [];

      for (const subjectData of subjectsToCreate) {
        try {
          // L'API accepte les coefficients 1-6
          const coeff = Math.min(6, Math.max(1, subjectData.coefficient));
          const newSubject = await subjectsService.create({
            name: subjectData.name,
            coefficient: coeff,
            deadline: null,
          });
          createdSubjects.push(newSubject);
        } catch (error: any) {
          console.error(`Erreur création matière ${subjectData.name}:`, error);
          // Continuer avec les autres matières même si une échoue
        }
      }

      if (createdSubjects.length > 0) {
        // Recharger les matières
        await loadSubjects();
        
        // Ouvrir les nouvelles matières
        setExpandedSubjects([...expandedSubjects, ...createdSubjects.map(s => s.id)]);
        
        Alert.alert(
          t('success'),
          t('subjectsCreatedSuccessfully', { count: createdSubjects.length })
        );
      } else {
        Alert.alert(
          t('error'),
          t('noSubjectsCreated')
        );
      }
    } catch (error: any) {
      console.error('Erreur création matières:', error);
      Alert.alert(t('error'), t('createSubjectsError'));
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert(t('error'), t('enterSubjectName'));
      return;
    }

    // Vérifier l'authentification avant de continuer
    const { getAuthToken } = await import('@/lib/api');
    const token = await getAuthToken();
    if (!token) {
      Alert.alert(
        t('authenticationRequired'),
        t('mustBeLoggedInToAddSubject')
      );
      return;
    }

    try {
      setSaving(true);
      const subjectData = {
        name: newSubjectName.trim(),
        coefficient: newSubjectCoeff,
        deadline: newSubjectDeadline ? newSubjectDeadline.toISOString() : null,
      };

      console.log('📤 [TasksNew] Création matière - Données:', subjectData);
      console.log('🔑 [TasksNew] Token présent:', !!token);
      
      const newSubject = await subjectsService.create(subjectData);
      
      console.log('✅ [TasksNew] Matière créée avec succès:', newSubject);
      tutorialSubjectIdRef.current = newSubject.id;
      setTutorialSubjectId(newSubject.id);
      // Ajouter la nouvelle matière en tête de liste
      setSubjects(prev => [newSubject, ...prev.filter(subject => subject.id !== newSubject.id)]);
      // Ouvrir automatiquement la nouvelle matière
      setExpandedSubjects(prev => Array.from(new Set([newSubject.id, ...prev])));
      // Remonter en haut pour rendre la nouvelle matière visible
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
      
      // Réinitialiser le formulaire
      setNewSubjectName('');
      setNewSubjectCoeff(1);
      setNewSubjectDeadline(null);
      setShowAddSubjectModal(false);
      
      // Recharger les matières depuis l'API pour s'assurer d'avoir les dernières données
      await loadSubjects();

      if (tutorialStage === 'subjects') {
        await setTutorialStage('task');
        setTutorialStageState('task');
      }
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Erreur inconnue';
      
      console.error('[TasksNew] Erreur lors de lajout de la matière:', errorMessage);
      console.error('[TasksNew] Type d erreur:', error?.constructor?.name);
      console.error('[TasksNew] Stack:', error?.stack);
      
      let userFriendlyMessage = t('addSubjectError');
      
      if (errorMessage.includes('Non authentifié') || errorMessage.includes('401')) {
        userFriendlyMessage = t('mustBeLoggedInToAddSubject');
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = t('requestTimeout');
      } else if (errorMessage.includes('Endpoint non trouvé') || errorMessage.includes('404') || errorMessage.includes('pas encore déployé')) {
        userFriendlyMessage = t('featureDeploying');
      } else if (errorMessage.includes('Erreur de réseau') || errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        userFriendlyMessage = t('connectionError');
      } else if (errorMessage && errorMessage.length < 150) {
        userFriendlyMessage = errorMessage;
      }
      
      Alert.alert('Erreur', userFriendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    const localeMap: Record<string, string> = {
      'fr': 'fr-FR',
      'en': 'en-US',
      'es': 'es-ES',
    };
    return date.toLocaleDateString(localeMap[language] || 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert(t('error'), t('enterTaskTitle'));
      return;
    }

    if (!selectedSubjectForTask || selectedSubjectForTask === 'no-subject') {
      Alert.alert(t('error'), t('noSubjectSelected'));
      return;
    }

    try {
      setCreatingTask(true);
      const fireUserFirstAction = await shouldTriggerUserFirstAction();
      const selectedSubject = subjects.find(s => s.id === selectedSubjectForTask);
      
      // Vérifier que la matière existe vraiment (pas une matière virtuelle)
      if (!selectedSubject || selectedSubjectForTask === 'no-subject') {
        Alert.alert(t('error'), 'Veuillez sélectionner une matière valide');
        return;
      }
      
      // Convertir la priorité en format API (high=4, medium=3, low=2)
      const priorityMap: Record<'high' | 'medium' | 'low', number> = {
        high: 4,
        medium: 3,
        low: 2,
      };

      const taskData = {
        title: newTaskTitle.trim(),
        description: null, // Utiliser null au lieu de undefined pour l'API
        estimatedMinutes: newTaskEstimatedTime,
        priority: priorityMap[newTaskPriority],
        subjectId: selectedSubjectForTask, // Sera validé côté serveur
        // Jour de travail optionnel. Envoye seulement s'il est renseigne.
        ...(newTaskScheduledFor ? { scheduledFor: newTaskScheduledFor.toISOString() } : {}),
        // Ne pas envoyer 'subject' car ce n'est pas un champ de la base de données
      };

      console.log('📤 [TasksNew] Création tâche - Données:', taskData);
      
      const newTask = await tasksService.create(taskData);
      
      console.log('✅ [TasksNew] Tâche créée avec succès:', newTask);

      if (fireUserFirstAction) {
        await triggerEvent(SUPERWALL_EVENTS.USER_FIRST_ACTION, {
          params: { source: 'tasks_new_first_creation' },
          requireNonPremium: false,
          bypassCooldown: true,
        });
        await markUserFirstActionTriggered();
      }

      // Recharger les matières pour afficher la nouvelle tâche
      await loadSubjects();
      // Une tache posee sur un jour passe change l'etat du rattrapage
      await loadCatchUp();
      
      // Réinitialiser le formulaire
      setNewTaskTitle('');
      setNewTaskScheduledFor(null);
      setShowTaskDatePicker(false);
      setTaskDateDraft(null);
      setNewTaskEstimatedTime(30);
      setNewTaskPriority('medium');
      setShowAddTaskModal(false);
      setSelectedSubjectForTask(null);
      
      Alert.alert(t('success'), t('taskAddedSuccessfully'));

      if (tutorialStage === 'task') {
        await setTutorialStage('plan');
        setTutorialStageState('plan');
        router.push('/plan-my-day');
      }
    } catch (error: any) {
      console.error('[TasksNew] Erreur complète:', error);
      console.error('[TasksNew] Type d\'erreur:', typeof error);
      console.error('[TasksNew] Erreur status:', error?.status);
      console.error('[TasksNew] Erreur errorData:', error?.errorData);
      
      // Extraire le message d'erreur détaillé
      let errorMessage = 'Erreur inconnue';
      if (error?.errorData?.error) {
        errorMessage = error.errorData.error;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.error) {
        errorMessage = error.error;
      }
      
      console.error('[TasksNew] Erreur lors de lajout de la tâche:', errorMessage);
      
      // Afficher un message d'erreur plus spécifique
      const displayMessage = errorMessage.includes('réseau') || errorMessage.includes('network')
        ? t('connectionError')
        : errorMessage.includes('matière') || errorMessage.includes('subject')
        ? errorMessage
        : errorMessage.length > 100
        ? t('addTaskError')
        : errorMessage;
      
      Alert.alert(t('error'), displayMessage);
    } finally {
      setCreatingTask(false);
    }
  };

  useEffect(() => {
    if (!showAddTaskModal) return;
    if (selectedSubjectForTask) return;
    if (tutorialStage !== 'task') return;
    const fallbackSubjectId =
      tutorialSubjectId ?? subjects.find(subject => subject.id !== 'no-subject')?.id ?? null;
    if (fallbackSubjectId) {
      setSelectedSubjectForTask(fallbackSubjectId);
    }
  }, [showAddTaskModal, selectedSubjectForTask, tutorialStage, tutorialSubjectId, subjects]);

  const totalTasks = subjects.reduce((acc, s) => {
    const tasks = Array.isArray(s.tasks) ? s.tasks : [];
    return acc + tasks.length;
  }, 0);
  const completedTasks = subjects.reduce(
    (acc, s) => {
      const tasks = Array.isArray(s.tasks) ? s.tasks : [];
      return acc + tasks.filter((t: Task) => t.completed).length;
    },
    0
  );

  // Palier de couleur par chapitre, calculé sur l'ensemble des matières et non
  // matière par matière : l'utilisateur veut savoir par quoi commencer ce soir,
  // pas quel chapitre est le plus urgent à l'intérieur d'une matière déjà
  // secondaire. Même fonction de score que le tri du Mode Examen.
  const priorityTiers = React.useMemo(() => {
    const scored: Array<{ id: string; score: number }> = [];

    for (const subject of subjects) {
      if (subject.id === 'no-subject') continue;
      const subjectTasks = Array.isArray(subject.tasks) ? subject.tasks : [];

      for (const task of subjectTasks) {
        if (task.completed) continue;
        scored.push({
          id: task.id,
          score: calculatePriorityScore(task, {
            coefficient: subject.coefficient,
            deadline: subject.deadline ?? null,
          }),
        });
      }
    }

    return assignPriorityTiers(scored);
  }, [subjects]);

  const getTierLabel = (tier: PriorityTier) => {
    switch (tier) {
      case 'critical':
        return t('tierCritical');
      case 'important':
        return t('tierImportant');
      default:
        return t('tierLater');
    }
  };

  const handleBulkImport = async () => {
    if (!selectedSubjectForBulk || selectedSubjectForBulk === 'no-subject') {
      Alert.alert(t('error'), t('noSubjectSelected'));
      return;
    }

    const titles = bulkImportText
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    if (titles.length === 0) {
      Alert.alert(t('error'), t('bulkImportEmpty'));
      return;
    }

    try {
      setImportingChapters(true);
      const fireUserFirstAction = await shouldTriggerUserFirstAction();

      const result = await subjectsService.bulkAddTasks(selectedSubjectForBulk, titles);

      if (fireUserFirstAction && result.createdCount > 0) {
        await triggerEvent(SUPERWALL_EVENTS.USER_FIRST_ACTION, {
          params: { source: 'tasks_new_bulk_import' },
          requireNonPremium: false,
          bypassCooldown: true,
        });
        await markUserFirstActionTriggered();
      }

      await loadSubjects();

      setBulkImportText('');
      setShowBulkImportModal(false);
      setSelectedSubjectForBulk(null);

      // Les doublons sont ignorés en silence côté serveur : sans ce message,
      // un import rejoué donnerait l'impression que rien ne s'est passé.
      const message =
        result.skippedCount > 0
          ? `${result.createdCount} ${t('chaptersImported')} · ${result.skippedCount} ${t('chaptersSkipped')}`
          : `${result.createdCount} ${t('chaptersImported')}`;

      Alert.alert(t('success'), message);
    } catch (error: any) {
      const errorMessage =
        error?.errorData?.error || error?.message || t('bulkImportError');
      console.error('[TasksNew] Erreur import en masse:', error);
      Alert.alert(t('error'), errorMessage);
    } finally {
      setImportingChapters(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#000000';
      case 'medium':
        return 'rgba(0, 0, 0, 0.7)';
      case 'low':
        return 'rgba(0, 0, 0, 0.5)';
      default:
        return 'rgba(0, 0, 0, 0.6)';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high':
        return t('highImpact');
      case 'medium':
        return t('medium');
      case 'low':
        return t('low');
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>{t('loadingSubjects')}</Text>
      </View>
    );
  }

  const firstRealSubjectId = subjects.find(subject => subject.id !== 'no-subject')?.id ?? null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('yourTasks')}</Text>
            <Text style={styles.headerSubtitle}>{t('organizedBySubjectAndImpact')}</Text>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {t('tasksCompleted', { completed: completedTasks, total: totalTasks })}
            </Text>
          </View>

          {/* Add Subject Buttons */}
          <View style={styles.addSubjectButtonsContainer}>
            {tutorialStage === 'subjects' ? (
              <TouchableOpacity
                ref={addSubjectButtonRef}
                style={styles.addSubjectButton}
                onPress={() => setShowAddSubjectModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
                <Text style={styles.addSubjectText}>{t('addSubject')}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.addSubjectButton}
                onPress={() => setShowAddSubjectModal(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
                <Text style={styles.addSubjectText}>{t('addSubject')}</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[styles.addSubjectButton, styles.addSubjectButtonImage]}
              onPress={() => setShowImagePickerOptions(true)}
              activeOpacity={0.8}
              disabled={analyzingImage}
            >
              {analyzingImage ? (
                <ActivityIndicator size="small" color="#16A34A" />
              ) : (
                <Ionicons name="camera-outline" size={20} color="#16A34A" />
              )}
              <Text style={styles.addSubjectText}>
                {analyzingImage ? t('analyzing') : t('createFromImage')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Plan My Week Button */}
          {subjects.length > 0 && (
            <TouchableOpacity
              style={styles.planWeekButton}
              onPress={handlePlanWeek}
              activeOpacity={0.8}
              disabled={planningWeek}
            >
              {planningWeek ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="calendar-outline" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.planWeekText}>
                {planningWeek ? t('planningInProgress') : t('planMyWeek')}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

        {/* Rattrapage : visible seulement s'il y a vraiment des blocs en retard */}
        {catchUpPlan && catchUpPlan.moves.length > 0 && (
          <Animated.View entering={FadeInDown.delay(150).duration(400)}>
            <TouchableOpacity
              style={styles.catchUpBanner}
              onPress={() => setShowCatchUpPreview(true)}
              activeOpacity={0.85}
            >
              <View style={styles.catchUpBannerIcon}>
                <Ionicons name="refresh-outline" size={20} color="#B45309" />
              </View>
              <View style={styles.catchUpBannerContent}>
                <Text style={styles.catchUpBannerTitle}>
                  {catchUpPlan.moves.length === 1
                    ? t('catchUpBannerTitleOne')
                    : t('catchUpBannerTitle', { count: catchUpPlan.moves.length })}
                </Text>
                <Text style={styles.catchUpBannerSubtitle}>{t('catchUpBannerSubtitle')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#B45309" />
            </TouchableOpacity>
          </Animated.View>
        )}

          {/* Subjects list */}
          <View style={styles.subjectsContainer}>
            {subjects.map((subject, index) => {
            const isExpanded = expandedSubjects.includes(subject.id);
            // S'assurer que tasks est un tableau
            const tasks = Array.isArray(subject.tasks) ? subject.tasks : [];
            const completedCount = tasks.filter(t => t.completed).length;
            const totalCount = tasks.length;
            // Calculer dynamiquement le progress basé sur les tâches complétées
            const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

            return (
              <Animated.View
                key={subject.id}
                entering={FadeInDown.delay(200 + index * 50).duration(400)}
                style={styles.subjectCard}
                onLayout={(event) => {
                  subjectPositionsRef.current[subject.id] = event.nativeEvent.layout.y;
                  const focusSubjectId = tutorialSubjectIdRef.current ?? tutorialSubjectId;
                  if (tutorialStage === 'task' && focusSubjectId === subject.id) {
                    const offset = Math.max(0, event.nativeEvent.layout.y - 120);
                    requestAnimationFrame(() => {
                      scrollViewRef.current?.scrollTo({ y: offset, animated: true });
                    });
                  }
                }}
              >
                {/* Subject header */}
                <TouchableOpacity
                  style={styles.subjectHeader}
                  onPress={() => toggleSubject(subject.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.subjectHeaderContent}>
                    <View style={styles.subjectTitleRow}>
                      <Text style={styles.subjectTitle}>{subject.name}</Text>
                      <Text style={styles.subjectCoeff}>Coef {subject.coefficient}</Text>
                    </View>

                    {subject.impact === 'high' && (
                      <Text style={styles.highImpactLabel}>{t('highImpactOnFinalGrade')}</Text>
                    )}

                    {subject.nextDeadline && (
                      <Text style={styles.deadlineText}>{subject.nextDeadline}</Text>
                    )}

                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>
                          {completedCount}/{totalCount} {t('tasks')}
                        </Text>
                        <Text style={styles.progressLabel}>{calculatedProgress}%</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${calculatedProgress}%`,
                              backgroundColor: subject.impact === 'high' ? '#16A34A' : 'rgba(0, 0, 0, 0.2)',
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </View>

                  <View style={styles.subjectHeaderActions}>
                    {subject.id !== 'no-subject' && (
                      <TouchableOpacity
                        style={styles.deleteSubjectButton}
                        onPress={() => handleDeleteSubject(subject.id, subject.name)}
                        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                      >
                        <Ionicons name="trash-outline" size={20} color="#EF4444" />
                      </TouchableOpacity>
                    )}
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color="rgba(0, 0, 0, 0.4)"
                    />
                  </View>
                </TouchableOpacity>

                {/* Subject content - expanded */}
                {isExpanded && (
                  <View style={styles.subjectContent}>
                    {/* AI Insight */}
                    {subject.insight && (
                      <View style={styles.insightCard}>
                        <Text style={styles.insightText}>{subject.insight}</Text>
                      </View>
                    )}

                    {/* Tasks list */}
                    <View style={styles.tasksList}>
                      {tasks.map((task, taskIndex) => {
                        const isTaskExpanded = expandedTasks.includes(task.id);
                        const tier = priorityTiers.get(task.id);

                        return (
                          <View
                            key={task.id}
                            style={[
                              styles.taskCard,
                              task.completed && styles.taskCardCompleted,
                              !task.completed && tier
                                ? {
                                    borderLeftWidth: 4,
                                    borderLeftColor: TIER_COLORS[tier],
                                  }
                                : null,
                            ]}
                          >
                            <View style={styles.taskHeader}>
                              {/* Checkbox */}
                              <TouchableOpacity
                                style={[
                                  styles.taskCheckbox,
                                  task.completed && styles.taskCheckboxCompleted,
                                ]}
                                onPress={() => handleCompleteTask(subject.id, task.id)}
                                activeOpacity={0.7}
                              >
                                {task.completed && (
                                  <View style={styles.taskCheckmark} />
                                )}
                              </TouchableOpacity>

                              {/* Task info */}
                              <View style={styles.taskInfo}>
                                <Text
                                  style={[
                                    styles.taskTitle,
                                    task.completed && styles.taskTitleCompleted,
                                  ]}
                                >
                                  {task.title}
                                </Text>

                                <View style={styles.taskMeta}>
                                  <View style={styles.taskTime}>
                                    <Ionicons name="time-outline" size={14} color="rgba(0, 0, 0, 0.6)" />
                                    <Text style={styles.taskTimeText}>{task.estimatedTime} min</Text>
                                  </View>
                                  {!task.completed && tier ? (
                                    <Text style={[styles.taskPriority, { color: TIER_COLORS[tier] }]}>
                                      {getTierLabel(tier)}
                                    </Text>
                                  ) : (
                                    <Text style={[styles.taskPriority, { color: getPriorityColor(task.priority) }]}>
                                      {getPriorityLabel(task.priority)}
                                    </Text>
                                  )}

                                  {/* Jour de travail : seul point d'edition d'une
                                      tache. Place ici et non dans taskActions,
                                      ou il volait la largeur du bouton focus. */}
                                  {!task.completed && (
                                    <TouchableOpacity
                                      style={styles.taskDayChip}
                                      onPress={() => openDayEditor(task)}
                                      activeOpacity={0.7}
                                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                    >
                                      <Ionicons
                                        name="calendar-outline"
                                        size={13}
                                        color={task.scheduledFor ? '#B45309' : 'rgba(0, 0, 0, 0.45)'}
                                      />
                                      <Text
                                        style={[
                                          styles.taskDayChipText,
                                          task.scheduledFor && styles.taskDayChipTextSet,
                                        ]}
                                        numberOfLines={1}
                                      >
                                        {task.scheduledFor
                                          ? format(new Date(task.scheduledFor), 'EEE d MMM', {
                                              locale: dateLocale,
                                            })
                                          : t('taskSetDay')}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </View>

                              {/* Expand details */}
                              {task.details && (
                                <TouchableOpacity
                                  style={styles.expandButton}
                                  onPress={() => toggleTaskDetails(task.id)}
                                  activeOpacity={0.7}
                                >
                                  <Ionicons
                                    name={isTaskExpanded ? 'chevron-down' : 'chevron-forward'}
                                    size={16}
                                    color="rgba(0, 0, 0, 0.4)"
                                  />
                                </TouchableOpacity>
                              )}
                            </View>

                            {/* Task details - expanded */}
                            {isTaskExpanded && task.details && (
                              <View style={styles.taskDetails}>
                                <Text style={styles.taskDetailsText}>{task.details}</Text>
                              </View>
                            )}

                            {/* Task actions */}
                            <View style={styles.taskActions}>
                              {!task.completed && (
                                <TouchableOpacity
                                  style={styles.startFocusButton}
                                  onPress={() => handleStartFocus(task, subject)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.startFocusText}>{t('startFocusSession')}</Text>
                                </TouchableOpacity>
                              )}
                              
                              {/* Delete button */}
                              <TouchableOpacity
                                style={styles.deleteTaskButton}
                                onPress={() => handleDeleteTask(subject.id, task.id)}
                                activeOpacity={0.7}
                              >
                                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        );
                      })}
                    </View>

                    {/* Add task button - Désactivé pour la matière virtuelle "no-subject" */}
                    {tutorialStage === 'task' &&
                    (((tutorialSubjectIdRef.current ?? tutorialSubjectId) &&
                      subject.id === (tutorialSubjectIdRef.current ?? tutorialSubjectId)) ||
                      (!(tutorialSubjectIdRef.current ?? tutorialSubjectId) &&
                        subject.id === firstRealSubjectId)) ? (
                      <TouchableOpacity
                        ref={addTaskButtonRef}
                        style={[
                          styles.addTaskButton,
                          subject.id === 'no-subject' && styles.addTaskButtonDisabled
                        ]}
                        onPress={() => {
                          if (subject.id === 'no-subject') {
                            Alert.alert(
                              t('error'),
                              'Impossible d\'ajouter une tâche dans "Autres tâches". Veuillez créer une matière d\'abord.'
                            );
                            return;
                          }
                          setSelectedSubjectForTask(subject.id);
                          setShowAddTaskModal(true);
                        }}
                        activeOpacity={0.8}
                        disabled={subject.id === 'no-subject'}
                      >
                        <View style={styles.addTaskIconContainer}>
                          <Ionicons name="add" size={16} color="rgba(0, 0, 0, 0.4)" />
                        </View>
                        <Text style={styles.addTaskText}>{t('addTask')}</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[
                          styles.addTaskButton,
                          subject.id === 'no-subject' && styles.addTaskButtonDisabled
                        ]}
                        onPress={() => {
                          if (subject.id === 'no-subject') {
                            Alert.alert(
                              t('error'),
                              'Impossible d\'ajouter une tâche dans "Autres tâches". Veuillez créer une matière d\'abord.'
                            );
                            return;
                          }
                          setSelectedSubjectForTask(subject.id);
                          setShowAddTaskModal(true);
                        }}
                        activeOpacity={0.8}
                        disabled={subject.id === 'no-subject'}
                      >
                        <View style={styles.addTaskIconContainer}>
                          <Ionicons name="add" size={16} color="rgba(0, 0, 0, 0.4)" />
                        </View>
                        <Text style={styles.addTaskText}>{t('addTask')}</Text>
                      </TouchableOpacity>
                    )}

                    {subject.id !== 'no-subject' && (
                      <TouchableOpacity
                        style={styles.bulkImportButton}
                        onPress={() => {
                          setSelectedSubjectForBulk(subject.id);
                          setShowBulkImportModal(true);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.addTaskIconContainer}>
                          <Ionicons name="list-outline" size={16} color="rgba(0, 0, 0, 0.4)" />
                        </View>
                        <Text style={styles.addTaskText}>{t('importChapters')}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      <Coachmark
        visible={!tutorialCompleted && tutorialStage === 'subjects'}
        targetRef={addSubjectButtonRef}
        text="Ajoute une matiere avec son coef."
        nextLabel="Ajouter"
        onNext={() => setShowAddSubjectModal(true)}
        onSkip={async () => {
          const hasRealSubject = subjects.some(subject => subject.id !== 'no-subject');
          if (hasRealSubject) {
            await setTutorialCompleted(false);
            await setTutorialStage('task');
            setTutorialCompletedState(false);
            setTutorialStageState('task');
          } else {
            await setTutorialCompleted(false);
            await setTutorialStage('plan');
            setTutorialCompletedState(false);
            setTutorialStageState('plan');
            router.push('/plan-my-day');
          }
        }}
      />

      <Coachmark
        visible={!tutorialCompleted && tutorialStage === 'task'}
        targetRef={addTaskButtonRef}
        text="Ajoute une tache de test dans ta matiere."
        nextLabel="Ajouter"
        onNext={() => {
          const fallbackSubjectId =
            tutorialSubjectIdRef.current ??
            tutorialSubjectId ??
            subjects.find(subject => subject.id !== 'no-subject')?.id ??
            null;
          if (fallbackSubjectId) {
            setSelectedSubjectForTask(fallbackSubjectId);
          }
          setShowAddTaskModal(true);
        }}
        onSkip={async () => {
          await setTutorialCompleted(false);
          await setTutorialStage('plan');
          setTutorialCompletedState(false);
          setTutorialStageState('plan');
          router.push('/plan-my-day');
        }}
      />

      {/* Image Picker Options Modal */}
      <Modal
        visible={showImagePickerOptions}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImagePickerOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('createSubjectsFromImage')}</Text>
              <TouchableOpacity
                onPress={() => setShowImagePickerOptions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerOptions}>
              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={handleTakePhoto}
                activeOpacity={0.7}
              >
                <View style={styles.imagePickerIconContainer}>
                  <Ionicons name="camera" size={32} color="#16A34A" />
                </View>
                <Text style={styles.imagePickerOptionText}>Prendre une photo</Text>
                <Text style={styles.imagePickerOptionSubtext}>
                  Photographiez votre liste de matières
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.imagePickerOption}
                onPress={handlePickImage}
                activeOpacity={0.7}
              >
                <View style={styles.imagePickerIconContainer}>
                  <Ionicons name="images" size={32} color="#16A34A" />
                </View>
                <Text style={styles.imagePickerOptionText}>{t('chooseFromGallery')}</Text>
                <Text style={styles.imagePickerOptionSubtext}>
                  {t('selectAnImageFromYourList')}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerHint}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(0, 0, 0, 0.4)" />
              <Text style={styles.imagePickerHintText}>
                {t('aiWillAnalyzeImage')}
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Subject Modal */}
      <Modal
        visible={showAddSubjectModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddSubjectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une matière</Text>
              <TouchableOpacity
                onPress={() => setShowAddSubjectModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {tutorialStage === 'subjects' && (
              <View style={styles.tutorialHintContainer} pointerEvents="none">
                <InlineHint text="Donne un nom et un coef, puis valide." />
              </View>
            )}

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Subject Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('subjectName')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('subjectNamePlaceholder')}
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  autoFocus
                />
              </View>

              {/* Coefficient */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('coefficient')}</Text>
                <Text style={styles.formHint}>{t('coefficientDescription')}</Text>
                <View style={styles.coefficientContainer}>
                  {[1, 2, 3, 4, 5, 6].map((coeff) => (
                    <TouchableOpacity
                      key={coeff}
                      style={[
                        styles.coefficientButton,
                        newSubjectCoeff === coeff && styles.coefficientButtonActive,
                      ]}
                      onPress={() => setNewSubjectCoeff(coeff)}
                    >
                      <Text
                        style={[
                          styles.coefficientText,
                          newSubjectCoeff === coeff && styles.coefficientTextActive,
                        ]}
                      >
                        {coeff}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Deadline */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('deadlineOptional')}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#16A34A" />
                  <Text style={styles.dateButtonText}>
                      {newSubjectDeadline
                        ? formatDate(newSubjectDeadline)
                        : t('selectDate')}
                  </Text>
                  {newSubjectDeadline && (
                    <TouchableOpacity
                      onPress={() => setNewSubjectDeadline(null)}
                      style={styles.clearDateButton}
                    >
                      <Ionicons name="close-circle" size={20} color="rgba(0, 0, 0, 0.4)" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Date Picker */}
              {showDatePicker && (
                <DateTimePicker
                  value={newSubjectDeadline || new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (selectedDate) {
                      setNewSubjectDeadline(selectedDate);
                    }
                  }}
                  minimumDate={new Date()}
                />
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newSubjectName.trim() || saving) && styles.submitButtonDisabled,
                ]}
                onPress={handleAddSubject}
                disabled={!newSubjectName.trim() || saving}
                activeOpacity={0.8}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('addSubject')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Bulk Import Chapters Modal */}
      <Modal
        visible={showBulkImportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBulkImportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{t('importChaptersTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('importChaptersSubtitle')}</Text>
                {selectedSubjectForBulk && (
                  <Text style={styles.modalSubjectName}>
                    {t('forSubject')}{' '}
                    <Text style={styles.modalSubjectNameBold}>
                      {subjects.find(s => s.id === selectedSubjectForBulk)?.name}
                    </Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowBulkImportModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.bulkImportInput}
                  placeholder={t('importChaptersPlaceholder')}
                  value={bulkImportText}
                  onChangeText={setBulkImportText}
                  multiline
                  textAlignVertical="top"
                  autoFocus
                />
                <Text style={styles.formHint}>
                  {bulkImportText.split('\n').filter(line => line.trim()).length}{' '}
                  {t('chaptersDetected')}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!bulkImportText.trim() || importingChapters) && styles.submitButtonDisabled,
                ]}
                onPress={handleBulkImport}
                disabled={!bulkImportText.trim() || importingChapters}
                activeOpacity={0.8}
              >
                {importingChapters ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('importChapters')}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Add Task Modal */}
      <Modal
        visible={showAddTaskModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddTaskModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderContent}>
                <Text style={styles.modalTitle}>{t('addTaskTitle')}</Text>
                <Text style={styles.modalSubtitle}>{t('oneClearTaskEnough')}</Text>
                {selectedSubjectForTask && (
                  <Text style={styles.modalSubjectName}>
                    {t('forSubject')} <Text style={styles.modalSubjectNameBold}>{subjects.find(s => s.id === selectedSubjectForTask)?.name}</Text>
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() => setShowAddTaskModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {tutorialStage === 'task' && (
              <View style={styles.tutorialHintContainer} pointerEvents="none">
                <InlineHint text="Ecris une tache simple puis valide." />
              </View>
            )}

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Task title input */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('taskExample')}
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                  multiline={false}
                />
                <Text style={styles.formHint}>{t('keepSpecific')}</Text>
              </View>

              {/* Estimated effort */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('estimatedEffort')}</Text>
                <View style={styles.effortContainer}>
                  {[15, 30, 45, 60].map((minutes) => (
                    <TouchableOpacity
                      key={minutes}
                      style={[
                        styles.effortButton,
                        newTaskEstimatedTime === minutes && styles.effortButtonActive,
                      ]}
                      onPress={() => setNewTaskEstimatedTime(minutes)}
                    >
                      <Text
                        style={[
                          styles.effortButtonText,
                          newTaskEstimatedTime === minutes && styles.effortButtonTextActive,
                        ]}
                      >
                        {minutes === 60 ? '1h' : `${minutes} min`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('priority')}</Text>
                <View style={styles.priorityContainer}>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      newTaskPriority === 'medium' && styles.priorityButtonActive,
                    ]}
                    onPress={() => setNewTaskPriority('medium')}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        newTaskPriority === 'medium' && styles.priorityButtonTextActive,
                      ]}
                    >
                      {t('priorityNormal')}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.priorityButton,
                      newTaskPriority === 'high' && styles.priorityButtonActive,
                    ]}
                    onPress={() => setNewTaskPriority('high')}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        newTaskPriority === 'high' && styles.priorityButtonTextActive,
                      ]}
                    >
                      {t('priorityImportant')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Jour de travail. Optionnel, mais c'est ce qui alimente le
                  rattrapage : une tache sans jour ne peut pas etre "pas faite". */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>{t('taskScheduledForLabel')}</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => {
                    // Le champ titre a autoFocus, donc le clavier recouvre le bas
                    // de la feuille. Sans ce dismiss, le selecteur s'ouvre derriere.
                    Keyboard.dismiss();
                    setTaskDateDraft(newTaskScheduledFor);
                    setShowTaskDatePicker(true);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={18} color="rgba(0, 0, 0, 0.5)" />
                  <Text
                    style={[
                      styles.dateButtonText,
                      !newTaskScheduledFor && styles.dateButtonTextPlaceholder,
                    ]}
                  >
                    {newTaskScheduledFor
                      ? format(newTaskScheduledFor, 'EEEE d MMMM', { locale: dateLocale })
                      : t('taskScheduledForPlaceholder')}
                  </Text>
                  {newTaskScheduledFor && (
                    <TouchableOpacity
                      onPress={() => setNewTaskScheduledFor(null)}
                      style={styles.clearDateButton}
                    >
                      <Ionicons name="close-circle" size={20} color="rgba(0, 0, 0, 0.4)" />
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              </View>

              {/* Le selecteur de date n'est PAS rendu ici : dans cette feuille
                  ancree en bas, il tomberait derriere le clavier. Il est en
                  surcouche au-dessus du modal, plus bas dans ce fichier. */}

              {/* Submit Button */}
              <TouchableOpacity
                style={[
                  styles.submitButton,
                  (!newTaskTitle.trim() || creatingTask) && styles.submitButtonDisabled,
                ]}
                onPress={handleAddTask}
                disabled={!newTaskTitle.trim() || creatingTask}
                activeOpacity={0.8}
              >
                {creatingTask ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>{t('addTask')}</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.modalFooterText}>{t('youCanAlwaysAdjustLater')}</Text>
            </ScrollView>
          </View>

          {/* Selecteur de jour de travail, en surcouche du modal plutot qu'un
              Modal imbrique : sur iOS l'imbrication de Modal est capricieuse, et
              une surcouche absolue passe forcement au-dessus de la feuille et du
              clavier. Sur Android, DateTimePicker est deja un dialogue natif,
              donc on ne dessine pas de carte autour. */}
          {showTaskDatePicker && Platform.OS === 'ios' && (
            <View style={styles.datePickerOverlay}>
              <View style={styles.datePickerCard}>
                <Text style={styles.datePickerTitle}>{t('taskScheduledForLabel')}</Text>
                <DateTimePicker
                  value={taskDateDraft || new Date()}
                  mode="date"
                  display="spinner"
                  locale={language}
                  themeVariant="light"
                  style={styles.datePickerSpinner}
                  onChange={(event, selectedDate) => {
                    if (selectedDate) setTaskDateDraft(selectedDate);
                  }}
                />
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.datePickerCancel}
                    onPress={() => setShowTaskDatePicker(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.datePickerCancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePickerConfirm}
                    onPress={() => {
                      setNewTaskScheduledFor(taskDateDraft || new Date());
                      setShowTaskDatePicker(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.datePickerConfirmText}>{t('confirm')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {showTaskDatePicker && Platform.OS !== 'ios' && (
            <DateTimePicker
              value={taskDateDraft || new Date()}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowTaskDatePicker(false);
                if (event.type === 'set' && selectedDate) {
                  setNewTaskScheduledFor(selectedDate);
                }
              }}
            />
          )}
        </View>
      </Modal>

      {/* Weekly Plan Preview Modal */}
      <Modal
        visible={showPlanPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPlanPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('weeklyPlan')}</Text>
                <Text style={styles.modalSubtitle}>
                  {weeklyPlan?.summary?.totalSessions || 0} {t('sessions')} • {Math.round((weeklyPlan?.summary?.totalMinutes || 0) / 60)}h
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowPlanPreview(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {weeklyPlan?.sessions && weeklyPlan.sessions.length > 0 ? (
                <>
                  {/* Summary */}
                  <View style={styles.planSummaryCard}>
                    <Text style={styles.planSummaryTitle}>{t('distributionBySubject')}</Text>
                    {Object.entries(weeklyPlan.summary.distribution || {}).map(([subject, minutes]) => (
                      <View key={subject} style={styles.planSummaryRow}>
                        <Text style={styles.planSummarySubject}>{subject}</Text>
                        <Text style={styles.planSummaryTime}>{Math.round(Number(minutes) / 60)}h {Number(minutes) % 60}min</Text>
                      </View>
                    ))}
                  </View>

                  {/* Sessions */}
                  <View style={styles.planSessionsContainer}>
                    <Text style={styles.planSessionsTitle}>{t('plannedSessions')}</Text>
                    {weeklyPlan.sessions.map((session: any, index: number) => (
                      <View key={index} style={styles.planSessionCard}>
                        <View style={styles.planSessionHeader}>
                          <View style={styles.planSessionSubjectBadge}>
                            <Text style={styles.planSessionSubjectText}>{session.subjectName}</Text>
                          </View>
                          <Text style={styles.planSessionTime}>
                            {format(new Date(session.start), 'EEE d MMM')} • {format(new Date(session.start), 'HH:mm')} - {format(new Date(session.end), 'HH:mm')}
                          </Text>
                        </View>
                        <Text style={styles.planSessionDuration}>
                          {Math.floor(session.durationMinutes / 60)}h {session.durationMinutes % 60}min
                        </Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : (
                <View style={styles.planEmptyContainer}>
                  <Text style={styles.planEmptyText}>{t('noSessionsToPlan')}</Text>
                  <Text style={styles.planEmptySubtext}>
                    {t('ensureYouHaveUncompletedTasks')}
                  </Text>
                </View>
              )}
            </ScrollView>

            {/* Actions */}
            {weeklyPlan?.sessions && weeklyPlan.sessions.length > 0 && (
              <View style={styles.planActions}>
                <TouchableOpacity
                  style={styles.planCancelButton}
                  onPress={() => setShowPlanPreview(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.planCancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.planApplyButton}
                  onPress={handleApplyPlan}
                  activeOpacity={0.8}
                  disabled={planningWeek}
                >
                  {planningWeek ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Ionicons name="calendar" size={18} color="#FFFFFF" />
                      <Text style={styles.planApplyText}>{t('applyToCalendar')}</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Rattrapage des blocs non faits */}
      <Modal
        visible={showCatchUpPreview}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCatchUpPreview(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 24, maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{t('catchUpTitle')}</Text>
                <Text style={styles.modalSubtitle}>
                  {t('catchUpSummary', {
                    count: catchUpPlan?.moves.length ?? 0,
                    duration: formatDuration(catchUpPlan?.summary.totalMinutes ?? 0),
                    days: catchUpPlan?.summary.daysUsed ?? 0,
                  })}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowCatchUpPreview(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Ou part chaque bloc */}
              <View style={styles.catchUpSection}>
                <Text style={styles.catchUpSectionTitle}>{t('catchUpMovesTitle')}</Text>
                {catchUpPlan?.moves.map((move) => (
                  <View key={move.taskId} style={styles.catchUpMoveCard}>
                    <View style={styles.catchUpMoveHeader}>
                      <Text style={styles.catchUpMoveTitle} numberOfLines={2}>
                        {move.title}
                      </Text>
                      {move.subjectName && (
                        <View style={styles.catchUpMoveBadge}>
                          <Text style={styles.catchUpMoveBadgeText}>{move.subjectName}</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.catchUpMoveDates}>
                      <Text style={styles.catchUpMoveFrom}>{formatDay(move.from)}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#B45309" />
                      <Text style={styles.catchUpMoveTo}>{formatDay(move.to)}</Text>
                      <Text style={styles.catchUpMoveMinutes}>{move.minutes} min</Text>
                    </View>
                    {move.deadlinePassed && (
                      <Text style={styles.catchUpMoveWarning}>{t('catchUpDeadlinePassed')}</Text>
                    )}
                    {move.overCapacity && !move.deadlinePassed && (
                      <Text style={styles.catchUpMoveWarning}>{t('catchUpOverCapacity')}</Text>
                    )}
                  </View>
                ))}
              </View>

              {/* La charge par jour : c'est ce qui montre que c'est reparti */}
              <View style={styles.catchUpSection}>
                <Text style={styles.catchUpSectionTitle}>{t('catchUpLoadTitle')}</Text>
                {catchUpPlan?.days.map((day) => {
                  const capacity = day.capacityMinutes || 1;
                  const beforeRatio = Math.min(1, day.minutesBefore / capacity);
                  const addedRatio = Math.min(
                    1 - beforeRatio,
                    Math.max(0, day.minutesAfter - day.minutesBefore) / capacity
                  );
                  return (
                    <View key={day.date} style={styles.catchUpDayRow}>
                      <Text style={styles.catchUpDayLabel}>{formatDay(day.date)}</Text>
                      <View style={styles.catchUpDayBarTrack}>
                        <View
                          style={[styles.catchUpDayBarBefore, { flex: beforeRatio }]}
                        />
                        <View
                          style={[styles.catchUpDayBarAdded, { flex: addedRatio }]}
                        />
                        <View style={{ flex: Math.max(0, 1 - beforeRatio - addedRatio) }} />
                      </View>
                      <Text style={styles.catchUpDayMinutes}>{day.minutesAfter} min</Text>
                    </View>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.planActions}>
              <TouchableOpacity
                style={styles.planCancelButton}
                onPress={() => setShowCatchUpPreview(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.planCancelText}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.catchUpApplyButton}
                onPress={handleApplyCatchUp}
                activeOpacity={0.8}
                disabled={applyingCatchUp}
              >
                {applyingCatchUp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={catchUpCanApply ? 'checkmark' : 'lock-closed'}
                      size={18}
                      color="#FFFFFF"
                    />
                    <Text style={styles.planApplyText}>
                      {catchUpCanApply ? t('catchUpApply') : t('catchUpUnlock')}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Changer le jour de travail d'une tache existante */}
      <Modal
        visible={editingDayTask !== null}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setEditingDayTask(null)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerCard}>
            <Text style={styles.datePickerTitle}>{t('taskScheduledForLabel')}</Text>
            <Text style={styles.datePickerSubtitle} numberOfLines={2}>
              {editingDayTask?.title}
            </Text>

            {Platform.OS === 'ios' ? (
              <DateTimePicker
                value={editingDayDraft || new Date()}
                mode="date"
                display="spinner"
                locale={language}
                themeVariant="light"
                style={styles.datePickerSpinner}
                onChange={(event, selectedDate) => {
                  if (selectedDate) setEditingDayDraft(selectedDate);
                }}
              />
            ) : (
              <DateTimePicker
                value={editingDayDraft || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  if (event.type === 'set' && selectedDate) {
                    saveTaskDay(selectedDate);
                  } else {
                    setEditingDayTask(null);
                  }
                }}
              />
            )}

            {Platform.OS === 'ios' && (
              <>
                <View style={styles.datePickerActions}>
                  <TouchableOpacity
                    style={styles.datePickerCancel}
                    onPress={() => setEditingDayTask(null)}
                    activeOpacity={0.7}
                    disabled={savingDay}
                  >
                    <Text style={styles.datePickerCancelText}>{t('cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.datePickerConfirm}
                    onPress={() => saveTaskDay(editingDayDraft || new Date())}
                    activeOpacity={0.8}
                    disabled={savingDay}
                  >
                    {savingDay ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.datePickerConfirmText}>{t('confirm')}</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={styles.datePickerRemove}
                  onPress={() => saveTaskDay(null)}
                  activeOpacity={0.7}
                  disabled={savingDay}
                >
                  <Text style={styles.datePickerRemoveText}>{t('taskDayRemove')}</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    marginBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressInfo: {
    marginTop: 12,
  },
  progressText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  subjectsContainer: {
    gap: 16,
  },
  subjectCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
  },
  subjectHeader: {
    padding: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subjectHeaderContent: {
    flex: 1,
    gap: 12,
  },
  subjectHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteSubjectButton: {
    padding: 8,
  },
  subjectTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 12,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  subjectCoeff: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  highImpactLabel: {
    fontSize: 14,
    color: '#16A34A',
  },
  deadlineText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  progressSection: {
    gap: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  subjectContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    gap: 16,
  },
  insightCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
  },
  insightText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
    lineHeight: 20,
  },
  tasksList: {
    gap: 12,
    marginTop: 16,
  },
  taskCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    gap: 12,
  },
  taskCardCompleted: {
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  taskCheckboxCompleted: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  taskCheckmark: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
  },
  taskInfo: {
    flex: 1,
    gap: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.3,
    color: '#000000',
  },
  taskTitleCompleted: {
    color: 'rgba(0, 0, 0, 0.4)',
    textDecorationLine: 'line-through',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 14,
    rowGap: 8,
  },
  taskTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  taskTimeText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  taskPriority: {
    fontSize: 14,
  },
  expandButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskDetails: {
    paddingLeft: 36,
    paddingTop: 8,
  },
  taskDetailsText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  taskActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    marginLeft: 36,
  },
  startFocusButton: {
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    flex: 1,
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  deleteTaskButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  addSubjectButtonsContainer: {
    marginTop: 16,
    gap: 12,
  },
  tutorialHintContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  tutorialHighlight: {
    borderWidth: 2,
    borderColor: '#16A34A',
    shadowColor: '#16A34A',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  addSubjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  addSubjectButtonImage: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
  },
  addSubjectText: {
    color: '#16A34A',
    fontSize: 16,
    fontWeight: '600',
  },
  imagePickerOptions: {
    padding: 24,
    gap: 16,
  },
  imagePickerOption: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    gap: 12,
  },
  imagePickerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePickerOptionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  imagePickerOptionSubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  imagePickerHint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  imagePickerHintText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
    lineHeight: 18,
  },
  planWeekButton: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#16A34A',
    borderRadius: 16,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  planWeekText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  planSummaryCard: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    marginBottom: 24,
  },
  planSummaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  planSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  planSummarySubject: {
    fontSize: 15,
    color: '#000000',
    fontWeight: '500',
  },
  planSummaryTime: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  planSessionsContainer: {
    gap: 12,
  },
  planSessionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  planSessionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    backgroundColor: '#FFFFFF',
  },
  planSessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planSessionSubjectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  planSessionSubjectText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16A34A',
  },
  planSessionTime: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  planSessionDuration: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  planEmptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planEmptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
  },
  planEmptySubtext: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    textAlign: 'center',
  },
  planActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  planCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  planCancelText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  planApplyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#16A34A',
  },
  planApplyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
    maxHeight: '90%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.5,
    color: '#000000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalScrollView: {
    padding: 24,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  formHint: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 12,
  },
  formInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  bulkImportInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 220,
    backgroundColor: '#FFFFFF',
  },
  coefficientContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 8,
  },
  coefficientButton: {
    width: 60,
    height: 60,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  coefficientButtonActive: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  coefficientText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  coefficientTextActive: {
    color: '#16A34A',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  dateButtonText: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  clearDateButton: {
    marginLeft: 'auto',
  },
  dateButtonTextPlaceholder: {
    color: 'rgba(0, 0, 0, 0.35)',
  },
  // Surcouche du selecteur de jour : couvre toute la zone du modal, donc passe
  // au-dessus de la feuille ancree en bas et du clavier.
  datePickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  datePickerCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  datePickerSubtitle: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.5)',
    textAlign: 'center',
    marginBottom: 4,
  },
  datePickerRemove: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 4,
  },
  datePickerRemoveText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  taskDayChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 9,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  taskDayChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.5)',
  },
  taskDayChipTextSet: {
    color: '#B45309',
    fontWeight: '600',
  },
  datePickerSpinner: {
    alignSelf: 'stretch',
    height: 200,
  },
  datePickerActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  datePickerCancel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  datePickerCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.6)',
  },
  datePickerConfirm: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#16A34A',
  },
  datePickerConfirmText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addTaskButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    backgroundColor: 'transparent',
  },
  addTaskButtonDisabled: {
    opacity: 0.5,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  bulkImportButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  addTaskIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addTaskText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  modalHeaderContent: {
    flex: 1,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginTop: 4,
  },
  modalSubjectName: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginTop: 8,
  },
  modalSubjectNameBold: {
    fontWeight: '600',
    color: '#000000',
  },
  effortContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  effortButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  effortButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  effortButtonText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  effortButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  priorityContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: '#000000',
    borderColor: '#000000',
  },
  priorityButtonText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  priorityButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  modalFooterText: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.3)',
    textAlign: 'center',
    marginTop: 8,
  },

  // Rattrapage des blocs non faits. Ambre volontairement : ni le vert des
  // actions normales, ni un rouge d'erreur. C'est un rappel, pas une faute.
  catchUpBanner: {
    marginHorizontal: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  catchUpBannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  catchUpBannerContent: {
    flex: 1,
  },
  catchUpBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#78350F',
  },
  catchUpBannerSubtitle: {
    fontSize: 13,
    color: '#B45309',
    marginTop: 2,
  },
  catchUpSection: {
    marginBottom: 24,
  },
  catchUpSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  catchUpMoveCard: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
    marginBottom: 10,
  },
  catchUpMoveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  catchUpMoveTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  catchUpMoveBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
  },
  catchUpMoveBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#92400E',
  },
  catchUpMoveDates: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  catchUpMoveFrom: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.4)',
    textDecorationLine: 'line-through',
  },
  catchUpMoveTo: {
    fontSize: 13,
    fontWeight: '600',
    color: '#B45309',
  },
  catchUpMoveMinutes: {
    marginLeft: 'auto',
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  catchUpMoveWarning: {
    marginTop: 8,
    fontSize: 12,
    color: '#B45309',
  },
  catchUpDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  catchUpDayLabel: {
    width: 76,
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.55)',
  },
  catchUpDayBarTrack: {
    flex: 1,
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  },
  catchUpDayBarBefore: {
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  catchUpDayBarAdded: {
    backgroundColor: '#F59E0B',
  },
  catchUpDayMinutes: {
    width: 56,
    textAlign: 'right',
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  catchUpApplyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: '#B45309',
  },
});

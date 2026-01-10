import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Platform, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { subjectsService, tasksService, weeklyPlanningService } from '@/lib/api';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  estimatedTime: number;
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  details?: string;
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
  const insets = useSafeAreaInsets();
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
  const [creatingTask, setCreatingTask] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [showImagePickerOptions, setShowImagePickerOptions] = useState(false);
  const [planningWeek, setPlanningWeek] = useState(false);
  const [weeklyPlan, setWeeklyPlan] = useState<any>(null);
  const [showPlanPreview, setShowPlanPreview] = useState(false);

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
        
        const normalizedData = data.map(subject => ({
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
        console.log('📥 [TasksNew] Données normalisées:', normalizedData.map(s => ({
          id: s.id,
          name: s.name,
          tasksCount: s.tasks.length,
          completedCount: s.tasks.filter((t: Task) => t.completed).length,
        })));
        setSubjects(normalizedData);
        // Ouvrir la première matière par défaut
        if (normalizedData.length > 0) {
          setExpandedSubjects([normalizedData[0].id]);
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
      Alert.alert('Erreur', 'Impossible de mettre à jour la tâche. Veuillez réessayer.');
    }
  };

  const handleDeleteTask = async (subjectId: string, taskId: string) => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        {
          text: 'Annuler',
          style: 'cancel',
        },
        {
          text: 'Supprimer',
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
              Alert.alert('Erreur', 'Impossible de supprimer la tâche. Veuillez réessayer.');
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
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à vos photos.'
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
      Alert.alert('Erreur', 'Impossible de sélectionner l\'image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      // Demander les permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission requise',
          'Nous avons besoin de votre permission pour accéder à votre appareil photo.'
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
      Alert.alert('Erreur', 'Impossible de prendre la photo');
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
          'Aucune matière trouvée',
          'Aucune matière n\'a pu être extraite de l\'image. Assurez-vous que l\'image contient une liste de matières avec leurs ECTS.'
        );
        return;
      }

      // Afficher un message de confirmation
      const message = `${result.validCount} matière(s) trouvée(s). Voulez-vous les créer ?`;
      
      Alert.alert(
        'Matières trouvées',
        message,
        [
          {
            text: 'Annuler',
            style: 'cancel',
          },
          {
            text: 'Créer',
            onPress: async () => {
              await createSubjectsFromAnalysis(result.subjects);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur analyse image:', error);
      
      let errorMessage = 'Impossible d\'analyser l\'image. Veuillez réessayer.';
      
      if (error.message?.includes('504') || error.message?.includes('timeout') || error.message?.includes('trop de temps')) {
        errorMessage = 'L\'analyse prend trop de temps. Veuillez réessayer avec une image plus claire et mieux éclairée.';
      } else if (error.message?.includes('Non authentifié') || error.message?.includes('401')) {
        errorMessage = 'Vous devez être connecté pour analyser une image.';
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
        Alert.alert('Erreur', 'Impossible de générer le plan. Vérifiez que vous avez des tâches à planifier.');
      }
    } catch (error: any) {
      console.error('Erreur planification:', error);
      let errorMessage = 'Impossible de planifier la semaine.';
      
      if (error.message?.includes('Google Calendar non connecté')) {
        errorMessage = 'Connectez votre Google Calendar pour utiliser la planification automatique.';
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
          'Succès',
          result.message || `${result.eventsCreated} session(s) créée(s) dans Google Calendar`,
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
        Alert.alert('Erreur', 'Impossible d\'appliquer le plan.');
      }
    } catch (error: any) {
      console.error('Erreur application plan:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'appliquer le plan.');
    } finally {
      setPlanningWeek(false);
    }
  };

  const createSubjectsFromAnalysis = async (subjectsToCreate: Array<{ name: string; coefficient: number; ue?: string | null }>) => {
    try {
      setSaving(true);
      const createdSubjects: Subject[] = [];

      for (const subjectData of subjectsToCreate) {
        try {
          const newSubject = await subjectsService.create({
            name: subjectData.name,
            coefficient: subjectData.coefficient,
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
          'Succès',
          `${createdSubjects.length} matière(s) créée(s) avec succès !`
        );
      } else {
        Alert.alert(
          'Erreur',
          'Aucune matière n\'a pu être créée. Elles existent peut-être déjà.'
        );
      }
    } catch (error: any) {
      console.error('Erreur création matières:', error);
      Alert.alert('Erreur', 'Impossible de créer les matières');
    } finally {
      setSaving(false);
    }
  };

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom de matière');
      return;
    }

    // Vérifier l'authentification avant de continuer
    const { getAuthToken } = await import('@/lib/api');
    const token = await getAuthToken();
    if (!token) {
      Alert.alert(
        'Authentification requise',
        'Vous devez être connecté pour ajouter une matière. Veuillez vous connecter.'
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
      
      // Ajouter la nouvelle matière à la liste
      setSubjects([...subjects, newSubject]);
      // Ouvrir automatiquement la nouvelle matière
      setExpandedSubjects([...expandedSubjects, newSubject.id]);
      
      // Réinitialiser le formulaire
      setNewSubjectName('');
      setNewSubjectCoeff(1);
      setNewSubjectDeadline(null);
      setShowAddSubjectModal(false);
      
      // Recharger les matières depuis l'API pour s'assurer d'avoir les dernières données
      await loadSubjects();
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Erreur inconnue';
      
      console.error('[TasksNew] Erreur lors de lajout de la matière:', errorMessage);
      console.error('[TasksNew] Type d erreur:', error?.constructor?.name);
      console.error('[TasksNew] Stack:', error?.stack);
      
      let userFriendlyMessage = 'Impossible dajouter la matière. Veuillez réessayer.';
      
      if (errorMessage.includes('Non authentifié') || errorMessage.includes('401')) {
        userFriendlyMessage = 'Vous devez être connecté pour ajouter une matière.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyMessage = 'La requête a pris trop de temps. Vérifiez votre connexion internet.';
      } else if (errorMessage.includes('Endpoint non trouvé') || errorMessage.includes('404') || errorMessage.includes('pas encore déployé')) {
        userFriendlyMessage = 'Cette fonctionnalité est en cours de déploiement. Veuillez réessayer dans quelques instants ou contacter le support.';
      } else if (errorMessage.includes('Erreur de réseau') || errorMessage.includes('fetch') || errorMessage.includes('Network')) {
        userFriendlyMessage = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.';
      } else if (errorMessage && errorMessage.length < 150) {
        userFriendlyMessage = errorMessage;
      }
      
      Alert.alert('Erreur', userFriendlyMessage);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const handleAddTask = async () => {
    if (!newTaskTitle.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un titre pour la tâche');
      return;
    }

    if (!selectedSubjectForTask) {
      Alert.alert('Erreur', 'Aucune matière sélectionnée');
      return;
    }

    try {
      setCreatingTask(true);
      const selectedSubject = subjects.find(s => s.id === selectedSubjectForTask);
      
      // Convertir la priorité en format API (high=4, medium=3, low=2)
      const priorityMap: Record<'high' | 'medium' | 'low', number> = {
        high: 4,
        medium: 3,
        low: 2,
      };

      const taskData = {
        title: newTaskTitle.trim(),
        description: undefined,
        estimatedMinutes: newTaskEstimatedTime,
        priority: priorityMap[newTaskPriority],
        subjectId: selectedSubjectForTask,
        subject: selectedSubject?.name || undefined,
      };

      console.log('📤 [TasksNew] Création tâche - Données:', taskData);
      
      const newTask = await tasksService.create(taskData);
      
      console.log('✅ [TasksNew] Tâche créée avec succès:', newTask);
      
      // Recharger les matières pour afficher la nouvelle tâche
      await loadSubjects();
      
      // Réinitialiser le formulaire
      setNewTaskTitle('');
      setNewTaskEstimatedTime(30);
      setNewTaskPriority('medium');
      setShowAddTaskModal(false);
      setSelectedSubjectForTask(null);
      
      Alert.alert('Succès', 'Tâche ajoutée avec succès');
    } catch (error: any) {
      const errorMessage = error?.message || String(error) || 'Erreur inconnue';
      console.error('[TasksNew] Erreur lors de lajout de la tâche:', errorMessage);
      Alert.alert('Erreur', errorMessage.includes('réseau') ? 'Erreur de connexion. Vérifiez votre connexion internet.' : 'Impossible dajouter la tâche. Veuillez réessayer.');
    } finally {
      setCreatingTask(false);
    }
  };

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
        return 'High impact';
      case 'medium':
        return 'Medium';
      case 'low':
        return 'Low';
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={styles.loadingText}>Chargement des matières...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
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
            <Text style={styles.headerTitle}>Your Tasks</Text>
            <Text style={styles.headerSubtitle}>Organized by subject and impact.</Text>
          </View>

          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {completedTasks} of {totalTasks} completed
            </Text>
          </View>

          {/* Add Subject Buttons */}
          <View style={styles.addSubjectButtonsContainer}>
            <TouchableOpacity
              style={styles.addSubjectButton}
              onPress={() => setShowAddSubjectModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
              <Text style={styles.addSubjectText}>Ajouter une matière</Text>
            </TouchableOpacity>
            
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
                {analyzingImage ? 'Analyse en cours...' : 'Créer depuis une image'}
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
                {planningWeek ? 'Planification en cours...' : 'Plan my week'}
              </Text>
            </TouchableOpacity>
          )}
        </Animated.View>

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
                      <Text style={styles.highImpactLabel}>High impact on final grade</Text>
                    )}

                    {subject.nextDeadline && (
                      <Text style={styles.deadlineText}>{subject.nextDeadline}</Text>
                    )}

                    {/* Progress bar */}
                    <View style={styles.progressSection}>
                      <View style={styles.progressLabels}>
                        <Text style={styles.progressLabel}>
                          {completedCount}/{totalCount} tasks
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

                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color="rgba(0, 0, 0, 0.4)"
                  />
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

                        return (
                          <View
                            key={task.id}
                            style={[
                              styles.taskCard,
                              task.completed && styles.taskCardCompleted,
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
                                  <Text style={[styles.taskPriority, { color: getPriorityColor(task.priority) }]}>
                                    {getPriorityLabel(task.priority)}
                                  </Text>
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
                                  <Text style={styles.startFocusText}>Start Focus Session</Text>
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

                    {/* Add task button */}
                    <TouchableOpacity
                      style={styles.addTaskButton}
                      onPress={() => {
                        setSelectedSubjectForTask(subject.id);
                        setShowAddTaskModal(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={styles.addTaskIconContainer}>
                        <Ionicons name="add" size={16} color="rgba(0, 0, 0, 0.4)" />
                      </View>
                      <Text style={styles.addTaskText}>Add task</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

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
              <Text style={styles.modalTitle}>Créer des matières depuis une image</Text>
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
                <Text style={styles.imagePickerOptionText}>Choisir depuis la galerie</Text>
                <Text style={styles.imagePickerOptionSubtext}>
                  Sélectionnez une image de votre liste
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.imagePickerHint}>
              <Ionicons name="information-circle-outline" size={16} color="rgba(0, 0, 0, 0.4)" />
              <Text style={styles.imagePickerHintText}>
                L'IA analysera l'image et extraira automatiquement les matières avec leurs coefficients (ECTS)
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

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Subject Name */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nom de la matière</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="Ex: Mathématiques, Physique..."
                  value={newSubjectName}
                  onChangeText={setNewSubjectName}
                  autoFocus
                />
              </View>

              {/* Coefficient */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Coefficient</Text>
                <Text style={styles.formHint}>L'importance de cette matière pour votre moyenne</Text>
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
                <Text style={styles.formLabel}>Deadline (optionnel)</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#16A34A" />
                  <Text style={styles.dateButtonText}>
                    {newSubjectDeadline
                      ? formatDate(newSubjectDeadline)
                      : 'Sélectionner une date'}
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
                  <Text style={styles.submitButtonText}>Ajouter la matière</Text>
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
                <Text style={styles.modalTitle}>Add a task</Text>
                <Text style={styles.modalSubtitle}>One clear task is enough.</Text>
                {selectedSubjectForTask && (
                  <Text style={styles.modalSubjectName}>
                    For <Text style={styles.modalSubjectNameBold}>{subjects.find(s => s.id === selectedSubjectForTask)?.name}</Text>
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

            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {/* Task title input */}
              <View style={styles.formGroup}>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g. Review chapter 3 / Finish problem set"
                  value={newTaskTitle}
                  onChangeText={setNewTaskTitle}
                  autoFocus
                  multiline={false}
                />
                <Text style={styles.formHint}>Keep it specific and doable.</Text>
              </View>

              {/* Estimated effort */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Estimated effort</Text>
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
                <Text style={styles.formLabel}>Priority</Text>
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
                      Normal
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
                      Important
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

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
                  <Text style={styles.submitButtonText}>Add task</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.modalFooterText}>You can always adjust later.</Text>
            </ScrollView>
          </View>
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
                <Text style={styles.modalTitle}>Plan de la semaine</Text>
                <Text style={styles.modalSubtitle}>
                  {weeklyPlan?.summary?.totalSessions || 0} session(s) • {Math.round((weeklyPlan?.summary?.totalMinutes || 0) / 60)}h
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
                    <Text style={styles.planSummaryTitle}>Répartition par matière</Text>
                    {Object.entries(weeklyPlan.summary.distribution || {}).map(([subject, minutes]) => (
                      <View key={subject} style={styles.planSummaryRow}>
                        <Text style={styles.planSummarySubject}>{subject}</Text>
                        <Text style={styles.planSummaryTime}>{Math.round(Number(minutes) / 60)}h {Number(minutes) % 60}min</Text>
                      </View>
                    ))}
                  </View>

                  {/* Sessions */}
                  <View style={styles.planSessionsContainer}>
                    <Text style={styles.planSessionsTitle}>Sessions planifiées</Text>
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
                  <Text style={styles.planEmptyText}>Aucune session à planifier</Text>
                  <Text style={styles.planEmptySubtext}>
                    Assurez-vous d'avoir des tâches non complétées liées à vos matières.
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
                      <Text style={styles.planApplyText}>Appliquer au calendrier</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
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
    gap: 16,
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
});


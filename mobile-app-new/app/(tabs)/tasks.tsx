import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated as RNAnimated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardService, tasksService, projectsService, authService } from '@/lib/api';
import { format, isToday, isTomorrow, isThisWeek, startOfToday, isBefore, parseISO } from 'date-fns';
import { fr, enUS, es as esLocale } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeInDown,
  FadeIn,
} from 'react-native-reanimated';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSuperwall } from '@/hooks/useSuperwall';
import { SUPERWALL_EVENTS } from '@/lib/superwallEvents';
import {
  markUserFirstActionTriggered,
  shouldTriggerUserFirstAction,
} from '@/lib/superwallFirstAction';

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: number | null;
  energyLevel: number | null;
  dueDate?: string;
  userId?: string;
  projectId?: string;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
  createdAt: string;
}

type EnergyLevelKey = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

interface TaskGroup {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  later: Task[];
  noDueDate: Task[];
}

interface TaskCardProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onPress: () => void;
  onDelete: (taskId: string) => void;
  onStartTimer: (task: Task) => void;
}

const TaskCard: React.FC<TaskCardProps & { index?: number }> = ({ task, onToggle, onPress, onDelete, onStartTimer, index = 0 }) => {
  const { t, language } = useLanguage();
  const locale = language === 'en' ? enUS : language === 'es' ? esLocale : fr;
  const checkmarkScale = useSharedValue(0);
  const pressScale = useSharedValue(1);
  const [isCelebrating, setIsCelebrating] = useState(false);

  useEffect(() => {
    if (task.completed) {
      checkmarkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    } else {
      checkmarkScale.value = withSpring(0, { damping: 8, stiffness: 200 });
    }
  }, [task.completed]);

  const handleToggle = () => {
    const newCompleted = !task.completed;
    onToggle(task.id, newCompleted);
    
    if (newCompleted) {
      setIsCelebrating(true);
      setTimeout(() => setIsCelebrating(false), 1000);
    }
  };

  const pressStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const checkmarkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkmarkScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.96, { damping: 12, stiffness: 280 });
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, { damping: 12, stiffness: 280 });
  };

  const getPriorityLabel = (priority: number | null) => {
    if (priority === null) return null;
    switch (priority) {
      case 0: return { label: t('tasksPriority0', undefined, 'Optionnel'), color: '#6b7280' };
      case 1: return { label: t('tasksPriority1', undefined, 'À faire'), color: '#3b82f6' };
      case 2: return { label: t('tasksPriority2', undefined, 'Important'), color: '#f59e0b' };
      case 3: return { label: t('tasksPriority3', undefined, 'Urgent'), color: '#ef4444' };
      case 4: return { label: t('tasksPriority4', undefined, 'Quick Win'), color: '#10b981' };
      default: return null;
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      if (isNaN(date.getTime())) return null;
      if (isToday(date)) return t('todayLabel', undefined, "Aujourd'hui");
      if (isTomorrow(date)) return t('tomorrowLabel', undefined, 'Demain');
      return format(date, 'dd/MM', { locale });
    } catch (error) {
      return null;
    }
  };

  const priorityInfo = getPriorityLabel(task.priority);
  const dueDateText = formatDueDate(task.dueDate);

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(400)}
      style={[styles.taskItem, pressStyle]}
    >
      {/* Celebration Animation */}
      {isCelebrating && (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeIn.duration(200)}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        >
          <View style={styles.celebrationOverlay} />
          <Text style={styles.celebrationEmoji}>✨</Text>
        </Animated.View>
      )}

      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.9}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.taskCheckbox,
          task.completed && styles.taskCheckboxCompleted,
        ]}
      >
        {task.completed && (
          <RNAnimated.View style={checkmarkStyle}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </RNAnimated.View>
        )}
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <View style={styles.taskHeader}>
          <TouchableOpacity onPress={onPress} style={{ flex: 1 }}>
            <Text
              style={[
                styles.taskName,
                task.completed && styles.taskNameCompleted,
              ]}
            >
              {task.title}
            </Text>
          </TouchableOpacity>
          {dueDateText && (
            <Text style={styles.taskDate}>{dueDateText}</Text>
          )}
        </View>
        <View style={styles.taskProgressRow}>
          <View style={styles.taskProgressBar}>
            <Animated.View
              style={[
                styles.taskProgressFill,
                { width: task.completed ? '100%' : '0%' },
              ]}
            />
          </View>
          {priorityInfo && (
            <View style={styles.taskPriority}>
              <View style={[styles.priorityDot, { backgroundColor: priorityInfo.color }]} />
              <Text style={[styles.priorityText, { color: priorityInfo.color }]}>
                {priorityInfo.label}
              </Text>
            </View>
          )}
        </View>
        {task.project && (
          <View style={styles.taskProject}>
            <Ionicons name="folder-outline" size={12} color="#6b7280" />
            <Text style={styles.taskProjectText}>{task.project.name}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const { t } = useLanguage();
  const { triggerEvent } = useSuperwall();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // États du formulaire
  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    priority: string;
    energyLevel: EnergyLevelKey;
    dueDate: Date | undefined;
    projectId: string;
  }>({
    title: '',
    description: '',
    priority: 'P1', // P1 = 1 → À faire (par défaut)
    energyLevel: 'MEDIUM',
    dueDate: undefined as Date | undefined,
    projectId: '',
  });

  // État pour les projets
  const [projects, setProjects] = useState<any[]>([]);

  // Options pour les selects (mapping correct)
  const priorityOptions = [
    { value: 'P4', label: t('tasksPriority4', undefined, 'Quick Win') },    // P4 = 4 → Quick Win ✅
    { value: 'P3', label: t('tasksPriority3', undefined, 'Urgent') },       // P3 = 3 → Urgent ✅
    { value: 'P2', label: t('tasksPriority2', undefined, 'Important') },    // P2 = 2 → Important ✅
    { value: 'P1', label: t('tasksPriority1', undefined, 'À faire') },      // P1 = 1 → À faire ✅
    { value: 'P0', label: t('tasksPriority0', undefined, 'Optionnel') },    // P0 = 0 → Optionnel ✅
  ];

  const energyOptions = [
    { value: 'EXTREME', label: t('tasksEnergyExtreme', undefined, 'Extrême') },
    { value: 'HIGH', label: t('tasksEnergyHigh', undefined, 'Élevé') },
    { value: 'MEDIUM', label: t('tasksEnergyMedium', undefined, 'Moyen') },
    { value: 'LOW', label: t('tasksEnergyLow', undefined, 'Faible') },
  ];

  // Options pour les projets
  const projectOptions = [
    { value: '', label: t('tasksFormProjectPlaceholder', undefined, 'Aucun projet') },
    ...projects.map(project => ({
      value: project.id,
      label: project.name
    }))
  ];
  
  console.log('📋 Projets disponibles:', projects.length, projects);
  console.log('📋 Options projets:', projectOptions);

  // Fonction pour grouper les tâches par date
  const groupTasks = (tasks: Task[]): TaskGroup => {
    const today = startOfToday();
    
    // Filtrer seulement les tâches non complétées
    const incompleteTasks = tasks.filter(task => !task.completed);
    
    return incompleteTasks.reduce((groups: TaskGroup, task) => {
      if (!task.dueDate) {
        groups.noDueDate.push(task);
        return groups;
      }

      try {
        // Parser la date de manière robuste
        const taskDate = typeof task.dueDate === 'string' ? parseISO(task.dueDate) : new Date(task.dueDate);
        
        // Vérifier si la date est valide
        if (isNaN(taskDate.getTime())) {
          console.warn('Date invalide pour la tâche:', task.title, task.dueDate);
          groups.noDueDate.push(task);
          return groups;
        }
        
        if (isBefore(taskDate, today)) {
          groups.overdue.push(task);
        } else if (isToday(taskDate)) {
          groups.today.push(task);
        } else if (isTomorrow(taskDate)) {
          groups.tomorrow.push(task);
        } else if (isThisWeek(taskDate)) {
          groups.thisWeek.push(task);
        } else {
          groups.later.push(task);
        }
      } catch (error) {
        console.warn('Erreur parsing date pour tâche:', task.title, task.dueDate, error);
        groups.noDueDate.push(task);
      }
      
      return groups;
    }, {
      overdue: [],
      today: [],
      tomorrow: [],
      thisWeek: [],
      later: [],
      noDueDate: []
    });
  };

  const fetchTasks = async () => {
    try {
      const response = await tasksService.getTasks();
      const tasks = response.tasks || [];
      
      // Debug: Vérifier le format des dates
      console.log('📅 Debug tâches:', tasks.map(t => ({
        title: t.title,
        dueDate: t.dueDate,
        completed: t.completed
      })));
      
      // Filtrer sur l'utilisateur courant si l'API renvoie plusieurs users (sécurité)
      const filtered = currentUserId ? tasks.filter((t: any) => !t.userId || t.userId === currentUserId) : tasks;
      setTasks(filtered);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksLoadError', undefined, 'Impossible de charger les tâches')
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const response = await projectsService.getProjects();
      console.log('📋 Projets récupérés:', response);
      // La réponse de l'API est directement un tableau de projets
      setProjects(Array.isArray(response) ? response : response.projects || []);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des projets:', error);
    }
  };

  const checkAuthStatus = async () => {
    try {
      const user = await authService.checkAuth();
      if (!isMountedRef.current) return;
      
      console.log('🔐 Statut d\'authentification:', user);
      // checkAuth retourne User | null, pas { user: { id } }
      if (user?.id) {
        setCurrentUserId(user.id);
      }
    } catch (error) {
      console.error('❌ Pas authentifié:', error);
      // Ne pas afficher d'Alert si le composant est démonté ou si c'est juste une 401 normale
      if (isMountedRef.current && error instanceof Error && error.message !== 'Non authentifié') {
        Alert.alert(
          t('error', undefined, 'Erreur'),
          t('loginRequiredMessage', undefined, 'Vous devez vous reconnecter')
        );
      }
    }
  };

  useFocusEffect(
    useCallback(() => {
      checkAuthStatus();
      fetchTasks();
      fetchProjects();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTasks();
  }, []);

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    try {
      await tasksService.updateTask(taskId, { completed });
      setTasks(prev => prev.map(task => 
        task.id === taskId ? { ...task, completed } : task
      ));
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksUpdateError', undefined, 'Impossible de mettre à jour la tâche')
      );
    }
  };

  // Fonction utilitaire pour convertir le niveau d'énergie numérique en string
  const getEnergyKeyFromNumber = (energyLevel: number | null): EnergyLevelKey => {
    if (energyLevel === null) return 'MEDIUM';
    switch (energyLevel) {
      case 0: return 'LOW';
      case 1: return 'MEDIUM';
      case 2: return 'HIGH';
      case 3: return 'EXTREME';
      default: return 'MEDIUM';
    }
  };

  // Fonction utilitaire pour convertir le niveau d'énergie string en numérique
  const getEnergyNumberFromKey = (energyKey: EnergyLevelKey) => {
    switch (energyKey) {
      case 'LOW': return 0;
      case 'MEDIUM': return 1;
      case 'HIGH': return 2;
      case 'EXTREME': return 3;
      default: return 1; // Moyen par défaut
    }
  };

  const handleTaskPress = (task: Task) => {
    // Convertir les valeurs pour le formulaire d'édition
    const priorityValue = task.priority !== null ? `P${task.priority}` : 'P1';
    const energyValue = getEnergyKeyFromNumber(task.energyLevel);
    
    setEditingTask(task);
    setNewTask({
      title: task.title,
      description: task.description || '',
      priority: priorityValue,
      energyLevel: energyValue,
      dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      projectId: task.projectId || '',
    });
    setShowEditModal(true);
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      t('tasksDeleteTitle', undefined, 'Supprimer la tâche'),
      t('tasksDeleteConfirm', undefined, 'Êtes-vous sûr de vouloir supprimer cette tâche ?'),
      [
        { text: t('cancel', undefined, 'Annuler'), style: 'cancel' },
        { 
          text: t('delete', undefined, 'Supprimer'), 
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksService.deleteTask(taskId);
              setTasks(prev => prev.filter(task => task.id !== taskId));
              Alert.alert(
                t('success', undefined, 'Succès'),
                t('tasksDeleteSuccess', undefined, 'Tâche supprimée avec succès !')
              );
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert(
                t('error', undefined, 'Erreur'),
                t('tasksDeleteError', undefined, 'Impossible de supprimer la tâche')
              );
            }
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksRequiredTitleError', undefined, 'Veuillez saisir un titre pour la tâche')
      );
      return;
    }

    const fireUserFirstAction = await shouldTriggerUserFirstAction();
    setCreating(true);
    try {
      // Convertir les valeurs comme sur l'app web
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority ? parseInt(newTask.priority.replace('P', '')) : null,
        energyLevel: newTask.energyLevel ? getEnergyNumberFromKey(newTask.energyLevel) : null,
        dueDate: newTask.dueDate || null,
        projectId: newTask.projectId || null,
      };

      console.log('🚀 Données de la tâche à créer:', taskData);

      const createdTask = await tasksService.create(taskData);
      console.log('✅ Tâche créée:', createdTask);
      
      // Réinitialiser le formulaire
      setNewTask({
        title: '',
        description: '',
        priority: 'P1', // P1 = 1 → À faire (par défaut)
        energyLevel: 'MEDIUM',
        dueDate: undefined,
        projectId: '',
      });
      
      setShowCreateModal(false);
      fetchTasks(); // Recharger les tâches
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      if (fireUserFirstAction) {
        await triggerEvent(SUPERWALL_EVENTS.USER_FIRST_ACTION, {
          params: { source: 'tasks_first_creation' },
          requireNonPremium: false,
          bypassCooldown: true,
        });
        await markUserFirstActionTriggered();
      }
      
      Alert.alert(
        t('success', undefined, 'Succès'),
        t('tasksCreateSuccess', undefined, 'Tâche créée avec succès !')
      );
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksCreateError', undefined, 'Impossible de créer la tâche')
      );
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksRequiredTitleError', undefined, 'Veuillez saisir un titre pour la tâche')
      );
      return;
    }

    if (!editingTask) {
      Alert.alert(
        t('error', undefined, 'Erreur'),
        t('tasksNoTaskToEdit', undefined, 'Aucune tâche à modifier')
      );
      return;
    }

    setUpdating(true);

    try {
      // Convertir les données comme pour la création
      const priorityNumber = parseInt(newTask.priority.replace('P', ''));
      const energyNumber = getEnergyNumberFromKey(newTask.energyLevel);

      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        priority: priorityNumber,
        energyLevel: energyNumber,
        dueDate: newTask.dueDate ? newTask.dueDate.toISOString() : null,
        projectId: newTask.projectId || null,
      };

      console.log('🚀 Données de la tâche à modifier:', taskData);

      const updatedTask = await tasksService.updateTask(editingTask.id, taskData);
      console.log('✅ Tâche modifiée:', updatedTask);
      
      // Mettre à jour la liste des tâches
      setTasks(prev => prev.map(task => 
        task.id === editingTask.id ? { ...task, ...updatedTask } : task
      ));
      
      // Réinitialiser le formulaire
      resetForm();
      setEditingTask(null);
      setShowEditModal(false);
      
      Alert.alert(
        t('success', undefined, 'Succès'),
        t('tasksUpdateSuccess', undefined, 'Tâche modifiée avec succès !')
      );
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      Alert.alert(
        t('error', undefined, 'Erreur'),
        error instanceof Error ? error.message : t('tasksUpdateError', undefined, 'Une erreur est survenue lors de la modification')
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTimer = (task: Task) => {
    // Naviguer vers la page timer avec les paramètres de la tâche
    Alert.alert(
      t('tasksStartTimerTitle', undefined, 'Démarrer le timer'),
      t(
        'tasksStartTimerConfirm',
        { title: task.title },
        `Voulez-vous démarrer le timer pour la tâche "${task.title}" ?`
      ),
      [
        { text: t('cancel', undefined, 'Annuler'), style: 'cancel' },
        { 
          text: t('tasksStartAction', undefined, 'Démarrer'), 
          onPress: () => {
            console.log('🎯 Démarrer timer pour tâche:', task.id, task.title);
            // Naviguer vers l'onglet timer avec les paramètres de la tâche
            router.push({
              pathname: '/timer',
              params: {
                taskId: task.id,
                taskTitle: task.title,
              },
            });
          }
        }
      ]
    );
  };

  const resetForm = () => {
    setNewTask({
      title: '',
      description: '',
      priority: 'P1', // P1 = 1 → À faire (par défaut)
      energyLevel: 'MEDIUM',
      dueDate: undefined,
      projectId: '',
    });
  };

  // Grouper les tâches
  const groupedTasks = groupTasks(tasks);

  // Composant pour rendre un groupe de tâches
  const renderTaskGroup = (title: string, tasks: Task[], showDate = true) => {
    if (tasks.length === 0) return null;

    return (
      <View style={styles.taskGroup} key={title}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.groupTasks}>
          {tasks.map((task, index) => (
            <TaskCard
              key={task.id}
              task={task}
              index={index}
              onToggle={handleToggleTask}
              onPress={() => handleTaskPress(task)}
              onDelete={handleDeleteTask}
              onStartTimer={handleStartTimer}
            />
          ))}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>
          {t('tasksLoading', undefined, 'Chargement des tâches...')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>
          {t('tasksHeaderTitle', undefined, 'Tâches')}
        </Text>
        <Text style={styles.subtitle}>
          {t('tasksSubtitle', undefined, 'Gérez et organisez vos tâches efficacement')}
        </Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>
            {t('tasksNewButton', undefined, 'Nouvelle tâche')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Liste des tâches groupées */}
      <ScrollView
        style={styles.tasksList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>
              {t('tasksEmptyTitle', undefined, 'Aucune tâche trouvée')}
            </Text>
            <Text style={styles.emptySubtitle}>
              {t('tasksEmptySubtitle', undefined, 'Créez votre première tâche !')}
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>
                {t('tasksNewButton', undefined, 'Nouvelle tâche')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderTaskGroup(t('tasksGroupOverdue', undefined, 'En retard'), groupedTasks.overdue)}
            {renderTaskGroup(t('todayLabel', undefined, "Aujourd'hui"), groupedTasks.today)}
            {renderTaskGroup(t('tomorrowLabel', undefined, 'Demain'), groupedTasks.tomorrow)}
            {renderTaskGroup(t('tasksGroupThisWeek', undefined, 'Cette semaine'), groupedTasks.thisWeek)}
            {renderTaskGroup(t('tasksGroupLater', undefined, 'Plus tard'), groupedTasks.later)}
            {renderTaskGroup(t('tasksGroupNoDate', undefined, 'Sans date'), groupedTasks.noDueDate, false)}
          </>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Modal de création de tâche */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowCreateModal(false);
                resetForm();
              }}
            >
              <Text style={styles.modalCancelButton}>
                {t('cancel', undefined, 'Annuler')}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>
              {t('tasksModalCreateTitle', undefined, 'Nouvelle tâche')}
            </Text>
            
            <TouchableOpacity
              onPress={handleCreateTask}
              disabled={creating || !newTask.title.trim()}
              style={[
                styles.modalSaveButton,
                (!newTask.title.trim() || creating) && styles.modalSaveButtonDisabled
              ]}
            >
              {creating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveButtonText}>
                  {t('create', undefined, 'Créer')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormTitleLabel', undefined, 'Titre *')}
              </Text>
              <TextInput
                style={styles.formInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
                placeholder={t('tasksFormTitlePlaceholder', undefined, 'Titre de la tâche')}
                placeholderTextColor="#9ca3af"
                multiline={false}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormDescriptionLabel', undefined, 'Description')}
              </Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
                placeholder={t('tasksFormDescriptionPlaceholder', undefined, 'Description de la tâche')}
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Priorité */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormPriorityLabel', undefined, 'Priorité')}
              </Text>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                placeholder={t('tasksFormPriorityPlaceholder', undefined, 'Sélectionnez une priorité')}
                options={priorityOptions}
              />
            </View>

            {/* Niveau d'énergie */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormEnergyLabel', undefined, "Niveau d'énergie requis")}
              </Text>
              <Select
                value={newTask.energyLevel}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value as EnergyLevelKey }))}
                placeholder={t('tasksFormEnergyPlaceholder', undefined, "Sélectionnez un niveau d'énergie")}
                options={energyOptions}
              />
            </View>

            {/* Date d'échéance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormDueDateLabel', undefined, "Date d'échéance")}
              </Text>
              <DatePicker
                value={newTask.dueDate}
                onValueChange={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                placeholder={t('tasksFormDueDatePlaceholder', undefined, 'Choisir une date')}
              />
            </View>

            {/* Projet */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormProjectLabel', undefined, 'Projet')}
              </Text>
              <Select
                value={newTask.projectId}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value }))}
                placeholder={t('tasksFormProjectPlaceholder', undefined, 'Aucun projet')}
                options={projectOptions}
              />
            </View>

            <View style={styles.modalBottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal de modification de tâche */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowEditModal(false);
          setEditingTask(null);
          resetForm();
        }}
      >
        <KeyboardAvoidingView 
          style={styles.modalContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.modalHeader}>
            <TouchableOpacity
              onPress={() => {
                setShowEditModal(false);
                setEditingTask(null);
                resetForm();
              }}
              style={styles.modalCloseButton}
            >
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {t('tasksModalEditTitle', undefined, 'Modifier la tâche')}
            </Text>
            <TouchableOpacity
              onPress={handleUpdateTask}
              disabled={updating}
              style={[styles.modalSaveButton, updating && styles.modalSaveButtonDisabled]}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveButtonText}>
                  {t('edit', undefined, 'Modifier')}
                </Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormTitleLabel', undefined, 'Titre *')}
              </Text>
              <TextInput
                style={styles.formInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
                placeholder={t('tasksFormTitlePlaceholder', undefined, 'Titre de la tâche')}
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormDescriptionLabel', undefined, 'Description')}
              </Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
                placeholder={t('tasksFormDescriptionPlaceholder', undefined, 'Description de la tâche')}
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Priorité */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormPriorityLabel', undefined, 'Priorité')}
              </Text>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                placeholder={t('tasksFormPriorityPlaceholder', undefined, 'Sélectionnez une priorité')}
                options={priorityOptions}
              />
            </View>

            {/* Niveau d'énergie */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormEnergyLabel', undefined, "Niveau d'énergie requis")}
              </Text>
              <Select
                value={newTask.energyLevel}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value as EnergyLevelKey }))}
                placeholder={t('tasksFormEnergyPlaceholder', undefined, "Sélectionnez un niveau d'énergie")}
                options={energyOptions}
              />
            </View>

            {/* Date d'échéance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormDueDateLabel', undefined, "Date d'échéance")}
              </Text>
              <DatePicker
                value={newTask.dueDate}
                onValueChange={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                placeholder={t('tasksFormDueDatePlaceholderSelect', undefined, 'Sélectionner une date')}
              />
            </View>

            {/* Projet */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                {t('tasksFormProjectLabel', undefined, 'Projet')}
              </Text>
              <Select
                value={newTask.projectId}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value }))}
                placeholder={t('tasksFormProjectOptionalPlaceholder', undefined, 'Sélectionnez un projet (optionnel)')}
                options={projectOptions}
              />
            </View>

            <View style={styles.modalBottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  addButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tasksList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  taskGroup: {
    marginTop: 24,
  },
  groupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  groupTasks: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    gap: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 194, 122, 0.2)',
    borderRadius: 16,
  },
  celebrationEmoji: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -12 }, { translateY: -12 }],
    fontSize: 24,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCheckboxCompleted: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskName: {
    fontSize: 14,
    fontWeight: '400',
    color: '#111827',
    flex: 1,
  },
  taskNameCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  taskDate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 8,
  },
  taskProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  taskProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  taskProgressFill: {
    height: '100%',
    backgroundColor: '#00C27A',
    borderRadius: 3,
  },
  taskPriority: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  taskProject: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  taskProjectText: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  emptyButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 100,
  },
  // Styles du modal
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalSaveButton: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  modalSaveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },

  modalBottomPadding: {
    height: 40,
  },
});

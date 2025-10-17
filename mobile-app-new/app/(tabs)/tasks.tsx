import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { dashboardService, tasksService, projectsService, authService } from '@/lib/api';
import { format, isToday, isTomorrow, isThisWeek, startOfToday, isBefore, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useRouter } from 'expo-router';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';

const { width } = Dimensions.get('window');

interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: number | null;
  energyLevel: number | null;
  dueDate?: string;
  project?: {
    id: string;
    name: string;
    color?: string;
  };
  createdAt: string;
}

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

const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onPress, onDelete, onStartTimer }) => {
  const getPriorityLabel = (priority: number | null) => {
    if (priority === null) return null;
    switch (priority) {
      case 0: return { label: 'Optionnel', color: '#6b7280' };
      case 1: return { label: 'À faire', color: '#3b82f6' };
      case 2: return { label: 'Important', color: '#f59e0b' };
      case 3: return { label: 'Urgent', color: '#ef4444' };
      case 4: return { label: 'Quick Win', color: '#10b981' };
      default: return null;
    }
  };

  const getEnergyLabel = (energyLevel: number | null) => {
    if (energyLevel === null) return null;
    switch (energyLevel) {
      case 0: return { label: 'Faible', color: '#10b981' };
      case 1: return { label: 'Moyen', color: '#f59e0b' };
      case 2: return { label: 'Élevé', color: '#f97316' };
      case 3: return { label: 'Extrême', color: '#ef4444' };
      default: return null;
    }
  };

  const formatDueDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      // Essayer de parser la date - elle peut être en format ISO ou Date object
      const date = typeof dateString === 'string' ? parseISO(dateString) : new Date(dateString);
      
      if (isNaN(date.getTime())) return null; // Date invalide
      
      if (isToday(date)) return "Aujourd'hui";
      if (isTomorrow(date)) return "Demain";
      return format(date, 'dd/MM', { locale: fr });
    } catch (error) {
      console.warn('Erreur parsing date:', dateString, error);
      return null;
    }
  };

  const priorityInfo = getPriorityLabel(task.priority);
  const energyInfo = getEnergyLabel(task.energyLevel);

  return (
    <View style={[
      styles.taskCard,
      task.completed && styles.taskCardCompleted
    ]}>
      <View style={styles.taskContent}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            task.completed && styles.checkboxCompleted
          ]}
          onPress={() => onToggle(task.id, !task.completed)}
        >
          {task.completed && (
            <Ionicons name="checkmark" size={14} color="#fff" />
          )}
        </TouchableOpacity>
        
        <View style={styles.taskInfo}>
          <TouchableOpacity onPress={onPress} style={styles.taskTextContainer}>
            <Text style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted
            ]}>
              {task.title}
            </Text>
            
            {task.description && (
              <Text style={[
                styles.taskDescription,
                task.completed && styles.taskDescriptionCompleted
              ]} numberOfLines={2}>
                {task.description}
              </Text>
            )}
          </TouchableOpacity>
          
          <View style={styles.taskMeta}>
            {priorityInfo && (
              <View style={[styles.badge, { borderColor: priorityInfo.color }]}>
                <Text style={[styles.badgeText, { color: priorityInfo.color }]}>
                  {priorityInfo.label}
                </Text>
              </View>
            )}
            
            {energyInfo && (
              <View style={[styles.badge, { borderColor: energyInfo.color }]}>
                <Text style={[styles.badgeText, { color: energyInfo.color }]}>
                  Énergie {energyInfo.label}
                </Text>
              </View>
            )}
            
            {task.project && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{task.project.name}</Text>
              </View>
            )}
            
            {task.dueDate && (
              <View style={styles.dueDateContainer}>
                <Ionicons name="calendar-outline" size={12} color="#6b7280" />
                <Text style={styles.dueDateText}>{formatDueDate(task.dueDate)}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.taskActions}>
          <TouchableOpacity style={styles.actionButton} onPress={() => onStartTimer(task)}>
            <Ionicons name="play-circle-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={onPress}>
            <Ionicons name="create-outline" size={20} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionButton} onPress={() => onDelete(task.id)}>
            <Ionicons name="trash-outline" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default function TasksScreen() {
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [updating, setUpdating] = useState(false);
  
  // États du formulaire
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'P1', // P1 = 1 → À faire (par défaut)
    energyLevel: 'Moyen',
    dueDate: undefined as Date | undefined,
    projectId: '',
  });

  // État pour les projets
  const [projects, setProjects] = useState<any[]>([]);

  // Options pour les selects (mapping correct)
  const priorityOptions = [
    { value: 'P4', label: 'Quick Win' },    // P4 = 4 → Quick Win ✅
    { value: 'P3', label: 'Urgent' },       // P3 = 3 → Urgent ✅
    { value: 'P2', label: 'Important' },    // P2 = 2 → Important ✅
    { value: 'P1', label: 'À faire' },      // P1 = 1 → À faire ✅
    { value: 'P0', label: 'Optionnel' },    // P0 = 0 → Optionnel ✅
  ];

  const energyOptions = [
    { value: 'Extrême', label: 'Extrême' },
    { value: 'Élevé', label: 'Élevé' },
    { value: 'Moyen', label: 'Moyen' },
    { value: 'Faible', label: 'Faible' },
  ];

  // Options pour les projets
  const projectOptions = [
    { value: '', label: 'Aucun projet' },
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
      
      setTasks(tasks);
    } catch (error) {
      console.error('Erreur lors du chargement des tâches:', error);
      Alert.alert('Erreur', 'Impossible de charger les tâches');
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
      const response = await authService.checkAuth();
      console.log('🔐 Statut d\'authentification:', response);
    } catch (error) {
      console.error('❌ Pas authentifié:', error);
      Alert.alert('Erreur', 'Vous devez vous reconnecter');
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
      Alert.alert('Erreur', 'Impossible de mettre à jour la tâche');
    }
  };

  // Fonction utilitaire pour convertir le niveau d'énergie numérique en string
  const getEnergyStringFromNumber = (energyLevel: number | null) => {
    if (energyLevel === null) return 'Moyen';
    switch (energyLevel) {
      case 0: return 'Faible';
      case 1: return 'Moyen';
      case 2: return 'Élevé';
      case 3: return 'Extrême';
      default: return 'Moyen';
    }
  };

  // Fonction utilitaire pour convertir le niveau d'énergie string en numérique
  const getEnergyNumberFromString = (energyString: string) => {
    switch (energyString) {
      case 'Faible': return 0;
      case 'Moyen': return 1;
      case 'Élevé': return 2;
      case 'Extrême': return 3;
      default: return 1; // Moyen par défaut
    }
  };

  const handleTaskPress = (task: Task) => {
    // Convertir les valeurs pour le formulaire d'édition
    const priorityValue = task.priority !== null ? `P${task.priority}` : 'P1';
    const energyValue = getEnergyStringFromNumber(task.energyLevel);
    
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
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Supprimer', 
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksService.deleteTask(taskId);
              setTasks(prev => prev.filter(task => task.id !== taskId));
              Alert.alert('Succès', 'Tâche supprimée avec succès !');
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la tâche');
            }
          }
        }
      ]
    );
  };

  const handleCreateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la tâche');
      return;
    }

    setCreating(true);
    try {
      // Convertir les valeurs comme sur l'app web
      const taskData = {
        title: newTask.title.trim(),
        description: newTask.description.trim() || null,
        priority: newTask.priority ? parseInt(newTask.priority.replace('P', '')) : null,
        energyLevel: newTask.energyLevel ? getEnergyNumberFromString(newTask.energyLevel) : null,
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
        energyLevel: 'Moyen',
        dueDate: undefined,
        projectId: '',
      });
      
      setShowCreateModal(false);
      fetchTasks(); // Recharger les tâches
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      
      Alert.alert('Succès', 'Tâche créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      Alert.alert('Erreur', 'Impossible de créer la tâche');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdateTask = async () => {
    if (!newTask.title.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un titre pour la tâche');
      return;
    }

    if (!editingTask) {
      Alert.alert('Erreur', 'Aucune tâche à modifier');
      return;
    }

    setUpdating(true);

    try {
      // Convertir les données comme pour la création
      const priorityNumber = parseInt(newTask.priority.replace('P', ''));
      const energyNumber = getEnergyNumberFromString(newTask.energyLevel);

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
      
      Alert.alert('Succès', 'Tâche modifiée avec succès !');
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Une erreur est survenue lors de la modification');
    } finally {
      setUpdating(false);
    }
  };

  const handleStartTimer = (task: Task) => {
    // Naviguer vers la page timer avec les paramètres de la tâche
    Alert.alert(
      'Démarrer le timer',
      `Voulez-vous démarrer le timer pour la tâche "${task.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        { 
          text: 'Démarrer', 
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
      energyLevel: 'Moyen',
      dueDate: undefined,
      projectId: '',
    });
  };

  // Grouper les tâches
  const groupedTasks = groupTasks(tasks);
  const pendingCount = tasks.filter(task => !task.completed).length;
  const completedCount = tasks.filter(task => task.completed).length;

  // Composant pour rendre un groupe de tâches
  const renderTaskGroup = (title: string, tasks: Task[], showDate = true) => {
    if (tasks.length === 0) return null;

    return (
      <View style={styles.taskGroup} key={title}>
        <Text style={styles.groupTitle}>{title}</Text>
        <View style={styles.groupTasks}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
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
        <Text style={styles.loadingText}>Chargement des tâches...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Tâches</Text>
        <Text style={styles.subtitle}>
          Gérez et organisez vos tâches efficacement
        </Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nouvelle tâche</Text>
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
            <Text style={styles.emptyTitle}>Aucune tâche trouvée</Text>
            <Text style={styles.emptySubtitle}>
              Créez votre première tâche !
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={20} color="#fff" />
              <Text style={styles.emptyButtonText}>Nouvelle tâche</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {renderTaskGroup("En retard", groupedTasks.overdue)}
            {renderTaskGroup("Aujourd'hui", groupedTasks.today)}
            {renderTaskGroup("Demain", groupedTasks.tomorrow)}
            {renderTaskGroup("Cette semaine", groupedTasks.thisWeek)}
            {renderTaskGroup("Plus tard", groupedTasks.later)}
            {renderTaskGroup("Sans date", groupedTasks.noDueDate, false)}
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
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Nouvelle tâche</Text>
            
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
                <Text style={styles.modalSaveButtonText}>Créer</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titre *</Text>
              <TextInput
                style={styles.formInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
                placeholder="Titre de la tâche"
                placeholderTextColor="#9ca3af"
                multiline={false}
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
                placeholder="Description de la tâche"
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Priorité */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priorité</Text>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                placeholder="Sélectionnez une priorité"
                options={priorityOptions}
              />
            </View>

            {/* Niveau d'énergie */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Niveau d'énergie requis</Text>
              <Select
                value={newTask.energyLevel}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value }))}
                placeholder="Sélectionnez un niveau d'énergie"
                options={energyOptions}
              />
            </View>

            {/* Date d'échéance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date d'échéance</Text>
              <DatePicker
                value={newTask.dueDate}
                onValueChange={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                placeholder="Choisir une date"
              />
            </View>

            {/* Projet */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Projet</Text>
              <Select
                value={newTask.projectId}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value }))}
                placeholder="Aucun projet"
                options={[
                  { value: '', label: 'Aucun projet' },
                  ...projects.map(project => ({
                    value: project.id,
                    label: project.name
                  }))
                ]}
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
            <Text style={styles.modalTitle}>Modifier la tâche</Text>
            <TouchableOpacity
              onPress={handleUpdateTask}
              disabled={updating}
              style={[styles.modalSaveButton, updating && styles.modalSaveButtonDisabled]}
            >
              {updating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalSaveButtonText}>Modifier</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Titre */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Titre de la tâche *</Text>
              <TextInput
                style={styles.formInput}
                value={newTask.title}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, title: text }))}
                placeholder="Titre de la tâche"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newTask.description}
                onChangeText={(text) => setNewTask(prev => ({ ...prev, description: text }))}
                placeholder="Description de la tâche"
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Priorité */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Priorité</Text>
              <Select
                value={newTask.priority}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                placeholder="Sélectionnez une priorité"
                options={priorityOptions}
              />
            </View>

            {/* Niveau d'énergie */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Niveau d'énergie requis</Text>
              <Select
                value={newTask.energyLevel}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, energyLevel: value }))}
                placeholder="Sélectionnez un niveau d'énergie"
                options={energyOptions}
              />
            </View>

            {/* Date d'échéance */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Date d'échéance</Text>
              <DatePicker
                value={newTask.dueDate}
                onValueChange={(date) => setNewTask(prev => ({ ...prev, dueDate: date }))}
                placeholder="Sélectionner une date"
              />
            </View>

            {/* Projet */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Projet</Text>
              <Select
                value={newTask.projectId}
                onValueChange={(value) => setNewTask(prev => ({ ...prev, projectId: value }))}
                placeholder="Sélectionnez un projet (optionnel)"
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
  taskCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 12,
  },
  taskCardCompleted: {
    backgroundColor: '#f9fafb',
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#d1d5db',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  checkboxCompleted: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e',
  },
  taskInfo: {
    flex: 1,
  },
  taskTextContainer: {
    marginBottom: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: '#6b7280',
  },
  taskDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  taskDescriptionCompleted: {
    color: '#9ca3af',
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: '#6b7280',
  },
  taskActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
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
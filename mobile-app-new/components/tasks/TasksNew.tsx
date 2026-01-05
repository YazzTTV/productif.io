import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput, Platform, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { subjectsService } from '@/lib/api';

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

  // Charger les matières depuis l'API
  useEffect(() => {
    loadSubjects();
  }, []);

  const loadSubjects = async () => {
    try {
      setLoading(true);
      const data = await subjectsService.getAll();
      if (Array.isArray(data)) {
        setSubjects(data);
        // Ouvrir la première matière par défaut
        if (data.length > 0) {
          setExpandedSubjects([data[0].id]);
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
  };

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

  const handleCompleteTask = (subjectId: string, taskId: string) => {
    setSubjects(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              tasks: subject.tasks.map(task =>
                task.id === taskId
                  ? { ...task, completed: !task.completed }
                  : task
              ),
            }
          : subject
      )
    );
  };

  const handleStartFocus = (task: Task, subject: Subject) => {
    router.push({
      pathname: '/focus',
      params: {
        title: task.title,
        subject: subject.name,
        duration: task.estimatedTime,
      },
    });
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

  const totalTasks = subjects.reduce((acc, s) => acc + s.tasks.length, 0);
  const completedTasks = subjects.reduce(
    (acc, s) => acc + s.tasks.filter(t => t.completed).length,
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

          {/* Add Subject Button */}
          <TouchableOpacity
            style={styles.addSubjectButton}
            onPress={() => setShowAddSubjectModal(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={20} color="#16A34A" />
            <Text style={styles.addSubjectText}>Ajouter une matière</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Subjects list */}
        <View style={styles.subjectsContainer}>
          {subjects.map((subject, index) => {
            const isExpanded = expandedSubjects.includes(subject.id);
            const completedCount = subject.tasks.filter(t => t.completed).length;
            const totalCount = subject.tasks.length;

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
                        <Text style={styles.progressLabel}>{subject.progress}%</Text>
                      </View>
                      <View style={styles.progressBarContainer}>
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${subject.progress}%`,
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
                      {subject.tasks.map((task, taskIndex) => {
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
                            {!task.completed && (
                              <TouchableOpacity
                                style={styles.startFocusButton}
                                onPress={() => handleStartFocus(task, subject)}
                                activeOpacity={0.8}
                              >
                                <Text style={styles.startFocusText}>Start Focus Session</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </Animated.View>
            );
          })}
        </View>

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

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
  startFocusButton: {
    marginTop: 8,
    marginLeft: 36,
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  addSubjectButton: {
    marginTop: 16,
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
  addSubjectText: {
    color: '#16A34A',
    fontSize: 16,
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
});


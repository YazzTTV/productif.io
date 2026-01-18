import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { apiCall } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface HabitEntry {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
  note?: string;
  rating?: number;
  createdAt: string;
  updatedAt: string;
  habit: {
    id: string;
    name: string;
    color: string;
  };
}

interface Process {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

interface CompletedTask {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  dueDate: string | null;
  priority: number | null;
  energyLevel: number | null;
  completedAt: string;
  updatedAt: string;
  projectId: string | null;
  projectName: string | null;
}

type TabType = 'learning' | 'ratings' | 'processes' | 'tasks';

export default function MonEspaceScreen() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('learning');
  const [learningEntries, setLearningEntries] = useState<HabitEntry[]>([]);
  const [ratingEntries, setRatingEntries] = useState<HabitEntry[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      console.log('🔄 Récupération des données Mon Espace...');
      
      // Récupérer les entrées d'habitudes
      const habitsResponse = await apiCall<HabitEntry[]>('/habits/entries/all');
      console.log('📚 Entrées habitudes:', habitsResponse);
      
      // Récupérer les processus
      const processesResponse = await apiCall<Process[]>('/processes');
      console.log('⚙️ Processus:', processesResponse);

      // Récupérer les tâches terminées
      const tasksResponse = await apiCall<CompletedTask[]>('/tasks/completed');
      console.log('✅ Tâches terminées:', tasksResponse);
      
      // Filtrer les entrées par type d'habitude
      const learning = (habitsResponse || []).filter((entry: HabitEntry) => 
        entry.habit.name.toLowerCase().includes('apprentissage') && entry.note
      );
      
      const ratings = (habitsResponse || []).filter((entry: HabitEntry) => 
        entry.habit.name.toLowerCase().includes('note de sa journée') && (entry.note || entry.rating)
      );
      
      setLearningEntries(learning);
      setRatingEntries(ratings);
      setProcesses(processesResponse || []);
      setCompletedTasks(tasksResponse || []);
      
    } catch (error) {
      console.error('❌ Erreur lors du chargement:', error);
      Alert.alert(t('error'), t('mySpaceLoadError', undefined, 'Impossible de charger les données'));
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const renderTabButton = (tab: TabType, title: string, icon: string, count?: number) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        activeTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setActiveTab(tab)}
    >
      <View style={styles.tabContent}>
        <Ionicons 
          name={icon as any} 
          size={16} 
          color={activeTab === tab ? '#10B981' : '#6B7280'} 
        />
        <Text style={[
          styles.tabText,
          activeTab === tab && styles.tabTextActive
        ]}>
          {title}
        </Text>
        {(count !== undefined && count > 0) ? (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{count}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const renderLearningCard = (entry: HabitEntry) => (
    <View key={entry.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {t('mySpaceLearningTitle', { date: format(parseISO(entry.date), "d MMMM yyyy", { locale: fr }) }, `Apprentissage du ${format(parseISO(entry.date), "d MMMM yyyy", { locale: fr })}`)}
        </Text>
        <Text style={styles.cardSubtitle}>
          {t('mySpaceAddedOn', { date: format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr }) }, `Ajouté le ${format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}`)}
        </Text>
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.noteText}>{entry.note}</Text>
      </View>
    </View>
  );

  const renderRatingCard = (entry: HabitEntry) => (
    <View key={entry.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>
          {t('mySpaceDayRatingTitle', { date: format(parseISO(entry.date), "d MMMM yyyy", { locale: fr }) }, `Note de journée du ${format(parseISO(entry.date), "d MMMM yyyy", { locale: fr })}`)}
        </Text>
        <Text style={styles.cardSubtitle}>
          {t('mySpaceAddedOn', { date: format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr }) }, `Ajouté le ${format(parseISO(entry.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}`)}
        </Text>
      </View>
      <View style={styles.cardContent}>
        {entry.rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingLabel}>{t('mySpaceRating', undefined, 'Note: ')} </Text>
            <View style={[
              styles.ratingBadge,
              { backgroundColor: entry.rating >= 8 ? '#10B981' : entry.rating >= 5 ? '#F59E0B' : '#EF4444' }
            ]}>
              <Text style={styles.ratingText}>{entry.rating}/10</Text>
            </View>
          </View>
        )}
        {entry.note ? (
          <Text style={styles.noteText}>{entry.note}</Text>
        ) : null}
      </View>
    </View>
  );

  const renderProcessCard = (process: Process) => {
    // Parser la description JSON pour afficher les étapes
    let steps = [];
    try {
      if (process.description && process.description.startsWith('[')) {
        steps = JSON.parse(process.description);
      }
    } catch (error) {
      console.log('Erreur parsing processus:', error);
    }

    return (
      <View key={process.id} style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{process.name}</Text>
          <Text style={styles.cardSubtitle}>
            {t('mySpaceCreatedOn', { date: format(parseISO(process.createdAt), "d MMMM yyyy à HH:mm", { locale: fr }) }, `Créé le ${format(parseISO(process.createdAt), "d MMMM yyyy à HH:mm", { locale: fr })}`)}
          </Text>
        </View>
        <View style={styles.cardContent}>
          {/* Affichage des étapes du processus */}
          {steps.length > 0 ? (
            <View style={styles.processSteps}>
              <Text style={styles.stepsTitle}>{t('mySpaceSteps', undefined, 'Étapes :')}</Text>
              {steps.slice(0, 3).map((step: any, index: number) => (
                <View key={index} style={styles.stepItem}>
                  <Text style={styles.stepNumber}>{index + 1}.</Text>
                  <Text style={styles.stepTitle}>{step.title || t('mySpaceStepLabel', { index: index + 1 }, `Étape ${index + 1}`)}</Text>
                </View>
              ))}
              {steps.length > 3 ? (
                <Text style={styles.moreSteps}>
                  {t('mySpaceMoreSteps', { count: steps.length - 3 }, `... et ${steps.length - 3} autres étapes`)}
                </Text>
              ) : null}
            </View>
          ) : (
            <Text style={styles.noteText}>
              {process.description && !process.description.startsWith('[') 
                ? process.description 
                : t('mySpaceNoDescription', undefined, 'Processus sans description')
              }
            </Text>
          )}
        </View>
      </View>
    );
  };

  const renderTaskCard = (task: CompletedTask) => (
    <View key={task.id} style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{task.title}</Text>
        <Text style={styles.cardSubtitle}>
          {t('mySpaceTaskCompletedOn', { date: format(parseISO(task.completedAt || task.updatedAt), "d MMMM yyyy à HH:mm", { locale: fr }) }, `Terminée le ${format(parseISO(task.completedAt || task.updatedAt), "d MMMM yyyy à HH:mm", { locale: fr })}`)}
        </Text>
      </View>
      <View style={styles.cardContent}>
        {task.description ? (
          <Text style={styles.noteText}>{task.description}</Text>
        ) : null}
        <View style={styles.taskMeta}>
          {task.projectName ? (
            <View style={styles.projectBadge}>
              <Text style={styles.projectText}>{task.projectName}</Text>
            </View>
          ) : null}
          {task.priority ? (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>P{task.priority}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  const renderEmptyState = (message: string, icon: string) => (
    <View style={styles.emptyState}>
      <Ionicons name={icon as any} size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>{t('mySpaceEmpty', undefined, 'Aucun élément')}</Text>
      <Text style={styles.emptyDescription}>{message}</Text>
    </View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'learning':
        return learningEntries.length > 0 
          ? learningEntries.map(renderLearningCard)
          : renderEmptyState(t('mySpaceNoLearning', undefined, "Vous n'avez pas encore enregistré d'apprentissages"), "book-outline");
      
      case 'ratings':
        return ratingEntries.length > 0 
          ? ratingEntries.map(renderRatingCard)
          : renderEmptyState(t('mySpaceNoRatings', undefined, "Vous n'avez pas encore noté de journées"), "calendar-outline");
      
      case 'processes':
        return processes.length > 0 
          ? processes.map(renderProcessCard)
          : renderEmptyState(t('mySpaceNoProcesses', undefined, "Vous n'avez pas encore créé de processus"), "layers-outline");
      
      case 'tasks':
        return completedTasks.length > 0 
          ? completedTasks.map(renderTaskCard)
          : renderEmptyState(t('mySpaceNoTasks', undefined, "Vous n'avez pas encore terminé de tâches"), "checkmark-circle-outline");
      
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>{t('mySpaceLoading', undefined, 'Chargement de votre espace...')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('mySpaceTitle', undefined, 'Mon Espace')}</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContent}
        >
          {renderTabButton('learning', 'Apprentissages', 'book-outline', learningEntries.length)}
          {renderTabButton('ratings', t('mySpaceTabRatings', undefined, 'Notes de journée'), 'calendar-outline', ratingEntries.length)}
          {renderTabButton('processes', t('mySpaceTabProcesses', undefined, 'Mes processus'), 'layers-outline', processes.length)}
          {renderTabButton('tasks', t('mySpaceTabTasks', undefined, 'Tâches terminées'), 'checkmark-circle-outline', completedTasks.length)}
        </ScrollView>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentContainer}>
          {renderTabContent()}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  header: {
    backgroundColor: 'white',
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  tabsContainer: {
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tabButton: {
    marginRight: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  tabButtonActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#10B981',
  },
  tabBadge: {
    backgroundColor: '#10B981',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  tabBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  cardContent: {
    padding: 16,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  taskMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  projectBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  projectText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '500',
  },
  priorityBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: '#D97706',
    fontSize: 12,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
  },
  processSteps: {
    marginTop: 4,
  },
  stepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 8,
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '500',
    color: '#10B981',
    minWidth: 20,
  },
  stepTitle: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
    lineHeight: 20,
  },
  moreSteps: {
    fontSize: 13,
    color: '#6B7280',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 28,
  },
});

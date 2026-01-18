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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { habitsService } from '@/lib/api';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';
import { format, startOfDay, addDays, subDays, isToday, isSameDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Select } from '@/components/ui/Select';
import { LinearGradient } from 'expo-linear-gradient';

interface Habit {
  id: string;
  name: string;
  description?: string;
  color?: string;
  frequency: 'daily' | 'weekly';
  daysOfWeek: string[];
  order: number;
  currentStreak?: number;
  entries?: Array<{
    id: string;
    date: string;
    completed: boolean;
    count: number;
    rating?: number;
    note?: string;
  }>;
}

const DAYS_OF_WEEK = [
  { value: 'monday', label: 'Lundi' },
  { value: 'tuesday', label: 'Mardi' },
  { value: 'wednesday', label: 'Mercredi' },
  { value: 'thursday', label: 'Jeudi' },
  { value: 'friday', label: 'Vendredi' },
  { value: 'saturday', label: 'Samedi' },
  { value: 'sunday', label: 'Dimanche' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Quotidienne' },
  { value: 'weekly', label: 'Hebdomadaire' },
];

const COLOR_OPTIONS = [
  { value: '#4338CA', label: 'Indigo' },
  { value: '#0EA5E9', label: 'Bleu ciel' },
  { value: '#10B981', label: 'Vert' },
  { value: '#F59E0B', label: 'Orange' },
  { value: '#EF4444', label: 'Rouge' },
  { value: '#8B5CF6', label: 'Violet' },
  { value: '#EC4899', label: 'Rose' },
];

export default function HabitsManagerScreen() {
  const { colors } = useTheme();
  const t = useTranslation();
  const router = useRouter();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  const [newHabit, setNewHabit] = useState({
    name: '',
    description: '',
    frequency: 'daily' as 'daily' | 'weekly',
    daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as string[],
    color: '#4338CA',
  });

  const fetchHabits = async () => {
    try {
      setLoading(true);
      console.log('🔄 [HABITS_MANAGER] Récupération des habitudes...');
      const response = await habitsService.getAll();
      console.log('📋 [HABITS_MANAGER] Réponse API:', response);
      
      let habitsData: Habit[] = [];
      if (Array.isArray(response)) {
        habitsData = response;
      } else if (response && response.habits) {
        habitsData = response.habits;
      } else if (response && Array.isArray(response.data)) {
        habitsData = response.data;
      }
      
      console.log('📊 [HABITS_MANAGER] Habitudes traitées:', habitsData.length, habitsData);
      const sortedHabits = habitsData.sort((a, b) => (a.order || 0) - (b.order || 0));
      setHabits(sortedHabits);
      console.log('✅ [HABITS_MANAGER] Habitudes définies dans le state:', sortedHabits.length);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des habitudes:', error);
      Alert.alert(t('error'), t('habitsLoadError', undefined, 'Impossible de charger les habitudes'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      console.log('👁️ [HABITS_MANAGER] useFocusEffect - Chargement des habitudes');
      fetchHabits();
    }, [])
  );

  // Recharger les habitudes quand on revient sur la page après création
  useEffect(() => {
    const unsubscribe = dashboardEvents.on(DASHBOARD_DATA_CHANGED, () => {
      console.log('📢 [HABITS_MANAGER] Événement DASHBOARD_DATA_CHANGED reçu, rechargement...');
      fetchHabits();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: string) => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      const habit = habits.find(h => h.id === habitId);
      if (!habit) return;

      const entries = habit.entries || [];
      const todayEntry = entries.find(e => {
        const entryDate = format(new Date(e.date), 'yyyy-MM-dd');
        return entryDate === dateString;
      });
      const currentCompleted = todayEntry?.completed || false;

      await habitsService.complete(habitId, dateString, currentCompleted);
      await fetchHabits();
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      Alert.alert(t('error'), t('habitsUpdateError', undefined, 'Impossible de mettre à jour l\'habitude'));
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      Alert.alert(t('error'), t('habitsNameRequired', undefined, "Le nom de l'habitude est requis"));
      return;
    }

    if (newHabit.frequency === 'weekly' && newHabit.daysOfWeek.length === 0) {
      Alert.alert(t('error'), t('habitsDayRequired', undefined, 'Veuillez sélectionner au moins un jour de la semaine'));
      return;
    }

    try {
      setCreating(true);
      console.log('➕ [HABITS_MANAGER] Création de l\'habitude:', newHabit);
      const createdHabit = await habitsService.create({
        name: newHabit.name,
        description: newHabit.description,
        frequency: newHabit.frequency,
        daysOfWeek: newHabit.daysOfWeek,
        color: newHabit.color,
      });
      console.log('✅ [HABITS_MANAGER] Habitude créée avec succès:', createdHabit);

      setShowCreateModal(false);
      setNewHabit({
        name: '',
        description: '',
        frequency: 'daily',
        daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        color: '#4338CA',
      });
      
      // Recharger les habitudes immédiatement
      console.log('🔄 [HABITS_MANAGER] Rechargement des habitudes après création...');
      await fetchHabits();
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      console.log('✅ [HABITS_MANAGER] Habitudes rechargées, événement émis');
    } catch (error) {
      console.error('❌ [HABITS_MANAGER] Erreur lors de la création:', error);
      Alert.alert(t('error'), t('habitsCreateError', undefined, "Impossible de créer l'habitude"));
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    Alert.alert(
      t('habitsDeleteTitle', undefined, "Supprimer l'habitude"),
      t('habitsDeleteConfirm', undefined, 'Êtes-vous sûr de vouloir supprimer cette habitude ?'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await habitsService.delete(habitId);
              await fetchHabits();
              dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert(t('error'), t('habitsDeleteError', undefined, "Impossible de supprimer l'habitude"));
            }
          },
        },
      ]
    );
  };

  const toggleDayOfWeek = (day: string) => {
    setNewHabit(prev => ({
      ...prev,
      daysOfWeek: prev.daysOfWeek.includes(day)
        ? prev.daysOfWeek.filter(d => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => {
            const order = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
            return order.indexOf(a) - order.indexOf(b);
          }),
    }));
  };

  const getHabitStatus = (habit: Habit) => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const entries = habit.entries || [];
    const entry = entries.find(e => {
      const entryDate = format(new Date(e.date), 'yyyy-MM-dd');
      return entryDate === dateString;
    });
    return entry?.completed || false;
  };

  const getHabitsForDate = () => {
    // Retourner TOUTES les habitudes, pas seulement celles du jour sélectionné
    // Elles seront marquées comme "non prévues" si elles ne sont pas programmées ce jour
    console.log('🔍 [HABITS_MANAGER] getHabitsForDate - Nombre d\'habitudes:', habits.length);
    return habits;
  };

  const previousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const nextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
  };

  const goToToday = () => {
    setSelectedDate(startOfDay(new Date()));
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const habitsForDate = getHabitsForDate();
  const selectedDateStr = format(selectedDate, 'EEEE d MMMM yyyy', { locale: fr });

  console.log('🎨 [HABITS_MANAGER] Render - habits.length:', habits.length, 'habitsForDate.length:', habitsForDate.length);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Habitudes quotidiennes</Text>
            <TouchableOpacity
              onPress={() => setShowCreateModal(true)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Date Selector */}
        <View style={[styles.dateSelector, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={previousDay} style={styles.dateButton}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={goToToday} style={styles.dateDisplay}>
            <Text style={[styles.dateText, { color: colors.text }]}>{selectedDateStr}</Text>
            {isToday(selectedDate) && (
              <View style={styles.todayBadge}>
                <Text style={styles.todayBadgeText}>Aujourd'hui</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity onPress={nextDay} style={styles.dateButton}>
            <Ionicons name="chevron-forward" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Habits List */}
        <View style={[styles.habitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {habitsForDate.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="checkmark-circle-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>Aucune habitude</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Créez votre première habitude pour commencer
              </Text>
            </View>
          ) : (
            habitsForDate.map((habit, index) => {
              const isCompleted = getHabitStatus(habit);
              // Utiliser toLocaleDateString pour obtenir le nom du jour en anglais (comme dans l'API)
              const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
              const isScheduled = habit.frequency === 'daily' || (habit.daysOfWeek && habit.daysOfWeek.includes(dayName));

              return (
                <Animated.View
                  key={habit.id}
                  entering={FadeInDown.delay(index * 50).duration(300)}
                  style={styles.habitItemWrapper}
                >
                  <View style={styles.habitItem}>
                    <TouchableOpacity
                      onPress={() => isScheduled && handleToggleHabit(habit.id)}
                      activeOpacity={0.8}
                      disabled={!isScheduled}
                      style={[
                        styles.habitCheckbox,
                        isCompleted && styles.habitCheckboxCompleted,
                        { borderColor: isCompleted ? colors.primary : colors.border },
                        !isScheduled && styles.habitCheckboxDisabled
                      ]}
                    >
                      {isCompleted && (
                        <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                      )}
                    </TouchableOpacity>

                    <View style={styles.habitContent}>
                      <View style={styles.habitHeader}>
                        <Text
                          style={[
                            styles.habitName,
                            isCompleted && styles.habitNameCompleted,
                            { color: isCompleted ? colors.textSecondary : colors.text }
                          ]}
                        >
                          {habit.name}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleDeleteHabit(habit.id)}
                          style={styles.deleteButtonHeader}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={18} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                      <View style={styles.habitProgressRow}>
                        <View style={styles.habitProgressBar}>
                          <Animated.View
                            style={[
                              styles.habitProgressFill,
                              { width: isCompleted ? '100%' : '0%' },
                            ]}
                          />
                        </View>
                        <View style={styles.habitStreak}>
                          <Text style={styles.habitStreakText}>
                            {habit.currentStreak !== undefined ? habit.currentStreak : 0}d
                          </Text>
                          <Ionicons name="flame" size={12} color="#00C27A" />
                        </View>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Create Habit Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          setShowCreateModal(false);
          setNewHabit({
            name: '',
            description: '',
            frequency: 'daily',
            daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
            color: '#4338CA',
          });
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
                setNewHabit({
                  name: '',
                  description: '',
                  frequency: 'daily',
                  daysOfWeek: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
                  color: '#4338CA',
                });
              }}
            >
              <Text style={styles.modalCancelButton}>Annuler</Text>
            </TouchableOpacity>

            <Text style={styles.modalTitle}>Nouvelle habitude</Text>

            <TouchableOpacity
              onPress={handleCreateHabit}
              disabled={creating || !newHabit.name.trim()}
              style={[
                styles.modalSaveButton,
                (!newHabit.name.trim() || creating) && styles.modalSaveButtonDisabled
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
            {/* Nom */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nom *</Text>
              <TextInput
                style={styles.formInput}
                value={newHabit.name}
                onChangeText={(text) => setNewHabit(prev => ({ ...prev, name: text }))}
                placeholder="Nom de l'habitude"
                placeholderTextColor="#9ca3af"
                maxLength={100}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Description</Text>
              <TextInput
                style={[styles.formInput, styles.formTextArea]}
                value={newHabit.description}
                onChangeText={(text) => setNewHabit(prev => ({ ...prev, description: text }))}
                placeholder="Description de l'habitude"
                placeholderTextColor="#9ca3af"
                multiline={true}
                numberOfLines={3}
                maxLength={500}
              />
            </View>

            {/* Fréquence */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Fréquence</Text>
              <Select
                value={newHabit.frequency}
                onValueChange={(value) => setNewHabit(prev => ({ ...prev, frequency: value as 'daily' | 'weekly' }))}
                placeholder="Sélectionnez une fréquence"
                options={FREQUENCY_OPTIONS}
              />
            </View>

            {/* Jours de la semaine (si hebdomadaire) */}
            {newHabit.frequency === 'weekly' && (
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Jours de la semaine *</Text>
                <View style={styles.daysContainer}>
                  {DAYS_OF_WEEK.map(day => (
                    <TouchableOpacity
                      key={day.value}
                      onPress={() => toggleDayOfWeek(day.value)}
                      style={[
                        styles.dayButton,
                        newHabit.daysOfWeek.includes(day.value) && styles.dayButtonSelected,
                        { borderColor: colors.border }
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayButtonText,
                          newHabit.daysOfWeek.includes(day.value) && styles.dayButtonTextSelected,
                          { color: newHabit.daysOfWeek.includes(day.value) ? '#FFFFFF' : colors.text }
                        ]}
                      >
                        {day.label.substring(0, 3)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Couleur */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Couleur</Text>
              <View style={styles.colorsContainer}>
                {COLOR_OPTIONS.map(color => (
                  <TouchableOpacity
                    key={color.value}
                    onPress={() => setNewHabit(prev => ({ ...prev, color: color.value }))}
                    style={[
                      styles.colorButton,
                      { backgroundColor: color.value },
                      newHabit.color === color.value && styles.colorButtonSelected
                    ]}
                  >
                    {newHabit.color === color.value && (
                      <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
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
  },
  header: {
    paddingTop: 50,
    paddingBottom: 16,
    marginBottom: 20,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    marginRight: -8,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  dateButton: {
    padding: 8,
  },
  dateDisplay: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: '#00C27A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  habitsCard: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  habitItemWrapper: {
    position: 'relative',
    marginBottom: 12,
    minHeight: 60,
    paddingBottom: 8,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  habitCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckboxCompleted: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  habitCheckboxDisabled: {
    opacity: 0.5,
  },
  habitContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  habitName: {
    fontSize: 14,
    fontWeight: '400',
  },
  habitNameCompleted: {
    color: '#374151',
    fontWeight: '500',
  },
  deleteButtonHeader: {
    padding: 4,
  },
  habitProgressRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginTop: 4,
    position: 'relative',
  },
  habitProgressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  habitProgressFill: {
    height: '100%',
    backgroundColor: '#00C27A',
    borderRadius: 3,
  },
  habitStreak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  habitStreakText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C27A',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSaveButton: {
    backgroundColor: '#00C27A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  modalSaveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  formTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 60,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#00C27A',
    borderColor: '#00C27A',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
  colorsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonSelected: {
    borderColor: '#1F2937',
  },
  modalBottomPadding: {
    height: 40,
  },
});

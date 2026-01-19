import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Modal, TextInput, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { habitsService } from '@/lib/api';
import { format, startOfDay } from 'date-fns';

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY';
  daysOfWeek?: string[];
  category?: 'MORNING' | 'DAY' | 'EVENING' | 'ANTI';
  order?: number;
  entries?: {
    id: string;
    date: string;
    completed: boolean;
    count: number;
  }[];
}

export function ReviewHabits() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate] = useState(() => startOfDay(new Date()));
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitDaily, setNewHabitDaily] = useState(true);
  const [newHabitDaysOfWeek, setNewHabitDaysOfWeek] = useState<string[]>(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
  const [creating, setCreating] = useState(false);
  const [showActionMenu, setShowActionMenu] = useState<string | null>(null);

  const fetchHabits = async () => {
    try {
      setLoading(true);
      console.log('🔄 Récupération des habitudes...');
      const response = await habitsService.getAll();
      console.log('📋 Habitudes récupérées:', response);
      
      // Gérer différents formats de réponse
      let habitsData = [];
      if (Array.isArray(response)) {
        habitsData = response;
      } else if (response && response.habits) {
        habitsData = response.habits;
      } else if (response && Array.isArray(response.data)) {
        habitsData = response.data;
      }
      
      console.log('📊 Habitudes traitées:', habitsData);
      setHabits(habitsData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des habitudes:', error);
      Alert.alert('Erreur', 'Impossible de charger les habitudes');
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [])
  );

  const toggleHabit = async (habitId: string) => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const habit = habits.find(h => h.id === habitId);
    const entry = habit?.entries?.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateString);
    const currentCompleted = entry?.completed ?? false;
    const newCompleted = !currentCompleted;
    
    // Optimistic update - mise à jour immédiate de l'UI
    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      
      const existingEntries = h.entries || [];
      const entryIndex = existingEntries.findIndex(e => format(new Date(e.date), 'yyyy-MM-dd') === dateString);
      
      let updatedEntries;
      if (entryIndex >= 0) {
        updatedEntries = existingEntries.map((e, idx) => 
          idx === entryIndex ? { ...e, completed: newCompleted } : e
        );
      } else {
        updatedEntries = [...existingEntries, {
          id: `temp-${Date.now()}`,
          date: selectedDate.toISOString(),
          completed: newCompleted,
          count: 1,
        }];
      }
      
      return { ...h, entries: updatedEntries };
    }));
    
    // Appel API en arrière-plan
    try {
      await habitsService.complete(habitId, dateString, currentCompleted);
    } catch (error) {
      console.error('❌ Erreur lors du toggle:', error);
      // Rollback en cas d'erreur
      setHabits(prev => prev.map(h => {
        if (h.id !== habitId) return h;
        const existingEntries = h.entries || [];
        const entryIndex = existingEntries.findIndex(e => format(new Date(e.date), 'yyyy-MM-dd') === dateString);
        
        if (entryIndex >= 0) {
          const updatedEntries = existingEntries.map((e, idx) => 
            idx === entryIndex ? { ...e, completed: currentCompleted } : e
          );
          return { ...h, entries: updatedEntries };
        }
        return h;
      }));
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'habitude');
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Erreur', 'Le nom est requis');
      return;
    }
    if (!newHabitDaily && newHabitDaysOfWeek.length === 0) {
      Alert.alert('Erreur', 'Sélectionnez au moins un jour');
      return;
    }
    
    setCreating(true);
    try {
      await habitsService.create({
        name: newHabitName.trim(),
        description: newHabitDescription.trim() || undefined,
        frequency: newHabitDaily ? 'daily' : 'weekly',
        daysOfWeek: newHabitDaysOfWeek,
      });
      setShowCreateModal(false);
      setNewHabitName('');
      setNewHabitDescription('');
      setNewHabitDaily(true);
      setNewHabitDaysOfWeek(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
      await fetchHabits();
    } catch (e: any) {
      console.error('Erreur création habitude:', e);
      Alert.alert('Erreur', e?.message || 'Création impossible');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    Alert.alert(
      'Supprimer l\'habitude',
      'Êtes-vous sûr de vouloir supprimer cette habitude ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await habitsService.delete(habitId);
              setHabits(prev => prev.filter(h => h.id !== habitId));
              setShowActionMenu(null);
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', 'Impossible de supprimer l\'habitude');
            }
          },
        },
      ]
    );
  };

  const handleMoveHabit = async (habitId: string, direction: 'up' | 'down') => {
    const category = getHabitCategory(habits.find(h => h.id === habitId)!);
    const categoryHabits = getHabitsByCategory(category);
    const currentIndex = categoryHabits.findIndex(h => h.id === habitId);
    
    if (direction === 'up' && currentIndex === 0) return;
    if (direction === 'down' && currentIndex === categoryHabits.length - 1) return;
    
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    const targetHabit = categoryHabits[newIndex];
    
    // Échanger les ordres
    const currentHabit = categoryHabits[currentIndex];
    const currentOrder = currentHabit.order ?? currentIndex;
    const targetOrder = targetHabit.order ?? newIndex;
    
    try {
      // Mise à jour optimiste
      setHabits(prev => prev.map(h => {
        if (h.id === habitId) return { ...h, order: targetOrder };
        if (h.id === targetHabit.id) return { ...h, order: currentOrder };
        return h;
      }));
      
      // Appel API
      await habitsService.update(habitId, { order: targetOrder });
      await habitsService.update(targetHabit.id, { order: currentOrder });
      
      setShowActionMenu(null);
    } catch (error) {
      console.error('Erreur lors du déplacement:', error);
      Alert.alert('Erreur', 'Impossible de déplacer l\'habitude');
      // Rollback
      await fetchHabits();
    }
  };

  const getHabitCategory = (habit: Habit): 'morning' | 'day' | 'evening' | 'anti-habit' => {
    const category = habit.category || 'DAY';
    if (category === 'MORNING') return 'morning';
    if (category === 'EVENING') return 'evening';
    if (category === 'ANTI') return 'anti-habit';
    return 'day';
  };

  const isHabitCompleted = (habit: Habit): boolean => {
    const dateString = format(selectedDate, 'yyyy-MM-dd');
    const entry = habit.entries?.find(e => format(new Date(e.date), 'yyyy-MM-dd') === dateString);
    return entry?.completed ?? false;
  };

  const getHabitsByCategory = (category: 'morning' | 'day' | 'evening' | 'anti-habit') => {
    return habits
      .filter(h => getHabitCategory(h) === category)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  };

  const DAYS = [
    { key: 'monday', label: 'Lun' },
    { key: 'tuesday', label: 'Mar' },
    { key: 'wednesday', label: 'Mer' },
    { key: 'thursday', label: 'Jeu' },
    { key: 'friday', label: 'Ven' },
    { key: 'saturday', label: 'Sam' },
    { key: 'sunday', label: 'Dim' },
  ];

  const toggleDay = (day: string) => {
    setNewHabitDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  // Composant HabitCard avec animation selon le design
  const HabitCard = ({ 
    habit, 
    isCompleted, 
    onToggle,
    onLongPress,
    showMenu,
    onDelete,
    onMoveUp,
    onMoveDown,
    canMoveUp,
    canMoveDown,
  }: { 
    habit: Habit; 
    isCompleted: boolean; 
    onToggle: () => void;
    onLongPress: () => void;
    showMenu: boolean;
    onDelete: () => void;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  }) => {
    const checkboxScale = useSharedValue(isCompleted ? 1 : 0);
    const cardScale = useSharedValue(1);

    useEffect(() => {
      checkboxScale.value = withSpring(isCompleted ? 1 : 0, {
        damping: 12,
        stiffness: 300,
      });
    }, [isCompleted]);

    const animatedCheckboxStyle = useAnimatedStyle(() => ({
      transform: [{ scale: checkboxScale.value }],
      opacity: checkboxScale.value,
    }));

    const animatedCardStyle = useAnimatedStyle(() => ({
      transform: [{ scale: cardScale.value }],
    }));

    const handlePressIn = () => {
      cardScale.value = withSpring(0.98, {
        damping: 15,
        stiffness: 400,
      });
    };

    const handlePressOut = () => {
      cardScale.value = withSpring(1, {
        damping: 15,
        stiffness: 400,
      });
    };

    return (
      <Animated.View style={animatedCardStyle}>
        <TouchableOpacity
          style={[
            styles.habitCard,
            isCompleted && styles.habitCardCompleted,
          ]}
          onPress={onToggle}
          onLongPress={onLongPress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={styles.habitContent}>
            <Animated.View
              style={[
                styles.habitCheckbox,
                isCompleted && styles.habitCheckboxCompleted,
              ]}
            >
              {isCompleted && (
                <Animated.View style={[styles.checkmarkDot, animatedCheckboxStyle]} />
              )}
            </Animated.View>
            <View style={styles.habitTextContainer}>
              <Text
                style={[
                  styles.habitName,
                  isCompleted && styles.habitNameCompleted,
                ]}
              >
                {habit.name}
              </Text>
            </View>
          </View>
          
          {/* Menu d'actions */}
          {showMenu && (
            <Animated.View 
              entering={FadeInDown.duration(200)}
              style={styles.actionMenu}
            >
              <TouchableOpacity 
                style={styles.actionMenuItem}
                onPress={onDelete}
              >
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
                <Text style={styles.actionMenuTextDelete}>Supprimer</Text>
              </TouchableOpacity>
              
              <View style={styles.actionMenuDivider} />
              
              <TouchableOpacity 
                style={[styles.actionMenuItem, !canMoveUp && styles.actionMenuItemDisabled]}
                onPress={canMoveUp ? onMoveUp : undefined}
                disabled={!canMoveUp}
              >
                <Ionicons name="arrow-up-outline" size={18} color={canMoveUp ? "#000" : "#9CA3AF"} />
                <Text style={[styles.actionMenuText, !canMoveUp && styles.actionMenuTextDisabled]}>
                  Monter
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionMenuItem, !canMoveDown && styles.actionMenuItemDisabled]}
                onPress={canMoveDown ? onMoveDown : undefined}
                disabled={!canMoveDown}
              >
                <Ionicons name="arrow-down-outline" size={18} color={canMoveDown ? "#000" : "#9CA3AF"} />
                <Text style={[styles.actionMenuText, !canMoveDown && styles.actionMenuTextDisabled]}>
                  Descendre
                </Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </TouchableOpacity>
      </Animated.View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#16A34A" />
        <Text style={{ marginTop: 16, color: 'rgba(0, 0, 0, 0.6)' }}>Chargement des habitudes...</Text>
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
        {/* Header - Design System */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color="#000" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Habits</Text>
            <Text style={styles.headerSubtitle}>Consistency matters more than intensity.</Text>
          </View>
        </Animated.View>

        {/* Add Habit Button - Design System */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.addHabitSection}>
          <TouchableOpacity
            style={styles.addHabitButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addHabitText}>Add Habit</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Regular Habits - Design System */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.habitsSection}>
          <View style={styles.habitsList}>
            {getHabitsByCategory('morning').concat(
              getHabitsByCategory('day'),
              getHabitsByCategory('evening')
            ).map((habit, index) => {
              const allHabits = getHabitsByCategory('morning').concat(
                getHabitsByCategory('day'),
                getHabitsByCategory('evening')
              );
              return (
                <HabitCard
                  key={habit.id}
                  habit={habit}
                  isCompleted={isHabitCompleted(habit)}
                  onToggle={() => toggleHabit(habit.id)}
                  onLongPress={() => setShowActionMenu(showActionMenu === habit.id ? null : habit.id)}
                  showMenu={showActionMenu === habit.id}
                  onDelete={() => handleDeleteHabit(habit.id)}
                  onMoveUp={() => handleMoveHabit(habit.id, 'up')}
                  onMoveDown={() => handleMoveHabit(habit.id, 'down')}
                  canMoveUp={index > 0}
                  canMoveDown={index < allHabits.length - 1}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Anti-habits - Design System */}
        {getHabitsByCategory('anti-habit').length > 0 && (
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.antiHabitsSection}>
            <Text style={styles.antiHabitsTitle}>Avoid</Text>
            <View style={styles.antiHabitsList}>
              {getHabitsByCategory('anti-habit').map((habit) => (
                <View key={habit.id} style={styles.antiHabitCard}>
                  <Text style={styles.antiHabitText}>{habit.name}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Overlay pour fermer le menu */}
      {showActionMenu && (
        <TouchableOpacity
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowActionMenu(null)}
        />
      )}

      {/* Create Habit Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Habit</Text>
            
            <Text style={styles.modalLabel}>Nom</Text>
            <TextInput 
              placeholder="Ex: Sport, Lecture..." 
              value={newHabitName} 
              onChangeText={setNewHabitName}
              style={styles.modalInput}
            />
            
            <Text style={styles.modalLabel}>Description (optionnel)</Text>
            <TextInput 
              placeholder="Détails" 
              value={newHabitDescription} 
              onChangeText={setNewHabitDescription}
              style={styles.modalInput}
            />
            
            <View style={styles.modalSwitchRow}>
              <Text style={styles.modalSwitchLabel}>Quotidienne</Text>
              <Switch value={newHabitDaily} onValueChange={setNewHabitDaily} trackColor={{ true: '#16A34A' }} />
            </View>
            
            {!newHabitDaily && (
              <View style={styles.modalDaysContainer}>
                <Text style={styles.modalLabel}>Jours de la semaine</Text>
                <View style={styles.modalDaysRow}>
                  {DAYS.map(d => (
                    <TouchableOpacity
                      key={d.key}
                      onPress={() => toggleDay(d.key)}
                      style={[
                        styles.modalDayButton,
                        newHabitDaysOfWeek.includes(d.key) && styles.modalDayButtonActive
                      ]}
                    >
                      <Text style={[
                        styles.modalDayText,
                        newHabitDaysOfWeek.includes(d.key) && styles.modalDayTextActive
                      ]}>
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={handleCreateHabit} 
                disabled={creating} 
                style={[styles.modalCreateButton, creating && styles.modalCreateButtonDisabled]}
              >
                <Text style={styles.modalCreateText}>
                  {creating ? 'Enregistrement...' : 'Créer'}
                </Text>
              </TouchableOpacity>
            </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  header: {
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    marginBottom: 0,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerContent: {
    gap: 12,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.28, // -0.04em * 32
    color: '#000000',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  addHabitSection: {
    marginTop: 32,
    marginBottom: 32,
  },
  addHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    gap: 8,
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addHabitText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  habitsSection: {
    marginBottom: 48,
  },
  habitsList: {
    gap: 16,
  },
  habitCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    borderRadius: 24, // rounded-3xl
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  habitCardCompleted: {
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.05)', // #16A34A/5
  },
  habitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  habitCheckbox: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.2)', // border-black/20
    justifyContent: 'center',
    alignItems: 'center',
  },
  habitCheckboxCompleted: {
    borderColor: '#16A34A',
    backgroundColor: '#16A34A',
  },
  checkmarkDot: {
    width: 12, // w-3
    height: 12, // h-3
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  habitTextContainer: {
    flex: 1,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  habitNameCompleted: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  antiHabitsSection: {
    marginTop: 48,
    marginBottom: 32,
  },
  antiHabitsTitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 16,
    fontWeight: '500',
  },
  antiHabitsList: {
    gap: 12,
  },
  antiHabitCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: 'rgba(0, 0, 0, 0.05)', // bg-black/5
  },
  antiHabitText: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  actionMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
    overflow: 'hidden',
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  actionMenuItemDisabled: {
    opacity: 0.5,
  },
  actionMenuText: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },
  actionMenuTextDelete: {
    fontSize: 16,
    color: '#EF4444',
    fontWeight: '500',
  },
  actionMenuTextDisabled: {
    color: '#9CA3AF',
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    marginHorizontal: 12,
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 999,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  modalLabel: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 8,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  modalSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalSwitchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalDaysContainer: {
    marginBottom: 16,
  },
  modalDaysRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  modalDayButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalDayButtonActive: {
    backgroundColor: '#16A34A',
  },
  modalDayText: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  modalDayTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  modalCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  modalCancelText: {
    color: 'rgba(0, 0, 0, 0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCreateButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalCreateButtonDisabled: {
    opacity: 0.5,
  },
  modalCreateText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

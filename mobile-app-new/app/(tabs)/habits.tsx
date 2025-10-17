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
  Dimensions,
  Animated,
  Modal,
  TextInput,
  Switch,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { habitsService } from '@/lib/api';
import { dashboardEvents, DASHBOARD_DATA_CHANGED } from '@/lib/events';
import { format, addDays, startOfDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import Svg, { Circle } from 'react-native-svg';
import { HabitNoteModal } from '@/components/habits/HabitNoteModal';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px padding on each side

interface Habit {
  id: string;
  name: string;
  description?: string;
  frequency: 'DAILY' | 'WEEKLY';
  targetCount: number;
  createdAt: string;
  daysOfWeek: string[];
  completions?: Array<{
    id: string;
    date: string;
    completed: boolean;
    count: number;
    rating?: number;
    note?: string;
  }>;
  entries?: Array<{
    id: string;
    date: string;
    completed: boolean;
    count: number;
    rating?: number;
    note?: string;
  }>;
}

interface HabitCardProps {
  habit: Habit;
  selectedDate: Date;
  onToggle: (habitId: string, date: Date, currentCompleted: boolean) => Promise<void>;
  onSaveWithNote: (habitId: string, date: Date, note: string, rating?: number) => Promise<void>;
  isUpdating: boolean;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const HabitCard: React.FC<HabitCardProps> = ({ habit, selectedDate, onToggle, onSaveWithNote, isUpdating }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const colorAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const cardColorAnim = useRef(new Animated.Value(0)).current;
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Trouver l'entrée pour la date sélectionnée
  const dateString = format(selectedDate, 'yyyy-MM-dd');
  const allEntries = habit.completions || habit.entries || [];
  const entry = allEntries.find((e) => {
    const entryDateString = format(new Date(e.date), 'yyyy-MM-dd');
    return entryDateString === dateString;
  });

  const isCompleted = entry?.completed ?? false;
  
  // Debug logs (commenté pour réduire le bruit)
  // console.log(`🔍 Habitude "${habit.name}" pour ${dateString}:`, {
  //   allEntries: allEntries.length,
  //   entry: entry ? { id: entry.id, completed: entry.completed, date: entry.date } : null,
  //   isCompleted
  // });

  // Vérifier si c'est un jour prévu pour cette habitude
  const dayName = selectedDate.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  const isScheduledDay = habit.daysOfWeek?.includes(dayName) ?? true;

  // Identifier les habitudes spéciales
  const isLearningHabit = habit.name.toLowerCase().includes("apprentissage");
  const isDayNoteHabit = habit.name.toLowerCase().includes("note de sa journée") || 
                        habit.name.toLowerCase().includes("note de la journée") ||
                        (habit.name.toLowerCase().includes("note") && habit.name.toLowerCase().includes("journée"));
  const isSpecialHabit = isLearningHabit || isDayNoteHabit;

  // Animer les changements de couleur et progression
  useEffect(() => {
    const targetProgress = isCompleted ? 1 : 0;
    const targetColor = isCompleted ? 1 : 0;

    // Animations séparées pour éviter les conflits native/JS driver
    Animated.spring(progressAnim, {
      toValue: targetProgress,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    Animated.spring(colorAnim, {
      toValue: targetColor,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();

    Animated.spring(cardColorAnim, {
      toValue: targetColor,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  }, [isCompleted]);

  const handleToggle = async () => {
    if (isUpdating) return;

    // Animation de pression (utiliser le même driver pour éviter les conflits)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();

    try {
      await onToggle(habit.id, selectedDate, isCompleted);
    } catch (error) {
      console.error('❌ Erreur toggle habitude:', error);
    }
  };

  const handleSaveNote = async (note: string, rating?: number) => {
    try {
      await onSaveWithNote(habit.id, selectedDate, note, rating);
    } catch (error) {
      console.error('❌ Erreur sauvegarde note:', error);
      throw error; // Re-throw pour que la modal gère l'erreur
    }
  };

  // Calcul du cercle de progression
  const radius = 50;
  const circumference = 2 * Math.PI * radius;

  // Interpolations pour les couleurs animées
  const strokeColor = colorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EF4444', '#10B981'],
  });

  const indicatorColor = cardColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#EF4444', '#10B981'],
  });

  const cardBackgroundColor = cardColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(255, 255, 255, 1)', 'rgba(16, 185, 129, 0.05)'],
  });

  const strokeDashoffset = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  return (
    <Animated.View style={[
      styles.habitCard,
      { 
        transform: [{ scale: scaleAnim }],
        backgroundColor: cardBackgroundColor,
      }
    ]}>
      {/* Indicateur de couleur animé */}
      <Animated.View 
        style={[
          styles.colorIndicator,
          { backgroundColor: indicatorColor }
        ]} 
      />

      {/* Badge de statut animé */}
      {isCompleted && (
        <Animated.View 
          style={[
            styles.statusBadge,
            {
              opacity: colorAnim,
              transform: [{
                scale: colorAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 1],
                })
              }]
            }
          ]}
        >
          <View style={styles.statusDot} />
        </Animated.View>
      )}

      {/* Nom de l'habitude */}
      <View style={styles.habitHeader}>
        <Text style={styles.habitName}>{habit.name}</Text>
        {!isScheduledDay ? (
          <View style={styles.notScheduledBadge}>
            <Text style={styles.notScheduledText}>Non prévu aujourd'hui</Text>
          </View>
        ) : (
          <Text style={styles.habitDescription}>
            {habit.description || "Cliquez pour compléter"}
          </Text>
        )}
      </View>

      {/* Cercle de progression animé */}
      <TouchableOpacity 
        style={styles.progressContainer} 
        onPress={handleToggle}
        disabled={isUpdating}
        activeOpacity={0.8}
      >
        <View style={styles.circleContainer}>
          <Svg width="112" height="112" style={styles.progressCircle}>
            {/* Cercle de fond */}
            <Circle
              cx="56"
              cy="56"
              r={radius}
              stroke="#F3F4F6"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Cercle de progression animé */}
            <AnimatedCircle
              cx="56"
              cy="56"
              r={radius}
              stroke={strokeColor}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform="rotate(-90 56 56)"
            />
          </Svg>
          
          {/* Valeur au centre animée */}
          <View style={styles.progressValue}>
            <Animated.Text style={[
              styles.progressText,
              { color: strokeColor }
            ]}>
              {isCompleted ? '1' : '0'}
            </Animated.Text>
          </View>

          {/* Pas de spinner pour garder l'impression d'instantanéité */}
        </View>
      </TouchableOpacity>

      {/* Boutons d'action animés */}
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={[
            styles.actionButton,
            !isCompleted && styles.actionButtonActive
          ]}
          onPress={handleToggle}
          disabled={isUpdating}
        >
          <Ionicons 
            name="add" 
            size={20} 
            color={!isCompleted ? '#10B981' : '#9CA3AF'} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.actionButton,
            isCompleted && styles.actionButtonActive
          ]}
          onPress={handleToggle}
          disabled={isUpdating}
        >
          <Ionicons 
            name="remove" 
            size={20} 
            color={isCompleted ? '#EF4444' : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Bouton spécial pour les habitudes d'apprentissage/notes */}
      {isSpecialHabit && isScheduledDay && (
        <TouchableOpacity
          style={styles.specialButton}
          onPress={() => setShowNoteModal(true)}
          disabled={isUpdating}
        >
          <Text style={styles.specialButtonIcon}>
            {isLearningHabit ? "✏️" : "📝"}
          </Text>
          <Text style={styles.specialButtonText}>
            {isLearningHabit ? "Ajouter apprentissage" : "Ajouter note"}
          </Text>
        </TouchableOpacity>
      )}

      {/* Modal pour les notes et apprentissages */}
      <HabitNoteModal
        habit={habit}
        isOpen={showNoteModal}
        onClose={() => setShowNoteModal(false)}
        onSave={handleSaveNote}
        initialNote={entry?.note || ""}
        initialRating={entry?.rating}
      />
    </Animated.View>
  );
};

export default function HabitsScreen() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [updatingHabits, setUpdatingHabits] = useState<Set<string>>(new Set());
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Animation pour le swipe
  const translateX = useRef(new Animated.Value(0)).current;
  const gestureState = useRef({ isActive: false }).current;

  const fetchHabits = async () => {
    try {
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
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchHabits();
    }, [])
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: string, date: Date, currentCompleted: boolean) => {
    // Optimistic UI: bascule immédiatement côté client
    const dateString = format(date, 'yyyy-MM-dd');
    console.log(`🔄 Toggle (optimiste) habitude ${habitId} pour ${dateString}, actuellement: ${currentCompleted}`);

    setUpdatingHabits(prev => new Set([...prev, habitId]));

    // Snapshot pour rollback en cas d'échec
    const previous = habits;

    setHabits(prev => prev.map(h => {
      if (h.id !== habitId) return h;
      const allEntries = (h.completions || h.entries || []) as any[];
      const entryIndex = allEntries.findIndex(e => format(new Date(e.date), 'yyyy-MM-dd') === dateString);
      const toggled = !currentCompleted;
      if (entryIndex >= 0) {
        allEntries[entryIndex] = { ...allEntries[entryIndex], completed: toggled };
      } else {
        allEntries.push({ id: `local-${Date.now()}`, date: date.toISOString(), completed: toggled, count: 1 });
      }
      return { ...h, entries: allEntries, completions: undefined } as any;
    }));

    try {
      const response = await habitsService.complete(habitId, dateString, currentCompleted);
      console.log('✅ Réponse API:', response);
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour (rollback):', error);
      Alert.alert('Erreur', 'Impossible de mettre à jour l\'habitude');
      // Rollback
      setHabits(previous);
    } finally {
      setUpdatingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const handleSaveWithNote = async (habitId: string, date: Date, note: string, rating?: number) => {
    // Ajouter l'habitude aux habitudes en cours de mise à jour
    setUpdatingHabits(prev => new Set([...prev, habitId]));
    
    try {
      const dateString = format(date, 'yyyy-MM-dd');
      console.log(`📝 Sauvegarde note pour habitude ${habitId} le ${dateString}:`, { note, rating });
      
      const response = await habitsService.saveWithNote(habitId, dateString, note, rating);
      console.log('✅ Réponse API:', response);
      
      // Recharger les habitudes pour mettre à jour l'affichage
      await fetchHabits();
      // Notifier le dashboard
      dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
      
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde avec note:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la note');
      throw error;
    } finally {
      // Retirer l'habitude des habitudes en cours de mise à jour
      setUpdatingHabits(prev => {
        const newSet = new Set(prev);
        newSet.delete(habitId);
        return newSet;
      });
    }
  };

  const handlePreviousDay = () => {
    setSelectedDate(prev => addDays(prev, -1));
    setCurrentCardIndex(0);
  };

  const handleNextDay = () => {
    setSelectedDate(prev => addDays(prev, 1));
    setCurrentCardIndex(0);
  };

  const handleToday = () => {
    setSelectedDate(startOfDay(new Date()));
    setCurrentCardIndex(0);
  };

  const handlePreviousCard = () => {
    const newIndex = Math.max(0, currentCardIndex - 1);
    setCurrentCardIndex(newIndex);
    animateToCard(newIndex);
  };

  const handleNextCard = () => {
    const newIndex = Math.min(habits.length - 1, currentCardIndex + 1);
    setCurrentCardIndex(newIndex);
    animateToCard(newIndex);
  };

  const animateToCard = (index: number) => {
    Animated.spring(translateX, {
      toValue: -index * CARD_WIDTH,
      useNativeDriver: true,
      tension: 100,
      friction: 8,
    }).start();
  };

  // Gestionnaire de swipe
  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.BEGAN) {
      gestureState.isActive = true;
    } else if (event.nativeEvent.state === State.END) {
      gestureState.isActive = false;
      const { translationX: translation, velocityX } = event.nativeEvent;
      
      let newIndex = currentCardIndex;
      
      // Déterminer la direction du swipe
      if (Math.abs(translation) > CARD_WIDTH * 0.3 || Math.abs(velocityX) > 500) {
        if (translation < 0 && currentCardIndex < habits.length - 1) {
          // Swipe vers la gauche - carte suivante
          newIndex = currentCardIndex + 1;
        } else if (translation > 0 && currentCardIndex > 0) {
          // Swipe vers la droite - carte précédente
          newIndex = currentCardIndex - 1;
        }
      }
      
      setCurrentCardIndex(newIndex);
      animateToCard(newIndex);
    }
  };

  // Réinitialiser l'animation quand on change de date
  useEffect(() => {
    animateToCard(currentCardIndex);
  }, [selectedDate]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Chargement des habitudes...</Text>
      </View>
    );
  }

  const currentHabit = habits[currentCardIndex];
  const isToday = selectedDate.toDateString() === new Date().toDateString();

  return (
    <View style={styles.container}>
      {/* En-tête avec navigation de date */}
      <View style={styles.header}>
        <View style={styles.dateNavigation}>
          <TouchableOpacity style={styles.navButton} onPress={handlePreviousDay}>
            <Ionicons name="chevron-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dateContainer} onPress={handleToday}>
            <Text style={styles.dateText}>
              {format(selectedDate, 'EEEE d MMMM', { locale: fr })}
            </Text>
            <Text style={styles.dateSubtext}>
              {isToday ? "Aujourd'hui" : format(selectedDate, 'yyyy')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navButton} onPress={handleNextDay}>
            <Ionicons name="chevron-forward" size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* Indicateurs de progression */}
        {habits.length > 0 && (
          <View style={styles.progressIndicators}>
            {habits.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.progressDot,
                  index === currentCardIndex && styles.progressDotActive
                ]}
              />
            ))}
          </View>
        )}
        
        {/* Bouton pour créer une nouvelle habitude */}
        <TouchableOpacity 
          style={styles.createHabitButton} 
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.createHabitButtonText}>Nouvelle habitude</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {habits.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="leaf-outline" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTitle}>Aucune habitude</Text>
            <Text style={styles.emptyDescription}>
              Commencez par créer votre première habitude pour suivre vos progrès quotidiens.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={() => setShowCreateModal(true)}>
              <Ionicons name="add" size={24} color="white" />
              <Text style={styles.createButtonText}>Nouvelle habitude</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {/* Container pour les cartes avec swipe */}
            <PanGestureHandler
              onGestureEvent={onGestureEvent}
              onHandlerStateChange={onHandlerStateChange}
            >
              <Animated.View 
                style={[
                  styles.cardsWrapper,
                  { 
                    transform: [{ translateX }],
                    width: habits.length * CARD_WIDTH,
                  }
                ]}
              >
                {habits.map((habit, index) => (
                  <View key={habit.id} style={styles.cardWrapper}>
                    <HabitCard
                      habit={habit}
                      selectedDate={selectedDate}
                      onToggle={handleToggleHabit}
                      onSaveWithNote={handleSaveWithNote}
                      isUpdating={updatingHabits.has(habit.id)}
                    />
                  </View>
                ))}
              </Animated.View>
            </PanGestureHandler>

            {/* Navigation entre les cartes */}
            {habits.length > 1 && (
              <View style={styles.cardNavigation}>
                <TouchableOpacity 
                  style={[
                    styles.cardNavButton,
                    currentCardIndex === 0 && styles.cardNavButtonDisabled
                  ]}
                  onPress={handlePreviousCard}
                  disabled={currentCardIndex === 0}
                >
                  <Ionicons 
                    name="chevron-back" 
                    size={20} 
                    color={currentCardIndex === 0 ? '#9CA3AF' : '#374151'} 
                  />
                </TouchableOpacity>
                
                <Text style={styles.cardCounter}>
                  {currentCardIndex + 1} / {habits.length}
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.cardNavButton,
                    currentCardIndex === habits.length - 1 && styles.cardNavButtonDisabled
                  ]}
                  onPress={handleNextCard}
                  disabled={currentCardIndex === habits.length - 1}
                >
                  <Ionicons 
                    name="chevron-forward" 
                    size={20} 
                    color={currentCardIndex === habits.length - 1 ? '#9CA3AF' : '#374151'} 
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Bouton flottant pour ajouter une habitude */}
      <TouchableOpacity style={styles.floatingButton} onPress={() => setShowCreateModal(true)}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
      {/* Modal de création d'habitude */}
      <CreateHabitModal 
        visible={showCreateModal} 
        onClose={() => setShowCreateModal(false)} 
        onCreated={async () => {
          setShowCreateModal(false);
          await fetchHabits();
          dashboardEvents.emit(DASHBOARD_DATA_CHANGED);
        }}
      />
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
    paddingBottom: 20,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  dateContainer: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 16,
  },
  dateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    textAlign: 'center',
  },
  dateSubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  progressIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: '#10B981',
    width: 24,
  },
  content: {
    flex: 1,
  },
  cardsContainer: {
    padding: 16,
    height: 600, // Hauteur fixe pour le container de swipe
  },
  cardsWrapper: {
    flexDirection: 'row',
  },
  cardWrapper: {
    width: CARD_WIDTH,
    paddingRight: 0,
  },
  habitCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    position: 'relative',
  },
  colorIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 6,
    height: '100%',
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  habitHeader: {
    marginBottom: 24,
  },
  habitName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  notScheduledBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  notScheduledText: {
    fontSize: 12,
    color: '#6B7280',
  },
  habitDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circleContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    transform: [{ rotate: '-90deg' }],
  },
  progressValue: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressText: {
    fontSize: 32,
    fontWeight: '700',
  },
  loadingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 56,
    width: 112,
    height: 112,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonActive: {
    backgroundColor: '#E5E7EB',
  },
  specialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  specialButtonIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  specialButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cardNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 16,
  },
  cardNavButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  cardNavButtonDisabled: {
    opacity: 0.5,
  },
  cardCounter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  floatingButton: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  createHabitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createHabitButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
});

const DAYS: { key: string; label: string }[] = [
  { key: 'monday', label: 'Lun' },
  { key: 'tuesday', label: 'Mar' },
  { key: 'wednesday', label: 'Mer' },
  { key: 'thursday', label: 'Jeu' },
  { key: 'friday', label: 'Ven' },
  { key: 'saturday', label: 'Sam' },
  { key: 'sunday', label: 'Dim' },
];

function CreateHabitModal({ visible, onClose, onCreated }: { visible: boolean; onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [daily, setDaily] = useState(true);
  const [daysOfWeek, setDaysOfWeek] = useState<string[]>(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
  const [loading, setLoading] = useState(false);

  const toggleDay = (day: string) => {
    setDaysOfWeek(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSave = async () => {
    if (!name.trim()) return Alert.alert('Erreur', "Le nom est requis");
    if (!daily && daysOfWeek.length === 0) return Alert.alert('Erreur', 'Sélectionnez au moins un jour');
    setLoading(true);
    try {
      await habitsService.create({
        name: name.trim(),
        description: description.trim() || undefined,
        frequency: daily ? 'daily' : 'weekly',
        daysOfWeek,
      });
      onCreated();
      setName('');
      setDescription('');
      setDaily(true);
      setDaysOfWeek(['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);
    } catch (e: any) {
      console.error('Erreur création habitude:', e);
      Alert.alert('Erreur', e?.message || "Création impossible");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.3)', justifyContent:'flex-end' }}>
        <View style={{ backgroundColor:'#fff', borderTopLeftRadius:16, borderTopRightRadius:16, padding:16 }}>
          <Text style={{ fontSize:18, fontWeight:'700', marginBottom:12 }}>Nouvelle habitude</Text>
          <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Nom</Text>
          <TextInput 
            placeholder="Ex: Sport, Lecture..." 
            value={name} 
            onChangeText={setName}
            style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:12, marginBottom:12 }}
          />
          <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Description (optionnel)</Text>
          <TextInput 
            placeholder="Détails" 
            value={description} 
            onChangeText={setDescription}
            style={{ borderWidth:1, borderColor:'#E5E7EB', borderRadius:8, padding:12, marginBottom:12 }}
          />
          <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <Text style={{ fontSize:14, fontWeight:'600' }}>Quotidienne</Text>
            <Switch value={daily} onValueChange={setDaily} trackColor={{ true: '#10B981' }} />
          </View>
          {!daily && (
            <View style={{ marginBottom:12 }}>
              <Text style={{ fontSize:12, color:'#6B7280', marginBottom:8 }}>Jours de la semaine</Text>
              <View style={{ flexDirection:'row', flexWrap:'wrap', gap:8 }}>
                {DAYS.map(d => (
                  <TouchableOpacity
                    key={d.key}
                    onPress={() => toggleDay(d.key)}
                    style={{
                      paddingHorizontal:12,
                      paddingVertical:8,
                      borderRadius:8,
                      backgroundColor: daysOfWeek.includes(d.key) ? '#10B981' : '#F3F4F6'
                    }}
                  >
                    <Text style={{ color: daysOfWeek.includes(d.key) ? '#fff' : '#111827' }}>{d.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          <View style={{ flexDirection:'row', justifyContent:'flex-end', gap:12, marginTop:4 }}>
            <TouchableOpacity onPress={onClose} style={{ paddingHorizontal:16, paddingVertical:12 }}>
              <Text style={{ color:'#6B7280' }}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} disabled={loading} style={{ backgroundColor:'#10B981', paddingHorizontal:16, paddingVertical:12, borderRadius:8 }}>
              <Text style={{ color:'#fff', fontWeight:'600' }}>{loading ? 'Enregistrement...' : 'Créer'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default HabitsScreen;
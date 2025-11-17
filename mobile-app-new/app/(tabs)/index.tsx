import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ScrollView, 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  RefreshControl, 
  Dimensions,
  Animated as RNAnimated
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  FadeInDown,
  FadeIn,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { dashboardService, tasksService, habitsService, gamificationService, apiCall, authService } from '@/lib/api';
import { useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

const { width } = Dimensions.get('window');

// Mock data - will be replaced with API calls
const mockData = {
  user: "Alex",
  todayProgress: 87,
  focusHours: 6.5,
  tasksCompleted: 24,
  totalTasks: 28,
  streakDays: 42,
  weeklyGoalProgress: 89,
  productivityScore: 94,
  distractionsAvoided: 23,
  peakHours: "9-11 AM",
  energyLevel: 92,
  trialDaysLeft: 5,
  habits: [
    { name: "Morning Exercise", completed: false, streak: 38, time: "07:00" },
    { name: "Deep Work Session", completed: false, streak: 42, time: "09:00" },
    { name: "Read 30 min", completed: true, streak: 29, time: "20:00" },
    { name: "Meditation", completed: true, streak: 42, time: "06:30" },
  ],
  weeklyData: [
    { day: 'Mon', score: 88 },
    { day: 'Tue', score: 92 },
    { day: 'Wed', score: 85 },
    { day: 'Thu', score: 95 },
    { day: 'Fri', score: 91 },
    { day: 'Sat', score: 78 },
    { day: 'Sun', score: 87 },
  ],
  leaderboard: [
    { rank: 1, name: "You", score: 3847, avatar: "A", isUser: true, trend: "up" },
    { rank: 2, name: "Sophie M.", score: 3654, avatar: "S", trend: "same" },
    { rank: 3, name: "Lucas B.", score: 3521, avatar: "L", trend: "up" },
  ],
};

// Particle component for shimmer effects
const ShimmerParticle = ({ delay = 0 }: { delay?: number }) => {
  const translateX = useSharedValue(-width);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withRepeat(
      withSequence(
        withTiming(width * 2, { duration: 2000 }),
        withTiming(-width, { duration: 0 })
      ),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.3, { duration: 1000, delay }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.3)',
        },
        animatedStyle,
      ]}
    />
  );
};

// Progress Circle Component
const ProgressCircle = ({ 
  percentage, 
  size = 96, 
  strokeWidth = 8,
  showLabel = true,
  colors = { text: '#1F2937', textSecondary: '#6B7280', border: '#E5E7EB' }
}: { 
  percentage: number; 
  size?: number; 
  strokeWidth?: number;
  showLabel?: boolean;
  colors?: {
    text: string;
    textSecondary: string;
    border: string;
  };
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const animatedValue = useRef(new RNAnimated.Value(0)).current;
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    // Animate the value
    RNAnimated.timing(animatedValue, {
      toValue: percentage,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    // Update display value
    const listenerId = animatedValue.addListener(({ value }) => {
      setDisplayValue(value);
    });

    return () => {
      animatedValue.removeListener(listenerId);
    };
  }, [percentage, animatedValue]);

  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  return (
    <View style={{ width: size, height: size, position: 'relative' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Defs>
          <SvgLinearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0%" stopColor="#00C27A" />
            <Stop offset="100%" stopColor="#00D68F" />
          </SvgLinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </Svg>
      {showLabel && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: size * 0.25,
                fontWeight: '800',
                color: colors.text,
              }}
            >
              {Math.round(percentage)}
            </Text>
            {size > 80 && (
              <Text style={{ fontSize: size * 0.1, color: colors.textSecondary }}>Elite ✨</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
};

// Habit Item Component with animation
const HabitItem = ({ habit, index, isCelebrating, onToggle, colors }: {
  habit: any;
  index: number;
  isCelebrating: boolean;
  onToggle: () => void;
  colors: {
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
  };
}) => {
  const checkmarkScale = useRef(new RNAnimated.Value(habit.completed ? 1 : 0)).current;
  
  // Animer le checkmark quand l'habitude est complétée
  useEffect(() => {
    if (habit.completed) {
      RNAnimated.spring(checkmarkScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 150,
        friction: 4,
      }).start();
    } else {
      RNAnimated.timing(checkmarkScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [habit.completed]);
  
  return (
    <Animated.View
      entering={FadeInDown.delay(600 + index * 100).duration(400)}
      style={styles.habitItem}
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
        onPress={onToggle}
        activeOpacity={0.8}
        style={[
          styles.habitCheckbox,
          habit.completed && styles.habitCheckboxCompleted,
        ]}
      >
        {habit.completed && (
          <RNAnimated.View
            style={{
              transform: [{ scale: checkmarkScale }],
            }}
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </RNAnimated.View>
        )}
      </TouchableOpacity>

      <View style={styles.habitContent}>
        <View style={styles.habitHeader}>
          <Text
            style={[
              styles.habitName,
              habit.completed && styles.habitNameCompleted,
              { color: habit.completed ? colors.textSecondary : colors.text },
            ]}
          >
            {habit.name}
          </Text>
          <Text style={[styles.habitTime, { color: colors.textSecondary }]}>{habit.time}</Text>
        </View>
        <View style={styles.habitProgressRow}>
          <View style={styles.habitProgressBar}>
            <Animated.View
              style={[
                styles.habitProgressFill,
                { width: habit.completed ? '100%' : '0%' },
              ]}
            />
          </View>
          <View style={styles.habitStreak}>
            <Text style={styles.habitStreakText}>{habit.streak}d</Text>
            <Ionicons name="flame" size={12} color="#00C27A" />
          </View>
        </View>
      </View>
    </Animated.View>
  );
};

export default function DashboardScreen() {
  const { colors } = useTheme();
  const t = useTranslation();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(5);
  const [dashboardData, setDashboardData] = useState({
    todayProgress: 0,
    focusHours: 0, // Deep work time
    tasksCompleted: 0,
    totalTasks: 0,
    streakDays: 0,
    stressLevel: 0, // Replaces weeklyGoalProgress
    productivityScore: 0,
    energyLevel: 0,
    focusLevel: 0,
    habits: [] as any[],
    weeklyData: mockData.weeklyData,
    userName: 'User',
    // New fields
    totalDeepWorkHours: 0,
    weeklyWorkHours: 0,
    bestDeepWorkSession: '',
    globalRank: 0,
  });
  const [celebratingHabit, setCelebratingHabit] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load user name
      const userName = await AsyncStorage.getItem('user_name') || 'User';

      // Fetch trial status from API
      try {
        const trialStatus = await authService.getTrialStatus();
        if (trialStatus.status === 'trial_active' && trialStatus.daysLeft !== undefined) {
          setTrialDaysLeft(trialStatus.daysLeft);
          // Save to AsyncStorage for offline access
          await AsyncStorage.setItem('trialDaysLeft', trialStatus.daysLeft.toString());
        } else {
          // User is not in trial (subscribed or expired)
          setTrialDaysLeft(0);
          await AsyncStorage.setItem('trialDaysLeft', '0');
        }
      } catch (error) {
        console.error('Error fetching trial status:', error);
        // Fallback to stored value if API fails
        const trialDays = await AsyncStorage.getItem('trialDaysLeft');
        if (trialDays) setTrialDaysLeft(parseInt(trialDays, 10));
      }

      // Calculate today's date range for API calls
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      // Use UTC dates to match server timezone
      const startOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
      const endOfToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 23, 59, 59, 999));
      const startDateStr = startOfToday.toISOString();
      const endDateStr = endOfToday.toISOString();
      
      console.log('📅 Date Range for API:', {
        todayStr,
        startDateStr,
        endDateStr,
        startOfToday: startOfToday.toISOString(),
        endOfToday: endOfToday.toISOString(),
      });

      // Calculate week start (7 days ago)
      const weekStart = new Date(today);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekStartStr = weekStart.toISOString();

      // Fetch data from API in parallel with individual timeouts
      // Wrapper pour ajouter un timeout à chaque appel (augmenté à 30s pour les requêtes complexes)
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) => 
            setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
          )
        ]).catch((err) => {
          console.log('⚠️ Request timeout or error:', err.message);
          return null as T;
        });
      };

      const [metrics, gamification, tasks, habits, leaderboard, achievements, todayTimeEntries, deepWorkStats, weeklyProductivity] = await Promise.allSettled([
        withTimeout(dashboardService.getMetrics(), 30000),
        withTimeout(dashboardService.getGamificationStats(), 30000),
        withTimeout(tasksService.getTasks(), 30000),
        withTimeout(habitsService.getAll(), 30000),
        withTimeout(gamificationService.getLeaderboard(3, true), 30000),
        withTimeout(gamificationService.getAchievements(), 30000).catch((err) => {
          console.log('⚠️ Could not fetch achievements:', err);
          return null;
        }),
        // Get today's time entries using startDate and endDate parameters
        withTimeout(apiCall(`/time-entries?startDate=${encodeURIComponent(startDateStr)}&endDate=${encodeURIComponent(endDateStr)}`), 30000).catch((err) => {
          console.log('⚠️ Could not fetch today time entries:', err);
          return null;
        }),
        // Get deep work stats directly from dedicated endpoint
        withTimeout(apiCall('/dashboard/deepwork-stats'), 30000).catch((err) => {
          console.log('⚠️ Could not fetch deep work stats:', err);
          return null;
        }),
        // Get weekly productivity data
        withTimeout(dashboardService.getWeeklyProductivity(), 30000).catch((err) => {
          console.log('⚠️ Could not fetch weekly productivity:', err);
          return null;
        }),
      ]);

      // Process metrics
      const metricsData = metrics.status === 'fulfilled' ? metrics.value : null;
      const gamificationData = gamification.status === 'fulfilled' ? gamification.value : null;
      const tasksData = tasks.status === 'fulfilled' ? tasks.value : null;
      const habitsData = habits.status === 'fulfilled' ? habits.value : null;
      const leaderboardData = leaderboard.status === 'fulfilled' ? leaderboard.value : null;
      const achievementsData = achievements.status === 'fulfilled' ? achievements.value : null;
      const todayTimeEntriesData = todayTimeEntries.status === 'fulfilled' ? todayTimeEntries.value : null;
      const deepWorkStatsData = deepWorkStats.status === 'fulfilled' ? deepWorkStats.value : null;
      const weeklyProductivityData = weeklyProductivity.status === 'fulfilled' ? weeklyProductivity.value : null;

      // Calculate today's tasks
      let todayTasks: any[] = [];
      if (tasksData) {
        if (Array.isArray(tasksData.tasks)) {
          todayTasks = tasksData.tasks.filter((task: any) => {
            const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : todayStr;
            const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
            return taskDate === todayStr || dueDate === todayStr || task.status === 'PENDING' || task.status === 'IN_PROGRESS';
          });
        } else if (Array.isArray(tasksData)) {
          todayTasks = tasksData.filter((task: any) => {
            const taskDate = task.createdAt ? new Date(task.createdAt).toISOString().split('T')[0] : todayStr;
            const dueDate = task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : null;
            return taskDate === todayStr || dueDate === todayStr || task.status === 'PENDING' || task.status === 'IN_PROGRESS';
          });
        }
      }

      const completedTasks = todayTasks.filter((task: any) => task.status === 'COMPLETED').length;
      const totalTasks = todayTasks.length;

      // Process habits
      let habitsList: any[] = [];
      if (habitsData) {
        if (Array.isArray(habitsData.habits)) {
          habitsList = habitsData.habits;
        } else if (Array.isArray(habitsData)) {
          habitsList = habitsData;
        }
      }

      // Format habits for display - Afficher toutes les habitudes actives
      const activeHabitsForDisplay = habitsList.filter((h: any) => h.isActive !== false);
      const formattedHabits = activeHabitsForDisplay.map((habit: any) => {
        const entries = habit.entries || habit.completions || [];
        const todayEntry = entries.find((entry: any) => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0];
          return entryDate === todayStr && entry.completed === true;
        });
        
        return {
          id: habit.id,
          name: habit.name,
          completed: !!todayEntry,
          streak: habit.currentStreak || 0,
          time: habit.reminderTime || '09:00',
        };
      });

      // Calculate daily progress (habits + tasks)
      const activeHabits = habitsList.filter((h: any) => h.isActive !== false);
      const completedHabitsToday = activeHabits.filter((habit: any) => {
        const entries = habit.entries || habit.completions || [];
        const todayEntry = entries.find((entry: any) => {
          const entryDate = new Date(entry.date).toISOString().split('T')[0];
          return entryDate === todayStr && entry.completed === true;
        });
        return !!todayEntry;
      }).length;
      
      const habitsProgress = activeHabits.length > 0 ? (completedHabitsToday / activeHabits.length) * 100 : 0;
      const tasksProgress = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
      
      // Average of habits and tasks progress (weighted if one is 0)
      let todayProgress = 0;
      if (activeHabits.length > 0 && totalTasks > 0) {
        // Both have data, average them
        todayProgress = Math.round((habitsProgress + tasksProgress) / 2);
      } else if (activeHabits.length > 0) {
        // Only habits
        todayProgress = Math.round(habitsProgress);
      } else if (totalTasks > 0) {
        // Only tasks
        todayProgress = Math.round(tasksProgress);
      }

      // Deep work time for TODAY (in hours)
      // Priority 1: Use dedicated deep work stats endpoint
      let deepWorkTimeSeconds = 0;
      
      if (deepWorkStatsData) {
        deepWorkTimeSeconds = deepWorkStatsData.today?.seconds || 0;
        console.log('📊 Deep Work Stats from API:', deepWorkStatsData);
      }
      
      // Priority 2: Try metrics data as fallback
      if (deepWorkTimeSeconds === 0 && metricsData) {
        if (metricsData.deepWorkTimeToday) {
          deepWorkTimeSeconds = metricsData.deepWorkTimeToday;
        } else if (metricsData.todayDeepWorkTime) {
          deepWorkTimeSeconds = metricsData.todayDeepWorkTime;
        } else if (metricsData.deepWorkTime) {
          deepWorkTimeSeconds = typeof metricsData.deepWorkTime === 'number' 
            ? metricsData.deepWorkTime 
            : 0;
        } else if (metricsData.deepWorkMinutes) {
          deepWorkTimeSeconds = metricsData.deepWorkMinutes * 60;
        } else if (metricsData.totalTimeToday) {
          deepWorkTimeSeconds = metricsData.totalTimeToday;
        }
      }
      
      const focusHours = deepWorkTimeSeconds > 0 ? (deepWorkTimeSeconds / 3600).toFixed(1) : '0.0';
      
      // Log for debugging
      console.log('📊 Deep Work Debug:', {
        deepWorkStatsData: deepWorkStatsData ? Object.keys(deepWorkStatsData) : 'null',
        metricsData: metricsData ? Object.keys(metricsData) : 'null',
        deepWorkTimeSeconds,
        focusHours,
      });

      // Calculate Total Hours, This Week, and Best Time from deep work stats endpoint
      let totalDeepWorkHours = 0;
      let weeklyWorkHours = 0;
      let bestDeepWorkSession = 'N/A';

      if (deepWorkStatsData) {
        totalDeepWorkHours = Math.round(deepWorkStatsData.allTime?.hours || 0);
        weeklyWorkHours = Math.round(deepWorkStatsData.week?.hours || 0);
        bestDeepWorkSession = deepWorkStatsData.bestSession || 'N/A';
        
        console.log('📊 Deep Work Stats Calculated:', {
          totalDeepWorkHours,
          weeklyWorkHours,
          bestDeepWorkSession,
          rawData: deepWorkStatsData,
        });
      }

      // Fallback to metrics data if available
      if (totalDeepWorkHours === 0 && metricsData) {
        const totalDeepWorkSeconds = metricsData?.totalDeepWorkTime || metricsData?.totalDeepWorkHours * 3600 || 0;
        totalDeepWorkHours = Math.round(totalDeepWorkSeconds / 3600);
      }

      if (weeklyWorkHours === 0 && metricsData) {
        const weeklyWorkSeconds = metricsData?.totalTimeWeek || metricsData?.weeklyWorkTime || 0;
        weeklyWorkHours = Math.round(weeklyWorkSeconds / 3600);
      }

      if (bestDeepWorkSession === 'N/A' && metricsData) {
        const bestSession = metricsData?.bestDeepWorkSession || metricsData?.longestDeepWorkSession || '';
        bestDeepWorkSession = bestSession || metricsData?.bestFocusTime || 'N/A';
      }

      // Global rank from leaderboard
      let globalRank = 0;
      if (leaderboardData) {
        if (Array.isArray(leaderboardData)) {
          // Find user in leaderboard
          const userEntry = leaderboardData.find((entry: any) => entry.isUser || entry.userName === userName);
          globalRank = userEntry?.rank || 0;
        } else if (leaderboardData.userRank) {
          globalRank = leaderboardData.userRank;
        }
      }

      // Energy, Focus, Stress from gamification stats (BehaviorCheckIn via agent IA)
      // Ces valeurs proviennent des réponses de l'utilisateur à l'agent IA tout au long de la journée
      console.log('📊 Raw gamificationData:', JSON.stringify(gamificationData, null, 2));
      
      // Gérer null, undefined, ou valeurs manquantes
      const energyLevel = (gamificationData?.energyLevel !== null && gamificationData?.energyLevel !== undefined)
        ? gamificationData.energyLevel 
        : (gamificationData?.energy !== null && gamificationData?.energy !== undefined ? gamificationData.energy : 0);
      const focusLevel = (gamificationData?.focusLevel !== null && gamificationData?.focusLevel !== undefined)
        ? gamificationData.focusLevel 
        : (gamificationData?.focus !== null && gamificationData?.focus !== undefined ? gamificationData.focus : 0);
      const stressLevel = (gamificationData?.stressLevel !== null && gamificationData?.stressLevel !== undefined)
        ? gamificationData.stressLevel 
        : (gamificationData?.stress !== null && gamificationData?.stress !== undefined ? gamificationData.stress : 0);

      console.log('📊 Productivity Metrics from BehaviorCheckIn:', {
        energyLevel,
        focusLevel,
        stressLevel,
        source: 'gamificationData (BehaviorCheckIn)',
        hasData: energyLevel > 0 || focusLevel > 0 || stressLevel > 0
      });

      // Productivity score basé sur les tâches et habitudes complétées aujourd'hui
      // Le score reflète le pourcentage de complétion des tâches et habitudes du jour
      const productivityScore = todayProgress;

      // Process achievements - get unlocked achievements, limit to 4
      if (achievementsData && achievementsData.achievements) {
        const unlockedAchievements = achievementsData.achievements
          .filter((a: any) => a.unlocked)
          .slice(0, 4);
        setAchievements(unlockedAchievements);
      }

      // Process leaderboard - get top 3
      if (leaderboardData) {
        let leaderboardList: any[] = [];
        if (Array.isArray(leaderboardData)) {
          leaderboardList = leaderboardData.slice(0, 3);
        } else if (leaderboardData.leaderboard && Array.isArray(leaderboardData.leaderboard)) {
          leaderboardList = leaderboardData.leaderboard.slice(0, 3);
        }
        setLeaderboard(leaderboardList);
      }

      // Update dashboard data
      setDashboardData({
        todayProgress: todayProgress,
        focusHours: parseFloat(focusHours) || 0,
        tasksCompleted: completedTasks,
        totalTasks: totalTasks,
        streakDays: gamificationData?.currentStreak || gamificationData?.streak || 0,
        stressLevel: stressLevel,
        productivityScore: productivityScore || 0,
        energyLevel: energyLevel || 0,
        focusLevel: focusLevel || 0,
        habits: formattedHabits.length > 0 ? formattedHabits : mockData.habits,
        weeklyData: weeklyProductivityData?.weeklyData || mockData.weeklyData,
        userName: userName,
        totalDeepWorkHours: totalDeepWorkHours,
        weeklyWorkHours: weeklyWorkHours,
        bestDeepWorkSession: bestDeepWorkSession,
        globalRank: globalRank,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep mock data on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [])
  );

  const toggleHabit = async (habitId: string) => {
    const habit = dashboardData.habits.find(h => h.id === habitId);
    if (!habit) return;

    const currentCompleted = habit.completed;
    const todayStr = new Date().toISOString().split('T')[0];

    try {
      // Optimistic update
      setDashboardData(prev => ({
        ...prev,
        habits: prev.habits.map(h =>
          h.id === habitId ? { ...h, completed: !currentCompleted } : h
        ),
      }));

      // Call API to toggle habit (complete or uncomplete)
      await habitsService.complete(habitId, todayStr, currentCompleted);
      
      // Recharger les données pour avoir la streak à jour
      await loadDashboardData();

      if (!currentCompleted) {
        // Célébrer seulement si on vient de compléter
        setCelebratingHabit(habitId);
        setTimeout(() => setCelebratingHabit(null), 1500);
      }
    } catch (error) {
      console.error('Error toggling habit:', error);
      // Rollback en cas d'erreur
      setDashboardData(prev => ({
        ...prev,
        habits: prev.habits.map(h =>
          h.id === habitId ? { ...h, completed: currentCompleted } : h
        ),
      }));
    }
  };

  const sortedHabits = [...dashboardData.habits].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  const chartData = {
    labels: dashboardData.weeklyData.map(d => d.day),
    datasets: [{
      data: dashboardData.weeklyData.map(d => d.score),
      color: (opacity = 1) => `rgba(0, 194, 122, ${opacity})`,
      strokeWidth: 2.5,
    }],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Free Trial Banner */}
        {trialDaysLeft > 0 && (
          <Animated.View
            entering={FadeInDown.duration(400)}
            style={styles.trialBanner}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.trialBannerGradient}
            >
              <ShimmerParticle />
              <View style={styles.trialBannerContent}>
                <View style={styles.trialBannerLeft}>
                  <View style={styles.trialIconContainer}>
                    <Ionicons name="flash" size={20} color="#FFFFFF" />
                    <Text style={styles.trialSparkle}>✨</Text>
                  </View>
                  <View>
                    <Text style={styles.trialLabel}>Free Trial</Text>
                    <Text style={styles.trialText}>
                      ⚡ {trialDaysLeft} {trialDaysLeft === 1 ? t('day') : t('days')} {t('left')} to unlock full potential ⚡
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.upgradeButton}
                  onPress={() => router.push('/upgrade')}
                >
                  <Text style={styles.upgradeButtonText}>{t('upgrade')}</Text>
                  <Text style={styles.upgradeSparkle}>✨</Text>
                </TouchableOpacity>
              </View>
            </LinearGradient>
          </Animated.View>
        )}

        {/* Header */}
        <Animated.View
          entering={FadeInDown.delay(100).duration(400)}
          style={styles.header}
        >
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('hello')}, {dashboardData.userName} 👋</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>{t('letsMakeTodayProductive')}</Text>
        </Animated.View>

        {/* Main Stats Grid */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.statsGrid}
        >
          {/* Daily Progress Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.statCardPrimary}
          >
            <LinearGradient
              colors={['#00C27A', '#00D68F']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <ShimmerParticle />
              <View style={styles.statCardContent}>
                <Ionicons name="flag" size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
                <Text style={styles.statCardLabel}>{t('dailyProgress')}</Text>
                <View style={styles.statCardValueRow}>
                  <Text style={styles.statCardValue}>{dashboardData.todayProgress}%</Text>
                  <Text style={styles.statCardChange}>↑ 12%</Text>
                </View>
                <View style={styles.progressBarContainer}>
                  <Animated.View
                    style={[
                      styles.progressBarFill,
                      { width: `${dashboardData.todayProgress}%` },
                    ]}
                  />
                </View>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Focus Time Card */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Ionicons name="time" size={24} color={colors.primary} />
            <Text style={[styles.statCardLabelDark, { color: colors.textSecondary }]}>{t('focusTime')}</Text>
            <View style={styles.statCardValueRow}>
              <Text style={[styles.statCardValueDark, { color: colors.text }]}>{dashboardData.focusHours}</Text>
              <Text style={[styles.statCardUnit, { color: colors.text }]}>h</Text>
            </View>
            <Text style={styles.statCardSubtext}>+2.5h vs yesterday 🎯</Text>
          </View>

          {/* Tasks Completed Card */}
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.statCardHeader}>
              <Ionicons name="checkmark-circle" size={24} color="#00C27A" />
              <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.statCardLabelDark, { color: colors.textSecondary }]}>{t('tasksCompleted')}</Text>
            <View style={styles.statCardValueRow}>
              <Text style={[styles.statCardValueDark, { color: colors.text }]}>{dashboardData.tasksCompleted}</Text>
              <Text style={[styles.statCardUnitDark, { color: colors.textSecondary }]}>/{dashboardData.totalTasks}</Text>
            </View>
            <View style={styles.tasksProgressBar}>
              {Array.from({ length: Math.max(dashboardData.totalTasks, 1) }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.taskProgressDot,
                    i < dashboardData.tasksCompleted && styles.taskProgressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>

          {/* Streak Card */}
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.statCardStreak}
          >
            <LinearGradient
              colors={['#FB923C', '#EC4899']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <Ionicons name="flame" size={24} color="#FFFFFF" style={{ opacity: 0.9 }} />
              <Text style={styles.statCardLabel}>{t('currentStreak')}</Text>
              <View style={styles.statCardValueRow}>
                <Text style={styles.statCardValue}>{dashboardData.streakDays}</Text>
                <Text style={styles.statCardUnitWhite}>days</Text>
              </View>
              <Text style={styles.statCardSubtextWhite}>Personal best! 🏆</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* Productivity Score Card */}
        <Animated.View
          entering={FadeInDown.delay(300).duration(400)}
          style={[styles.productivityCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.productivityHeader}>
            <Text style={[styles.productivityTitle, { color: colors.text }]}>{t('productivityScore')}</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="trending-up" size={12} color="#059669" />
              <Text style={styles.trendText}>+12%</Text>
            </View>
          </View>

          <View style={styles.productivityContent}>
            <ProgressCircle 
              percentage={dashboardData.productivityScore} 
              size={96} 
              colors={{ text: colors.text, textSecondary: colors.textSecondary, border: colors.border }}
            />
            <View style={styles.productivityMetrics}>
              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Energy ⚡</Text>
                <Text style={[styles.metricValue, { color: colors.text }]}>{dashboardData.energyLevel}%</Text>
              </View>
              <View style={styles.metricBarContainer}>
                <Animated.View
                  style={[
                    styles.metricBar,
                    { width: `${dashboardData.energyLevel}%` },
                  ]}
                />
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Stress 😰</Text>
                <Text style={[styles.metricValue, { color: dashboardData.stressLevel > 70 ? '#DC2626' : dashboardData.stressLevel > 40 ? '#F59E0B' : '#00C27A' }]}>
                  {dashboardData.stressLevel}%
                </Text>
              </View>
              <View style={styles.metricBarContainer}>
                <Animated.View
                  style={[
                    styles.metricBar,
                    { 
                      width: `${dashboardData.stressLevel}%`,
                      backgroundColor: dashboardData.stressLevel > 70 ? '#DC2626' : dashboardData.stressLevel > 40 ? '#F59E0B' : '#00C27A'
                    },
                  ]}
                />
              </View>

              <View style={styles.metricRow}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Focus 🧠</Text>
                <Text style={[styles.metricValue, { color: '#0891B2' }]}>{dashboardData.focusLevel}%</Text>
              </View>
              <View style={styles.metricBarContainer}>
                <Animated.View
                  style={[
                    styles.metricBar,
                    { width: `${dashboardData.focusLevel}%`, backgroundColor: '#06B6D4' },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Compact Stats Grid */}
          <View style={styles.compactStatsGrid}>
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>{t('totalHours')}</Text>
              <Text style={[styles.compactStatValue, { color: colors.text }]}>{dashboardData.totalDeepWorkHours}h</Text>
            </View>
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>{t('thisWeek')}</Text>
              <Text style={[styles.compactStatValue, { color: colors.text }]}>{dashboardData.weeklyWorkHours}h</Text>
            </View>
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>{t('bestTime')}</Text>
              <Text style={[styles.compactStatValue, { color: colors.text }]}>{dashboardData.bestDeepWorkSession}</Text>
            </View>
            <View style={styles.compactStat}>
              <Text style={[styles.compactStatLabel, { color: colors.textSecondary }]}>{t('globalRank')}</Text>
              <Text style={[styles.compactStatValue, { color: colors.text }]}>
                {dashboardData.globalRank > 0 ? `#${dashboardData.globalRank}` : 'N/A'} {dashboardData.globalRank === 1 ? '🏆' : ''}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Weekly Chart */}
        <Animated.View
          entering={FadeInDown.delay(400).duration(400)}
          style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.chartHeader}>
            <Text style={[styles.chartTitle, { color: colors.text }]}>{t('weeklyTrend')}</Text>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.viewDataButton}
              onPress={() => router.push('/analytics')}
            >
              <Ionicons name="trending-up" size={14} color="#FFFFFF" />
              <Text style={styles.viewDataText}>{t('viewData')}</Text>
            </TouchableOpacity>
          </View>
          <LineChart
            data={chartData}
            width={width - 48}
            height={120}
            chartConfig={{
              backgroundColor: colors.surface,
              backgroundGradientFrom: colors.surface,
              backgroundGradientTo: colors.surface,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 194, 122, ${opacity})`,
              labelColor: (opacity = 1) => {
                const rgb = colors.textSecondary === '#6b7280' ? '107, 114, 128' : '156, 163, 175';
                return `rgba(${rgb}, ${opacity})`;
              },
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '4',
                strokeWidth: '2',
                stroke: '#00C27A',
              },
            }}
            bezier
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLabels={false}
          />
        </Animated.View>

        {/* Daily Habits */}
        <Animated.View
          entering={FadeInDown.delay(500).duration(400)}
          style={styles.habitsSection}
        >
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{t('dailyHabits')}</Text>
          <View style={[styles.habitsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {sortedHabits.map((habit, index) => {
              const isCelebrating = celebratingHabit === habit.id;
              
              return (
                <HabitItem
                  key={habit.id || habit.name}
                  habit={habit}
                  index={index}
                  isCelebrating={isCelebrating}
                  onToggle={() => toggleHabit(habit.id || habit.name)}
                  colors={colors}
                />
              );
            })}
          </View>
        </Animated.View>

        {/* Achievements Unlocked */}
        {achievements.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(600).duration(400)}
            style={styles.achievementsSection}
          >
            <View style={styles.achievementsHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('achievementsUnlocked')}</Text>
              <TouchableOpacity
                onPress={() => router.push('/achievements')}
                style={styles.viewAllButton}
              >
                <Ionicons name="trophy" size={14} color="#FFFFFF" />
                <Text style={styles.viewAllButtonText}>{t('viewAll')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.achievementsGrid}>
              {achievements.slice(0, 4).map((achievement, index) => {
                const gradients = [
                  ['#F59E0B', '#EF4444'], // amber to red
                  ['#A855F7', '#EC4899'], // purple to pink
                  ['#06B6D4', '#3B82F6'], // cyan to blue
                  ['#10B981', '#059669'], // green to emerald
                ];
                const gradient = gradients[index % gradients.length];
                const icons = ['🔥', '🎯', '⚡', '🌟'];
                const icon = icons[index % icons.length];
                
                return (
                  <Animated.View
                    key={achievement.id}
                    entering={FadeInDown.delay(650 + index * 50).duration(400)}
                    style={styles.achievementCard}
                  >
                    <LinearGradient
                      colors={gradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.achievementGradient}
                    >
                      <View style={styles.achievementIconContainer}>
                        <Text style={styles.achievementEmoji}>{icon}</Text>
                      </View>
                      <Ionicons name="trophy" size={20} color="#FFFFFF" style={{ opacity: 0.9, marginBottom: 4 }} />
                      <Text style={styles.achievementName} numberOfLines={1}>{achievement.name}</Text>
                      <Text style={styles.achievementDescription} numberOfLines={2}>{achievement.description}</Text>
                      <View style={styles.achievementBadge}>
                        <Text style={styles.achievementBadgeText}>{t('unlocked')}</Text>
                        <Text style={styles.achievementBadgeIcon}>✨</Text>
                      </View>
                    </LinearGradient>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>
        )}

        {/* Leaderboard */}
        {leaderboard.length > 0 && (
          <Animated.View
            entering={FadeInDown.delay(700).duration(400)}
            style={styles.leaderboardSection}
          >
            <Text style={[styles.sectionTitle, { color: colors.text }]}>{t('leaderboard')}</Text>
            <View style={[styles.leaderboardCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {leaderboard.map((user, index) => {
                const isUser = user.isUser || user.userName === dashboardData.userName;
                const rankColors = {
                  1: ['#FCD34D', '#F59E0B'], // gold
                  2: ['#00C27A', '#00D68F'], // green
                  3: ['#D1D5DB', '#9CA3AF'], // gray
                };
                const rankColor = rankColors[user.rank as keyof typeof rankColors] || rankColors[3];
                
                return (
                  <Animated.View
                    key={user.userId || index}
                    entering={FadeInDown.delay(750 + index * 100).duration(400)}
                    style={[
                      styles.leaderboardItem,
                      isUser && { backgroundColor: colors.primary + '10' },
                      index < leaderboard.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                  >
                    <View style={styles.leaderboardLeft}>
                      <LinearGradient
                        colors={rankColor}
                        style={styles.leaderboardAvatar}
                      >
                        <Text style={styles.leaderboardAvatarText}>
                          {user.userName?.charAt(0).toUpperCase() || user.userEmail?.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </LinearGradient>
                      <View>
                        <Text style={[styles.leaderboardName, { color: isUser ? colors.primary : colors.text }]}>
                          {user.userName || user.userEmail?.split('@')[0] || 'User'}
                        </Text>
                        <Text style={[styles.leaderboardScore, { color: colors.textSecondary }]}>
                          {user.totalPoints || user.points || 0} {t('points')}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.leaderboardRight}>
                      <Ionicons 
                        name={user.trend === 'up' ? 'trending-up' : user.trend === 'down' ? 'trending-down' : 'remove'} 
                        size={16} 
                        color={user.trend === 'up' ? '#10B981' : user.trend === 'down' ? '#EF4444' : colors.textSecondary} 
                      />
                      <Text style={[styles.leaderboardRank, { color: colors.textSecondary }]}>#{user.rank}</Text>
                    </View>
                  </Animated.View>
                );
              })}
              <TouchableOpacity
                onPress={() => router.push('/leaderboard')}
                style={styles.leaderboardButton}
              >
                <LinearGradient
                  colors={['#00C27A', '#00D68F']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.leaderboardButtonGradient}
                >
                  <Ionicons name="trophy" size={18} color="#FFFFFF" />
                  <Text style={styles.leaderboardButtonText}>{t('viewFullLeaderboard')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* Bottom spacing for tab bar */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 20,
  },
  trialBanner: {
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  trialBannerGradient: {
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  trialBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  trialBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  trialIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trialSparkle: {
    position: 'absolute',
    top: -4,
    right: -4,
    fontSize: 12,
  },
  trialLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  upgradeButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  upgradeButtonText: {
    color: '#00C27A',
    fontSize: 14,
    fontWeight: '700',
  },
  upgradeSparkle: {
    fontSize: 12,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontWeight: '400',
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 16,
  },
  statCardPrimary: {
    width: (width - 60) / 2,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#00C27A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statCardGradient: {
    padding: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  statCardContent: {
    zIndex: 10,
  },
  statCardLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardValue: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statCardValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  statCardChange: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
  },
  statCard: {
    width: (width - 60) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAllText: {
    fontSize: 12,
    color: '#00C27A',
    fontWeight: '600',
  },
  statCardLabelDark: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
  },
  statCardValueDark: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1F2937',
  },
  statCardUnit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  statCardUnitDark: {
    fontSize: 18,
    color: '#6B7280',
  },
  statCardSubtext: {
    fontSize: 12,
    color: '#00C27A',
    marginTop: 4,
  },
  statCardStreak: {
    width: (width - 60) / 2,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#FB923C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  statCardUnitWhite: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  statCardSubtextWhite: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
  },
  tasksProgressBar: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  taskProgressDot: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
  },
  taskProgressDotActive: {
    backgroundColor: '#00C27A',
  },
  productivityCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: 'rgba(0, 194, 122, 0.05)',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 194, 122, 0.2)',
  },
  productivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  productivityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  productivityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 12,
  },
  productivityMetrics: {
    flex: 1,
    gap: 8,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00C27A',
  },
  metricBarContainer: {
    height: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    backgroundColor: '#00C27A',
    borderRadius: 3,
  },
  compactStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  compactStat: {
    alignItems: 'center',
  },
  compactStatLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  compactStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00C27A',
  },
  chartCard: {
    marginHorizontal: 24,
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  viewDataButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00C27A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewDataText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  habitsSection: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  habitsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    gap: 12,
  },
  habitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    position: 'relative',
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
  habitContent: {
    flex: 1,
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
    color: '#6B7280',
  },
  habitNameCompleted: {
    color: '#374151',
    fontWeight: '500',
  },
  habitTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  habitProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  achievementsSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  achievementsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00C27A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  viewAllButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementCard: {
    width: (width - 60) / 2,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  achievementGradient: {
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  achievementIconContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 0.1,
  },
  achievementEmoji: {
    fontSize: 48,
  },
  achievementName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  achievementBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  achievementBadgeIcon: {
    fontSize: 10,
  },
  leaderboardSection: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  leaderboardCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leaderboardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  leaderboardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  leaderboardAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leaderboardAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  leaderboardName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  leaderboardScore: {
    fontSize: 12,
  },
  leaderboardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leaderboardRank: {
    fontSize: 14,
    fontWeight: '500',
  },
  leaderboardButton: {
    marginTop: 0,
  },
  leaderboardButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  leaderboardButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

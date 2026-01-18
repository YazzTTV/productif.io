import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { format } from 'date-fns';
import { fr, enUS, es as esLocale } from 'date-fns/locale';
import { apiCall } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

interface Achievement {
  id: string;
  name: string;
  description: string;
  type: string;
  points: number;
  threshold: number;
  unlocked: boolean;
  unlockedAt?: string;
}

interface AchievementsData {
  achievements: Achievement[];
  grouped: Record<string, Achievement[]>;
  totalUnlocked: number;
  totalAvailable: number;
}

type TabType = 'all' | 'STREAK' | 'HABITS' | 'PERFECT_DAY' | 'POINTS' | 'TASKS' | 'OBJECTIVES';

const TYPE_ICONS = {
  STREAK: 'calendar-outline',
  HABITS: 'target-outline',
  PERFECT_DAY: 'star-outline',
  POINTS: 'trophy-outline',
  TASKS: 'flash-outline',
  OBJECTIVES: 'ribbon-outline',
} as const;

const TYPE_COLORS = {
  STREAK: '#3B82F6',
  HABITS: '#10B981',
  PERFECT_DAY: '#F59E0B',
  POINTS: '#8B5CF6',
  TASKS: '#F97316',
  OBJECTIVES: '#6366F1',
} as const;

export default function AchievementsScreen() {
  const { t, language } = useLanguage();
  const [data, setData] = useState<AchievementsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<TabType>('all');

  const fetchAchievements = async () => {
    try {
      const response = await apiCall('/gamification/achievements');
      setData(response);
    } catch (error) {
      console.error('Erreur lors du chargement des achievements:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await fetchAchievements();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  };

  const getAchievementIcon = (type: string) => {
    return TYPE_ICONS[type as keyof typeof TYPE_ICONS] || 'ribbon-outline';
  };

  const getTypeColor = (type: string) => {
    return TYPE_COLORS[type as keyof typeof TYPE_COLORS] || '#6B7280';
  };

  const getTypeName = (type: TabType | string) => {
    switch (type) {
      case 'STREAK':
        return t('achievementsTypeStreak', undefined, 'Séries');
      case 'HABITS':
        return t('achievementsTypeHabits', undefined, 'Habitudes');
      case 'PERFECT_DAY':
        return t('achievementsTypePerfectDay', undefined, 'Régularité');
      case 'POINTS':
        return t('achievementsTypePoints', undefined, 'Points');
      case 'TASKS':
        return t('achievementsTypeTasks', undefined, 'Tâches');
      case 'OBJECTIVES':
        return t('achievementsTypeObjectives', undefined, 'Objectifs');
      case 'all':
        return t('achievementsTabAll', undefined, 'Tous');
      default:
        return type;
    }
  };

  const locale = language === 'en' ? enUS : language === 'es' ? esLocale : fr;

  const renderTabButton = (tab: TabType, title: string) => (
    <TouchableOpacity
      key={tab}
      style={[
        styles.tabButton,
        selectedTab === tab && styles.tabButtonActive
      ]}
      onPress={() => setSelectedTab(tab)}
    >
      <Text style={[
        styles.tabText,
        selectedTab === tab && styles.tabTextActive
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const renderAchievementCard = (achievement: Achievement) => (
    <View
      key={achievement.id}
      style={[
        styles.achievementCard,
        achievement.unlocked ? styles.achievementCardUnlocked : styles.achievementCardLocked
      ]}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIcon}>
          <Ionicons
            name={getAchievementIcon(achievement.type) as any}
            size={24}
            color={achievement.unlocked ? getTypeColor(achievement.type) : '#9CA3AF'}
          />
        </View>
        {achievement.unlocked && (
          <View style={styles.unlockedBadge}>
            <Ionicons name="trophy" size={16} color="#10B981" />
          </View>
        )}
      </View>

      <View style={styles.cardContent}>
        <Text style={[
          styles.achievementTitle,
          !achievement.unlocked && styles.achievementTitleLocked
        ]}>
          {achievement.name}
        </Text>

        <View style={styles.achievementMeta}>
          <View style={[
            styles.typeBadge,
            { backgroundColor: `${getTypeColor(achievement.type)}20` }
          ]}>
            <Text style={[
              styles.typeText,
              { color: getTypeColor(achievement.type) }
            ]}>
              {getTypeName(achievement.type)}
            </Text>
          </View>
          <Text style={styles.pointsText}>
            {achievement.points} {t('achievementsPointsLabel', undefined, 'points')}
          </Text>
        </View>

        <Text style={[
          styles.achievementDescription,
          !achievement.unlocked && styles.achievementDescriptionLocked
        ]}>
          {achievement.description}
        </Text>

        {achievement.unlocked && achievement.unlockedAt ? (
          <Text style={styles.unlockedDate}>
            {t(
              'achievementsUnlockedDate',
              { date: format(new Date(achievement.unlockedAt), 'd MMMM yyyy', { locale }) },
              `Débloqué le ${format(new Date(achievement.unlockedAt), 'd MMMM yyyy', { locale })}`
            )}
          </Text>
        ) : (
          <View style={styles.objectiveContainer}>
            <Text style={styles.objectiveLabel}>
              {t('achievementsObjectiveLabel', undefined, 'Objectif :')}
            </Text>
            <Text style={styles.objectiveValue}>
              {achievement.threshold} {achievement.type === 'POINTS' ? t('achievementsPointsLabel', undefined, 'points') : ''}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderProgressCard = () => {
    if (!data) return null;

    const completionPercentage = Math.round((data.totalUnlocked / data.totalAvailable) * 100);

    return (
      <View style={styles.progressCard}>
        <View style={styles.progressHeader}>
          <Ionicons name="trophy" size={20} color="#10B981" />
          <Text style={styles.progressTitle}>
            {t('achievementsProgressTitle', undefined, 'Progression globale')}
          </Text>
        </View>
        <View style={styles.progressContent}>
          <View style={styles.progressStats}>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
            <Text style={styles.progressSubtitle}>
              {t(
                'achievementsUnlockedLabel',
                { unlocked: data.totalUnlocked, total: data.totalAvailable },
                `${data.totalUnlocked}/${data.totalAvailable} débloqués`
              )}
            </Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <View 
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` }
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="trophy-outline" size={64} color="#9CA3AF" />
      <Text style={styles.emptyTitle}>
        {t('achievementsEmptyTitle', undefined, 'Aucun achievement')}
      </Text>
      <Text style={styles.emptyDescription}>
        {selectedTab === 'all' 
          ? t('achievementsEmptyAll', undefined, 'Impossible de charger les achievements')
          : t('achievementsEmptyCategory', undefined, 'Aucun achievement dans cette catégorie')
        }
      </Text>
    </View>
  );

  const renderContent = () => {
    if (!data) return renderEmptyState();

    const filteredAchievements = selectedTab === 'all' 
      ? data.achievements 
      : data.grouped[selectedTab] || [];

    if (filteredAchievements.length === 0) {
      return renderEmptyState();
    }

    return (
      <View style={styles.achievementsGrid}>
        {filteredAchievements.map(renderAchievementCard)}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>
          {t('achievementsLoading', undefined, 'Chargement des succès...')}
        </Text>
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
        <Text style={styles.headerTitle}>
          {t('achievementsTitle', undefined, 'Succès')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header Info */}
        <View style={styles.headerInfo}>
          <Text style={styles.title}>
            {t('achievementsTitle', undefined, 'Achievements')}
          </Text>
          <Text style={styles.subtitle}>
            {t('achievementsSubtitle', undefined, 'Débloquez des récompenses en accomplissant vos objectifs')}
          </Text>
          {data && (
            <View style={styles.statsContainer}>
              <Text style={styles.statsNumber}>
                {data.totalUnlocked}/{data.totalAvailable}
              </Text>
              <Text style={styles.statsLabel}>
                {t('achievementsUnlockedShort', undefined, 'Débloqués')}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Card */}
        {renderProgressCard()}

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}
          >
            {renderTabButton('all', getTypeName('all'))}
            {(['STREAK', 'HABITS', 'PERFECT_DAY', 'POINTS', 'TASKS', 'OBJECTIVES'] as TabType[]).map((type) =>
              renderTabButton(type, getTypeName(type))
            )}
          </ScrollView>
        </View>

        {/* Content */}
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsContainer: {
    alignItems: 'center',
  },
  statsNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  statsLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  progressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressStats: {
    alignItems: 'flex-start',
  },
  progressPercentage: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarContainer: {
    flex: 1,
    marginLeft: 16,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  tabsContainer: {
    marginBottom: 24,
  },
  tabsContent: {
    paddingHorizontal: 4,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minWidth: 80,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#10B981',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  tabTextActive: {
    color: 'white',
  },
  achievementsGrid: {
    gap: 16,
  },
  achievementCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  achievementCardUnlocked: {
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  achievementCardLocked: {
    opacity: 0.75,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unlockedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: {
    gap: 8,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  achievementTitleLocked: {
    color: '#6B7280',
  },
  achievementMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pointsText: {
    fontSize: 12,
    color: '#6B7280',
  },
  achievementDescription: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  achievementDescriptionLocked: {
    color: '#9CA3AF',
  },
  unlockedDate: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  objectiveContainer: {
    marginTop: 4,
  },
  objectiveLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  objectiveValue: {
    fontSize: 12,
    color: '#374151',
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
});

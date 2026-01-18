import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { apiCall } from '@/lib/api';
import { useLanguage } from '@/contexts/LanguageContext';

const { width } = Dimensions.get('window');

interface LeaderboardEntry {
  userId: string;
  userName: string;
  userEmail: string;
  points: number;
  level: number;
  rank: number;
  currentStreak: number;
  longestStreak: number;
  tasksCompleted: number;
  habitsCompleted: number;
  perfectDays: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  userRank?: number;
  totalUsers: number;
}

const LEVEL_COLORS = {
  1: '#6B7280',
  2: '#3B82F6',
  3: '#10B981',
  4: '#8B5CF6',
  5: '#F59E0B',
} as const;

export default function LeaderboardScreen() {
  const { t } = useLanguage();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const displayLimit = showAll ? 100 : 10;

  const fetchLeaderboard = async () => {
    try {
      setError(null);
      const params = new URLSearchParams({
        limit: '100',
        includeUserRank: 'true'
      });
      
      const response = await apiCall(`/gamification/leaderboard?${params}`);
      setData(response);
    } catch (error: any) {
      console.error('Erreur lors du chargement du leaderboard:', error);
      const message = error instanceof Error ? error.message : "Impossible de charger le classement";
      const status = error?.status;
      const isLocked = error?.locked === true;
      const feature = error?.feature;
      
      // Gestion spécifique des erreurs Premium/403
      if (status === 403 || isLocked || (message && (
        message.toLowerCase().includes('premium') ||
        message.toLowerCase().includes('plan premium') ||
        message.toLowerCase().includes('réservé au plan premium') ||
        message.toLowerCase().includes('leaderboard global')
      ))) {
        Alert.alert(
          t('leaderboardPremiumTitle', undefined, 'Leaderboard Premium'),
          t('leaderboardPremiumMessage', undefined, 'Le classement global est réservé au plan Premium. Débloquez cette fonctionnalité pour comparer votre progression avec la communauté mondiale.'),
          [
            { text: t('later', undefined, 'Plus tard'), style: 'cancel' },
            { text: t('upgrade', undefined, 'Passer en Premium'), onPress: () => router.push('/paywall') }
          ]
        );
        setError('Leaderboard Premium - Upgrade requis');
      } else if (status === 401 || (message && (message.includes('Non authentifié') || message.includes('401')))) {
        Alert.alert(
          t('authErrorTitle', undefined, "Erreur d'authentification"),
          t('leaderboardAuthError', undefined, 'Vous devez être connecté pour voir le leaderboard. Veuillez vous reconnecter.'),
          [{ text: t('ok', undefined, 'OK') }]
        );
        setError('Authentification requise');
      } else if (message && (message.includes('réseau') || message.includes('timeout'))) {
        Alert.alert(
          t('connectionError', undefined, 'Erreur de connexion'),
          t('checkConnection', undefined, 'Vérifiez votre connexion internet et réessayez.'),
          [{ text: t('ok', undefined, 'OK') }]
        );
        setError(message);
      } else {
        setError(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    await fetchLeaderboard();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaderboard();
    setRefreshing(false);
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Ionicons name="trophy" size={20} color="#F59E0B" />;
      case 2:
        return <Ionicons name="medal" size={20} color="#9CA3AF" />;
      case 3:
        return <Ionicons name="medal" size={20} color="#D97706" />;
      default:
        return (
          <View style={styles.rankNumber}>
            <Text style={styles.rankNumberText}>{rank}</Text>
          </View>
        );
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return '#FEF3C7';
    if (rank === 2) return '#F3F4F6';
    if (rank === 3) return '#FED7AA';
    return '#F9FAFB';
  };

  const getLevelColor = (level: number) => {
    return LEVEL_COLORS[Math.min(level, 5) as keyof typeof LEVEL_COLORS] || '#6B7280';
  };

  const renderUserRankCard = () => {
    if (!data?.userRank) return null;

    return (
      <View style={styles.userRankCard}>
        <View style={styles.userRankHeader}>
          <Ionicons name="person" size={20} color="#10B981" />
          <Text style={styles.userRankTitle}>{t('leaderboardYourPosition', undefined, 'Votre position')}</Text>
        </View>
        <View style={styles.userRankContent}>
          <View style={styles.userRankStats}>
            <Text style={styles.userRankPosition}>#{data.userRank}</Text>
            <Text style={styles.userRankTotal}>{t('leaderboardTotalUsers', { total: data.totalUsers }, `sur ${data.totalUsers} utilisateurs`)}</Text>
          </View>
          <View style={styles.userRankBadge}>
            <Ionicons name="trending-up" size={16} color="#10B981" />
          </View>
        </View>
      </View>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => (
    <View
      key={entry.userId}
      style={[
        styles.entryCard,
        entry.rank <= 3 && styles.topEntryCard,
        { backgroundColor: getRankBadgeColor(entry.rank) }
      ]}
    >
      {/* Rang */}
      <View style={styles.rankContainer}>
        {getRankIcon(entry.rank)}
      </View>

      {/* Informations utilisateur */}
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName} numberOfLines={1}>
            {entry.userName}
          </Text>
          <View style={styles.levelContainer}>
            <Ionicons 
              name="ribbon" 
              size={14} 
              color={getLevelColor(entry.level)} 
            />
            <Text style={[styles.levelText, { color: getLevelColor(entry.level) }]}>
              Niv. {entry.level}
            </Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={12} color="#F59E0B" />
            <Text style={styles.statText}>{entry.points} pts</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="flame" size={12} color="#EF4444" />
            <Text style={styles.statText}>{entry.currentStreak}j</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            <Text style={styles.statText}>{entry.tasksCompleted}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="fitness" size={12} color="#8B5CF6" />
            <Text style={styles.statText}>{entry.habitsCompleted}</Text>
          </View>
        </View>
      </View>

      {/* Badge de rang pour le top 3 */}
      {entry.rank <= 3 && (
        <View style={styles.topBadge}>
          <Text style={styles.topBadgeText}>TOP {entry.rank}</Text>
        </View>
      )}
    </View>
  );

  const renderContent = () => {
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#EF4444" />
          <Text style={styles.errorTitle}>Erreur</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
            <Ionicons name="refresh" size={20} color="white" />
            <Text style={styles.retryButtonText}>{t('retry')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!data || data.leaderboard.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={64} color="#9CA3AF" />
          <Text style={styles.emptyTitle}>{t('leaderboardEmptyTitle', undefined, 'Aucun classement')}</Text>
          <Text style={styles.emptyMessage}>
            {t('leaderboardEmptyMessage', undefined, "Le classement sera disponible une fois que des utilisateurs auront commencé à utiliser l'application")}
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.contentContainer}>
        {/* Rang de l'utilisateur */}
        {renderUserRankCard()}

        {/* Statistiques générales */}
        <View style={styles.statsCard}>
          <View style={styles.statsHeader}>
            <Ionicons name="people" size={20} color="#3B82F6" />
            <Text style={styles.statsTitle}>{t('leaderboardCommunity', undefined, 'Communauté')}</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{data.totalUsers}</Text>
              <Text style={styles.statBoxLabel}>{t('users', undefined, 'Utilisateurs')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>{data.leaderboard.length}</Text>
              <Text style={styles.statBoxLabel}>{t('leaderboardActive', undefined, 'Actifs')}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statBoxNumber}>
                {data.leaderboard[0]?.points || 0}
              </Text>
              <Text style={styles.statBoxLabel}>{t('leaderboardRecord', undefined, 'Record')}</Text>
            </View>
          </View>
        </View>

        {/* Liste du classement */}
        <View style={styles.leaderboardContainer}>
          <View style={styles.leaderboardHeader}>
            <Text style={styles.leaderboardTitle}>
              {t('leaderboardTop', { count: displayLimit }, `Top ${displayLimit}`)}
            </Text>
            {data.leaderboard.length > 10 && (
              <TouchableOpacity
                style={styles.toggleButton}
                onPress={() => setShowAll(!showAll)}
              >
                <Text style={styles.toggleButtonText}>
                  {showAll ? t('seeLess', undefined, 'Voir moins') : t('seeAllWithCount', { count: data.leaderboard.length }, `Voir tout (${data.leaderboard.length})`)}
                </Text>
                <Ionicons 
                  name={showAll ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#6B7280" 
                />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.leaderboardList}>
            {data.leaderboard.slice(0, displayLimit).map(renderLeaderboardEntry)}
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>{t('leaderboardLoading', undefined, 'Chargement du classement...')}</Text>
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
        <Text style={styles.headerTitle}>{t('leaderboardTitle', undefined, 'Classement')}</Text>
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
          <Text style={styles.title}>{t('leaderboardTitle', undefined, 'Classement')}</Text>
          <Text style={styles.subtitle}>
            {t('leaderboardSubtitle', undefined, 'Découvrez les utilisateurs les plus performants et comparez votre progression avec la communauté')}
          </Text>
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
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  contentContainer: {
    gap: 20,
  },
  userRankCard: {
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
    borderWidth: 1,
    borderColor: '#10B981',
  },
  userRankHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userRankTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  userRankContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  userRankStats: {
    alignItems: 'flex-start',
  },
  userRankPosition: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  userRankTotal: {
    fontSize: 14,
    color: '#6B7280',
  },
  userRankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
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
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statBoxNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  leaderboardContainer: {
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
  leaderboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  leaderboardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  toggleButtonText: {
    fontSize: 14,
    color: '#6B7280',
  },
  leaderboardList: {
    gap: 12,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    position: 'relative',
  },
  topEntryCard: {
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  rankContainer: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  userName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    marginRight: 8,
  },
  levelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  levelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    color: '#6B7280',
  },
  topBadge: {
    position: 'absolute',
    top: -6,
    right: 8,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  topBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
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
  emptyMessage: {
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

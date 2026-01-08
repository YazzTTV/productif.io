import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService, googleCalendarService } from '@/lib/api';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { checkPremiumStatus } from '@/utils/premium';
import { useLanguage } from '@/contexts/LanguageContext';

interface KeyMoment {
  time: string;
  label: string;
  type: 'focus' | 'break';
  active: boolean;
}

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: string;
  end: string;
  timeZone: string;
  isAllDay?: boolean;
  isProductif: boolean;
}

export function DashboardEnhanced() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? t('goodMorning') : currentHour < 18 ? t('goodAfternoon') : t('goodEvening');

  // Convertir les événements Google Calendar en KeyMoments
  const keyMoments: KeyMoment[] = React.useMemo(() => {
    if (!calendarEvents.length) {
      // Si pas d'événements, retourner un tableau vide
      return [];
    }

    const now = new Date();
    
    return calendarEvents
      .filter((event) => {
        // Filtrer les événements all-day (on ne les affiche pas dans la timeline)
        if (event.isAllDay) {
          return false;
        }
        // Vérifier que l'événement a une date valide
        try {
          const startTime = parseISO(event.start);
          return !isNaN(startTime.getTime());
        } catch {
          return false;
        }
      })
      .slice(0, 5) // Limiter à 5 événements
      .map((event) => {
        try {
          const startTime = parseISO(event.start);
          const endTime = parseISO(event.end);
          
          // Un événement est actif s'il a commencé et n'est pas encore terminé
          const isActive = isBefore(startTime, now) && isAfter(endTime, now);
          
          return {
            time: format(startTime, 'HH:mm'),
            label: event.summary,
            type: event.isProductif ? 'focus' : 'break',
            active: isActive,
          };
        } catch (error) {
          console.error('Erreur parsing date événement:', error);
          return null;
        }
      })
      .filter((moment): moment is KeyMoment => moment !== null);
  }, [calendarEvents]);

  const loadData = async () => {
    try {
      const user = await authService.checkAuth();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]);
      }

      // Check premium status
      const premiumStatus = await checkPremiumStatus();
      setIsPremium(premiumStatus.isPremium);

      // Récupérer les événements Google Calendar
      try {
        const calendarData = await googleCalendarService.getTodayEvents();
        setIsCalendarConnected(calendarData.connected);
        if (calendarData.connected && calendarData.events) {
          setCalendarEvents(calendarData.events);
        } else {
          setCalendarEvents([]);
        }
      } catch (error) {
        console.error('Erreur récupération événements Google Calendar:', error);
        setCalendarEvents([]);
        setIsCalendarConnected(false);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#16A34A" />
        }
      >
        {/* Greeting Header */}
        <Animated.View entering={FadeInUp.delay(100).duration(400)} style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{greeting}</Text>
              <Text style={styles.userName}>{userName || 'dwxcw'}</Text>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/parametres')}
            >
              <Ionicons name="settings-outline" size={20} color="#000" />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <View style={styles.content}>
          {/* Today's Structure Card */}
          <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('todaysStructure') || 'Today\'s structure'}</Text>
            <View style={styles.structureCard}>
              <View style={styles.structureContent}>
                {/* Main Focus Block */}
                <View style={styles.focusBlock}>
                  <View style={styles.timeBadge}>
                    <Ionicons name="time-outline" size={16} color="#16A34A" />
                    <Text style={styles.timeText}>09:00 - 10:30</Text>
                  </View>
                  <Text style={styles.focusTitle}>Complete Chapter 12 Summary</Text>
                  <Text style={styles.focusSubject}>Organic Chemistry</Text>
                </View>

                {/* Key Tasks */}
                <View style={styles.tasksSection}>
                  <View style={styles.taskItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.taskText}>Review lecture notes · 30 min</Text>
                  </View>
                  <View style={styles.taskItem}>
                    <View style={styles.bullet} />
                    <Text style={styles.taskText}>Practice problems 15-20 · 45 min</Text>
                  </View>
                </View>

                {/* Daily Habit */}
                <View style={styles.habitSection}>
                  <View style={styles.habitTag}>
                    <View style={styles.habitDot} />
                    <Text style={styles.habitText}>Morning review</Text>
                  </View>
                </View>
              </View>

              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.startFocusButton}
                onPress={() => router.push('/focus')}
                activeOpacity={0.8}
              >
                <Text style={styles.startFocusText}>{t('startFocus')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Key Moments Timeline */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('keyMomentsToday') || 'Key moments today'}</Text>
            {keyMoments.length > 0 ? (
              <View style={styles.timeline}>
                {keyMoments.map((moment, index) => (
                  <View key={index} style={styles.timelineItem}>
                    <View style={styles.timelineLeft}>
                      <View style={[
                        styles.timelineDot,
                        moment.active && styles.timelineDotActive
                      ]} />
                      {index < keyMoments.length - 1 && (
                        <View style={[
                          styles.timelineLine,
                          moment.active && styles.timelineLineActive
                        ]} />
                      )}
                    </View>
                    <View style={[
                      styles.timelineCard,
                      moment.active && styles.timelineCardActive
                    ]}>
                      <View style={styles.timelineCardContent}>
                        <Text style={[
                          styles.timelineTime,
                          moment.active && styles.timelineTimeActive
                        ]}>
                          {moment.time}
                        </Text>
                        <Text style={[
                          styles.timelineLabel,
                          moment.active && styles.timelineLabelActive
                        ]}>
                          {moment.label}
                        </Text>
                      </View>
                      {moment.type === 'focus' && moment.active && (
                        <View style={styles.activePulse} />
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCalendarContainer}>
                {isCalendarConnected ? (
                  <Text style={styles.emptyCalendarText}>{t('noEventsToday') || 'Aucun événement aujourd\'hui'}</Text>
                ) : (
                  <View style={styles.connectCalendarContainer}>
                    <Text style={styles.emptyCalendarText}>{t('connectCalendarDescription') || 'Connectez votre Google Calendar pour voir vos événements'}</Text>
                    <TouchableOpacity
                      style={styles.connectCalendarButton}
                      onPress={() => router.push('/parametres')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.connectCalendarButtonText}>{t('connect') || 'Connecter'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </Animated.View>

          {/* Community Progress Card */}
          <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.section}>
            <TouchableOpacity
              style={styles.communityCard}
              onPress={() => router.push('/(tabs)/leaderboard')}
              activeOpacity={0.7}
            >
              <View style={styles.communityHeader}>
                <View>
                  <Text style={styles.communityTitle}>{t('communityProgress') || 'Community Progress'}</Text>
                  <Text style={styles.communitySubtitle}>{t('yourGroupThisWeek') || 'Your group this week'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.2)" />
              </View>

              <View style={styles.avatarGroup}>
                {['M', 'You', 'A', 'E', 'L'].map((initial, index) => (
                  <View key={index} style={styles.avatarContainer}>
                    <View style={[
                      styles.progressBar,
                      initial === 'You' && styles.progressBarActive
                    ]}>
                      <View style={[
                        styles.progressFill,
                        initial === 'You' && styles.progressFillActive,
                        { height: `${85 - index * 5}%` }
                      ]} />
                    </View>
                    <View style={[
                      styles.avatar,
                      initial === 'You' && styles.avatarActive
                    ]}>
                      <Text style={[
                        styles.avatarText,
                        initial === 'You' && styles.avatarTextActive
                      ]}>
                        {initial === 'You' ? '✓' : initial}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.communityFooter}>
                <Text style={styles.viewLeaderboardText}>{t('viewFullLeaderboard') || 'View full leaderboard →'}</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Microcopy */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.microcopy}>
            <Text style={styles.microcopyText}>{t('everythingElseHandled') || 'Everything else is handled.'}</Text>
          </Animated.View>

          {/* Bottom spacing */}
          <View style={{ height: 120 }} />
        </View>
      </ScrollView>
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
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    marginBottom: 4,
  },
  userName: {
    fontSize: 32,
    fontWeight: '600',
    letterSpacing: -1.2,
    color: '#000000',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    gap: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    marginBottom: 12,
  },
  structureCard: {
    padding: 32,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(22, 163, 74, 0.2)',
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  structureContent: {
    gap: 24,
  },
  focusBlock: {
    gap: 12,
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#16A34A',
  },
  focusTitle: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: '#000000',
  },
  focusSubject: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  tasksSection: {
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  taskText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  habitSection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  habitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  habitDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#16A34A',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  habitText: {
    fontSize: 15,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  startFocusButton: {
    marginTop: 32,
    backgroundColor: '#16A34A',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  startFocusText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    marginTop: 8,
  },
  timelineDotActive: {
    backgroundColor: '#16A34A',
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 4,
    borderColor: 'rgba(22, 163, 74, 0.2)',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 40,
  },
  timelineLineActive: {
    backgroundColor: '#16A34A',
  },
  timelineCard: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timelineCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(22, 163, 74, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineCardContent: {
    flex: 1,
  },
  timelineTime: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.5)',
    marginBottom: 4,
  },
  timelineTimeActive: {
    color: '#16A34A',
  },
  timelineLabel: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
  },
  timelineLabelActive: {
    color: '#000000',
    fontWeight: '500',
  },
  activePulse: {
    position: 'absolute',
    right: 16,
    top: '50%',
    marginTop: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16A34A',
  },
  communityCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    backgroundColor: '#FFFFFF',
  },
  communityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  communityTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 4,
  },
  communitySubtitle: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
  },
  avatarGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
    marginBottom: 24,
  },
  avatarContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '100%',
    height: 64,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  progressBarActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  progressFill: {
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 8,
  },
  progressFillActive: {
    backgroundColor: '#16A34A',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarActive: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0, 0, 0, 0.4)',
  },
  avatarTextActive: {
    fontSize: 18,
    color: '#16A34A',
  },
  communityFooter: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  viewLeaderboardText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  microcopy: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  microcopyText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    fontStyle: 'italic',
  },
  emptyCalendarContainer: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  emptyCalendarText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.4)',
    textAlign: 'center',
  },
  connectCalendarContainer: {
    alignItems: 'center',
    gap: 16,
  },
  connectCalendarButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
    marginTop: 8,
  },
  connectCalendarButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});


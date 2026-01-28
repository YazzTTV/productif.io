import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService, gamificationService, googleCalendarService } from '@/lib/api';
import { format, parseISO, isBefore, isAfter } from 'date-fns';
import { checkPremiumStatus } from '@/utils/premium';
import { useLanguage } from '@/contexts/LanguageContext';
import { selectExamTasks, TaskForExam } from '@/utils/taskSelection';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

interface GroupMember {
  userId: string;
  userName: string | null;
  totalPoints: number;
}

export function DashboardEnhanced() {
  const { t } = useLanguage();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const timelineScrollRef = useRef<ScrollView>(null);
  const timelineItemPositions = useRef<{ [key: number]: number }>({});
  
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isCalendarConnected, setIsCalendarConnected] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [primaryTask, setPrimaryTask] = useState<TaskForExam | null>(null);
  const [nextTasks, setNextTasks] = useState<TaskForExam[]>([]);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [groupAveragePoints, setGroupAveragePoints] = useState<number | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [favoriteGroupId, setFavoriteGroupId] = useState<string | null>(null);

  const FAVORITE_GROUP_KEY = 'favorite_group_id';

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
      // Afficher TOUS les événements sans limite
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

      if (user) {
        const storedFavoriteGroupId = await AsyncStorage.getItem(FAVORITE_GROUP_KEY);
        setFavoriteGroupId(storedFavoriteGroupId);
        const { primary, next } = await selectExamTasks();
        setPrimaryTask(primary);
        setNextTasks(next);
        const groups = await gamificationService.getUserGroups();
        if (groups.length > 0) {
          const selectedGroup =
            groups.find((group) => group.id === storedFavoriteGroupId) || groups[0];
          setGroupName(selectedGroup.name || null);
          const leaderboard = await gamificationService.getGroupLeaderboard(selectedGroup.id);
          const members = leaderboard.map((entry) => ({
            userId: entry.userId,
            userName: entry.userName,
            totalPoints: entry.totalPoints || 0,
          }));
          const totalPoints = members.reduce((sum, member) => sum + member.totalPoints, 0);
          const averagePoints = members.length > 0 ? Math.round(totalPoints / members.length) : 0;
          setGroupAveragePoints(averagePoints);
          setGroupMembers(members);
        } else {
          setGroupName(null);
          setGroupAveragePoints(null);
          setGroupMembers([]);
        }
      } else {
        setPrimaryTask(null);
        setNextTasks([]);
        setGroupName(null);
        setGroupAveragePoints(null);
        setGroupMembers([]);
        setFavoriteGroupId(null);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Scroll automatique vers l'événement actif ou le prochain événement
  useEffect(() => {
    if (keyMoments.length > 0) {
      // Trouver l'index de l'événement actif ou du prochain événement
      const activeIndex = keyMoments.findIndex(moment => moment.active);
      const now = new Date();
      
      let targetIndex = -1;
      
      if (activeIndex !== -1) {
        // Si un événement est actif, scroller vers celui-ci
        targetIndex = activeIndex;
      } else {
        // Sinon, trouver le prochain événement à venir
        for (let i = 0; i < keyMoments.length; i++) {
          const [hours, minutes] = keyMoments[i].time.split(':').map(Number);
          const eventTime = new Date();
          eventTime.setHours(hours, minutes, 0, 0);
          
          if (eventTime > now) {
            targetIndex = i;
            break;
          }
        }
      }
      
      // Scroller vers l'événement cible avec un délai pour laisser le temps au rendu
      if (targetIndex !== -1 && timelineItemPositions.current[targetIndex] !== undefined) {
        setTimeout(() => {
          const yPosition = timelineItemPositions.current[targetIndex];
          timelineScrollRef.current?.scrollTo({
            y: Math.max(0, yPosition - 50), // Offset pour centrer l'événement
            animated: true,
          });
        }, 500);
      }
    }
  }, [keyMoments]);

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
              <Text style={styles.userName}>{userName || t('user')}</Text>
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
            <Text style={styles.sectionLabel}>{t('todaysStructure')}</Text>
            <View style={styles.structureCard}>
              <View style={styles.structureContent}>
                {/* Main Focus Block */}
                <View style={styles.focusBlock}>
                  {primaryTask?.estimatedTime ? (
                    <View style={styles.timeBadge}>
                      <Ionicons name="time-outline" size={16} color="#16A34A" />
                      <Text style={styles.timeText}>{primaryTask.estimatedTime} min</Text>
                    </View>
                  ) : null}
                  <Text style={styles.focusTitle}>
                    {primaryTask?.title || t('noTasksAvailable')}
                  </Text>
                  <Text style={styles.focusSubject}>
                    {primaryTask?.subjectName || t('noTasks')}
                  </Text>
                </View>

                {/* Key Tasks */}
                {nextTasks.length > 0 ? (
                  <View style={styles.tasksSection}>
                    {nextTasks.map((task) => (
                      <View key={task.id} style={styles.taskItem}>
                        <View style={styles.bullet} />
                        <Text style={styles.taskText}>
                          {task.title}
                          {task.subjectName ? ` · ${task.subjectName}` : ''}
                          {task.estimatedTime ? ` · ${task.estimatedTime} min` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Primary CTA */}
              <TouchableOpacity
                style={styles.startFocusButton}
                onPress={() => {
                  if (primaryTask) {
                    router.push({
                      pathname: '/focus',
                      params: {
                        taskId: primaryTask.id,
                        title: primaryTask.title,
                        subject: primaryTask.subjectName,
                        duration: primaryTask.estimatedTime,
                      },
                    });
                  } else {
                    router.push('/focus');
                  }
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.startFocusText}>{t('startFocus')}</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Key Moments Timeline */}
          <Animated.View entering={FadeInDown.delay(250).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>{t('keyMomentsToday')}</Text>
            {keyMoments.length > 0 ? (
              <ScrollView
                ref={timelineScrollRef}
                style={styles.timelineScrollView}
                nestedScrollEnabled={true}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.timeline}>
                  {keyMoments.map((moment, index) => (
                    <View 
                      key={index} 
                      style={styles.timelineItem}
                      onLayout={(event) => {
                        const { y } = event.nativeEvent.layout;
                        timelineItemPositions.current[index] = y;
                      }}
                    >
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
              </ScrollView>
            ) : (
              <View style={styles.emptyCalendarContainer}>
                {isCalendarConnected ? (
                  <Text style={styles.emptyCalendarText}>{t('noEventsToday')}</Text>
                ) : (
                  <View style={styles.connectCalendarContainer}>
                    <Text style={styles.emptyCalendarText}>{t('connectCalendarDescription')}</Text>
                    <TouchableOpacity
                      style={styles.connectCalendarButton}
                      onPress={() => router.push('/parametres')}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.connectCalendarButtonText}>{t('connect')}</Text>
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
                  <Text style={styles.communityTitle}>{t('communityProgress')}</Text>
                  <Text style={styles.communitySubtitle}>
                    {groupName || t('yourGroupThisWeek')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="rgba(0,0,0,0.2)" />
              </View>

              <View style={styles.avatarGroup}>
                {groupMembers.length > 0 ? (
                  groupMembers.slice(0, 5).map((member, index) => {
                    const initial = member.userName?.trim().charAt(0).toUpperCase() || '?';
                    const maxPoints = Math.max(...groupMembers.map(m => m.totalPoints || 0), 1);
                    const height = Math.max(25, Math.round((member.totalPoints / maxPoints) * 90));
                    return (
                      <View key={member.userId} style={styles.avatarContainer}>
                        <View style={styles.progressBar}>
                          <View style={[styles.progressFill, { height: `${height}%` }]} />
                        </View>
                        <View style={styles.avatar}>
                          <Text style={styles.avatarText}>{initial}</Text>
                        </View>
                      </View>
                    );
                  })
                ) : (
                  <Text style={styles.emptyCommunityText}>
                    {t('noGroupFound', undefined, 'Aucun groupe trouvé')}
                  </Text>
                )}
              </View>

              <View style={styles.communityFooter}>
                {groupAveragePoints !== null ? (
                  <Text style={styles.viewLeaderboardText}>
                    {t('groupAverage') + ` : ${groupAveragePoints}`}
                  </Text>
                ) : (
                  <Text style={styles.viewLeaderboardText}>
                    {t('viewFullLeaderboard') || 'View full leaderboard →'}
                  </Text>
                )}
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
    borderWidth: 1.5,
    borderColor: 'rgba(22, 163, 74, 0.25)',
    backgroundColor: 'rgba(22, 163, 74, 0.08)',
    // Ombre iOS uniquement
    shadowColor: '#16A34A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: 8,
    // Pas d'elevation sur Android - cause des problèmes avec les fonds transparents
    elevation: 0,
  },
  structureContent: {
    gap: 24,
    backgroundColor: 'transparent',
  },
  focusBlock: {
    gap: 12,
    backgroundColor: 'transparent',
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
    backgroundColor: 'transparent',
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
  timelineScrollView: {
    maxHeight: 400, // Hauteur maximale pour la timeline scrollable
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
  emptyCommunityText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.5)',
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

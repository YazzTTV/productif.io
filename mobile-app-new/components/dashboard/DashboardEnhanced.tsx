import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authService } from '@/lib/api';

interface KeyMoment {
  time: string;
  label: string;
  type: 'focus' | 'break';
  active: boolean;
}

export function DashboardEnhanced() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  
  const [userName, setUserName] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

  const keyMoments: KeyMoment[] = [
    { time: '09:00', label: 'Morning focus', type: 'focus', active: true },
    { time: '11:30', label: 'Break', type: 'break', active: false },
    { time: '14:00', label: 'Afternoon focus', type: 'focus', active: false },
  ];

  const loadData = async () => {
    try {
      const user = await authService.checkAuth();
      if (user?.name) {
        setUserName(user.name.split(' ')[0]);
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
            <Text style={styles.sectionLabel}>Today's structure</Text>
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
                <Text style={styles.startFocusText}>Start to Focus</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Key Moments Timeline */}
          <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.section}>
            <Text style={styles.sectionLabel}>Key moments today</Text>
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
          </Animated.View>

          {/* Community Progress Card */}
          <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.section}>
            <TouchableOpacity
              style={styles.communityCard}
              onPress={() => router.push('/(tabs)/leaderboard')}
              activeOpacity={0.7}
            >
              <View style={styles.communityHeader}>
                <View>
                  <Text style={styles.communityTitle}>Community Progress</Text>
                  <Text style={styles.communitySubtitle}>Your group this week</Text>
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
                <Text style={styles.viewLeaderboardText}>View full leaderboard →</Text>
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Microcopy */}
          <Animated.View entering={FadeInDown.delay(700).duration(400)} style={styles.microcopy}>
            <Text style={styles.microcopyText}>Everything else is handled.</Text>
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
});

